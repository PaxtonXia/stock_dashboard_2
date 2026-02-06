// 最强风口相关功能 - 板块卡片展示
class HotspotManager {
    constructor() {
        this.container = document.getElementById('hotspotContainer');
        this.plateCardsGrid = document.getElementById('plateCardsGrid');
        this.loadingElement = document.getElementById('loading-hotspot');
        this.errorElement = document.getElementById('error-hotspot');
        // 热点股票数据存储
        this.hotspotStocksData = {};
        // 板块走势图实例存储
        this.plateCharts = {};
    }
    
    // 生成交易时间轴（9:30-11:30, 13:00-15:00）
    generateTradingTimeAxis() {
        const times = [];
        // 上午
        for (let h = 9; h <= 11; h++) {
            for (let m = 0; m < 60; m++) {
                if (h === 9 && m < 30) continue;
                if (h === 11 && m >= 30) break;
                times.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
            }
        }
        // 下午
        for (let h = 13; h < 15; h++) {
            for (let m = 0; m < 60; m++) {
                times.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
            }
        }
        return times;
    }
    
    // 获取热点股票数据
    async fetchHotspotStocks() {
        try {
            const response = await fetch('https://flash-api.xuangubao.com.cn/api/surge_stock/stocks?normal=true&uplimit=true');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return this.processHotspotStocksData(data);
        } catch (error) {
            console.error('获取热点股票数据失败:', error);
            return {};
        }
    }
    
    // 处理热点股票数据
    processHotspotStocksData(response) {
        if (response && response.code === 20000 && response.data && response.data.items) {
            const stocksData = {};
            response.data.items.forEach(stock => {
                if (stock[8]) { // plates array
                    stock[8].forEach(plate => {
                        if (!stocksData[plate.id]) {
                            stocksData[plate.id] = [];
                        }
                        stocksData[plate.id].push(stock);
                    });
                }
            });
            // 同时返回 fields 信息
            return {
                stocks: stocksData,
                fields: response.data.fields || []
            };
        }
        return { stocks: {}, fields: [] };
    }
    
    // 从接口获取热点板块数据
    async fetchHotspotData() {
        try {
            // 并行获取板块数据和股票数据
            const [platesResponse, stocksData] = await Promise.all([
                fetch('https://flash-api.xuangubao.com.cn/api/surge_stock/plates'),
                this.fetchHotspotStocks()
            ]);
            
            if (!platesResponse.ok) {
                throw new Error(`HTTP error! status: ${platesResponse.status}`);
            }
            
            const platesData = await platesResponse.json();
            this.hotspotStocksData = stocksData;
            
            // 处理板块数据并获取走势数据
            const plates = this.processApiData(platesData);
            
            // 为每个板块获取走势数据并计算实际涨幅
            const platesWithTrend = await Promise.all(plates.map(async (plate) => {
                const trendData = await this.fetchPlateTrendData(plate.id);
                if (trendData && trendData.data && trendData.data.length > 0) {
                    // 找到最后一个有效数据点
                    let lastValue = null;
                    for (let i = trendData.data.length - 1; i >= 0; i--) {
                        if (trendData.data[i] !== null && trendData.data[i] !== undefined) {
                            lastValue = trendData.data[i];
                            break;
                        }
                    }
                    if (lastValue !== null) {
                        plate.increase = parseFloat(lastValue);
                    }
                }
                return plate;
            }));
            
            return platesWithTrend;
        } catch (error) {
            console.error('获取热点数据失败:', error);
            return [];
        }
    }
    
    // 根据股票代码判断涨停幅度
    getLimitUpPercent(stockCode) {
        if (!stockCode) return 10; // 默认10%
        
        const code = stockCode.toString();
        
        // ST股票：5%涨停
        if (code.startsWith('ST') || code.startsWith('*ST') || 
            code.startsWith('st') || code.startsWith('*st')) {
            return 5;
        }
        
        // 创业板（300开头）：20%涨停
        if (code.startsWith('300')) {
            return 20;
        }
        
        // 科创板（688开头）：20%涨停
        if (code.startsWith('688')) {
            return 20;
        }
        
        // 北交所（8开头，如830、831、832等）：30%涨停
        if (code.startsWith('8')) {
            return 30;
        }
        
        // 其他股票：10%涨停
        return 10;
    }
    
    // 处理API返回的数据
    processApiData(apiData) {
        if (!apiData?.data?.items || !Array.isArray(apiData.data.items)) {
            return [];
        }
        
        // 过滤掉"其他"和"ST股"板块
        const filteredPlates = apiData.data.items.filter(plate => {
            const plateName = plate.name || '';
            // 过滤掉包含"其他"或"ST"的板块
            return !plateName.includes('其他') && !plateName.includes('ST');
        });
        
        // 返回过滤后的板块数据
        return filteredPlates.map(plate => {
            // 尝试多种可能的ID字段
            const plateId = plate.id || plate.plate_id || plate.uid;
            const stocks = this.hotspotStocksData.stocks[plateId] || [];
            
            const processedStocks = stocks.map(stock => {
                const changePercent = (stock[3] * 100).toFixed(2);
                const stockCode = stock[0].split('.')[0]; // 去掉 .ss 或 .sz 后缀
                const change = parseFloat(changePercent) || 0;
                
                // 查找涨停状态字段的位置 - 参考 new_hotspot.html
                let isLimitUp = false;
                const fields = this.hotspotStocksData.fields || [];
                for (let i = 0; i < fields.length; i++) {
                    if (fields[i] === 'up_limit') {
                        isLimitUp = stock[i];
                        break;
                    }
                }
                
                // 根据股票代码获取正确的涨停幅度
                const limitUpPercent = this.getLimitUpPercent(stockCode);
                
                return {
                    name: stock[1] || '未知',
                    code: stockCode || '000000',
                    change: change,
                    isLimitUp: isLimitUp,
                    price: stock[2] || 0,
                    turnover: (stock[10] * 100).toFixed(2),
                    marketValue: (stock[4] / 100000000).toFixed(2),
                    description: stock[5] || '',
                    url: `redball.html##${stockCode}##`,
                    // 根据正确的涨停幅度计算进度 (0-100)
                    limitProgress: Math.min(100, Math.max(0, (change / limitUpPercent) * 100)),
                    // 添加涨停幅度信息用于显示
                    limitUpPercent: limitUpPercent
                };
            });
            
            return {
                id: plateId,
                name: plate.name || '未知板块',
                increase: plate.pcp ? (plate.pcp * 100) : 0,
                amount: plate.turnover || plate.volume || 0,
                description: plate.description || this.generateDescription(plate),
                stocks: processedStocks
            };
        });
    }
    
    // 生成板块描述
    generateDescription(plate) {
        const increase = plate.pcp ? (plate.pcp * 100) : 0;
        
        if (increase > 5) {
            return `${plate.name || '该板块'}强势上涨，资金流入明显，市场关注度显著提升`;
        } else if (increase > 3) {
            return `${plate.name || '该板块'}表现活跃，成交放量，板块内个股普涨`;
        } else if (increase > 0) {
            return `${plate.name || '该板块'}小幅上涨，市场情绪平稳，资金小幅流入`;
        } else {
            return `${plate.name }`;
        }
    }

    // 格式化金额
    formatAmount(amount) {
        if (amount >= 100000000) {
            return (amount / 100000000).toFixed(1) + '亿';
        }
        return (amount / 10000).toFixed(0) + '万';
    }

    // 获取板块走势数据
    async fetchPlateTrendData(plateId) {
        try {
            const response = await fetch(`https://flash-api.xuangubao.com.cn/api/plate/index_realtime?index_type=1&plate_id=${plateId}&data_type=2`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return this.processPlateTrendData(data);
        } catch (error) {
            console.error(`获取板块 ${plateId} 走势数据失败:`, error);
            return null;
        }
    }

    // 处理板块走势数据
    processPlateTrendData(apiData) {
        if (!apiData?.data?.items || !Array.isArray(apiData.data.items)) {
            return null;
        }
        
        const tradingTimes = this.generateTradingTimeAxis();
        const baseValue = apiData.data.prev_close_idx || apiData.data.items[0]?.index || 1;
        const data = new Array(tradingTimes.length).fill(null);
        
        apiData.data.items.forEach(item => {
            const timestamp = parseInt(item.time) * 1000;
            const indexValue = parseFloat(item.index);
            const value = Number(((indexValue - baseValue) / baseValue * 100).toFixed(2));
            
            if (isNaN(timestamp) || timestamp <= 0 || isNaN(value)) return;
            
            const time = new Date(timestamp);
            const hours = time.getHours();
            const minutes = time.getMinutes();
            const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            const index = tradingTimes.indexOf(timeStr);
            
            if (index !== -1) {
                data[index] = value;
            }
        });
        
        return {
            data: data,
            baseValue: baseValue,
            times: tradingTimes
        };
    }

    // 渲染单个板块卡片
    renderPlateCard(plate, isMainLine = false) {
        const cardElement = document.createElement('div');
        cardElement.className = 'plate-card';
        cardElement.setAttribute('data-plate-id', plate.id);
        
        // 如果标记为主线，添加特殊样式
        if (isMainLine) {
            cardElement.classList.add('main-line-card');
        }
        
        // 统计涨停股票数量
        const stocks = plate.stocks || [];
        const limitUpCount = stocks.filter(stock => stock.isLimitUp).length;
        const totalCount = stocks.length;
        const nonLimitUpCount = totalCount - limitUpCount;
        
        // 生成股票列表HTML
        const stockItems = stocks.map(stock => {
            // 处理股票说明，如果过长则截断
            const description = stock.description || '暂无说明';
            const shortDesc = description.length > 50 ? description.substring(0, 50) + '...' : description;
            
            return `
            <div class="plate-stock-item ${stock.isLimitUp ? 'limit-up' : ''}" data-is-limit-up="${stock.isLimitUp}">
                <div class="plate-stock-info" onclick="openStockModal('${stock.url}')" data-tooltip="${description}">
                    <span class="plate-stock-name">${stock.name}</span>
                    <span class="plate-stock-code">${stock.code}</span>
                </div>
                <div class="plate-stock-middle">
                    <div class="plate-stock-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${stock.limitProgress}%; background-color: ${stock.limitProgress >= 90 ? '#ff5252' : stock.limitProgress >= 70 ? '#ff9800' : '#4CAF50'};"></div>
                        </div>
                        <div class="progress-text">${stock.limitProgress.toFixed(0)}%</div>
                    </div>
                </div>
                <div class="plate-stock-right">
                    <div class="plate-stock-change ${stock.change >= 0 ? 'positive' : 'negative'}">
                        ${stock.change >= 0 ? '+' : ''}${stock.change}%
                    </div>
                    <button class="copy-btn" onclick="copyStockCode('${stock.code}', '${stock.name}')" title="复制股票代码">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
            `;
        }).join('');
        
        // 添加空占位项，确保至少有5个项（实际股票+占位符）
        const placeholderCount = Math.max(0, 5 - stocks.length);
        const placeholders = Array(placeholderCount).fill('<div class="plate-stock-placeholder"></div>').join('');
        
        // 主线标记
        const mainLineBadge = isMainLine ? '<div class="main-line-badge">主线</div>' : '';
        
        const stocksHtml = `
            <div class="plate-connection"></div>
            <div class="plate-stocks-title">
                <div class="plate-stocks-title-left">
                    <i class="fas fa-chart-line" style="margin-right: 4px; font-size: 10px;"></i>
                    相关股票 (${limitUpCount}/${totalCount})
                </div>
                <div class="plate-stocks-title-right">
                    <label class="filter-limit-up">
                        <input type="checkbox" class="filter-checkbox" data-plate-id="${plate.id}">
                        <span class="filter-text">过滤涨停</span>
                    </label>
                    <button class="copy-btn" onclick="copyStocks('${plate.id}', '${plate.name}')" title="复制股票代码">
                        <i class="fas fa-copy"></i> 复制
                    </button>
                </div>
            </div>
            <div class="plate-stocks-list">
                ${stockItems}
                ${placeholders}
            </div>
        `;
        
        cardElement.innerHTML = `
            <div class="plate-card-header">
                <div class="plate-card-title">${plate.name}${mainLineBadge}</div>
                <div class="plate-card-change ${plate.increase >= 0 ? 'positive' : 'negative'}">
                    ${plate.increase >= 0 ? '+' : ''}${plate.increase.toFixed(2)}%
                </div>
            </div>
            <div class="plate-card-desc">
                ${plate.description}
            </div>
            <div class="plate-chart-container">
                <div class="plate-card-loading">加载走势图...</div>
                <div class="plate-chart" id="plate-chart-${plate.id}" style="display: none;"></div>
            </div>
            ${stocksHtml}
        `;
        
        // 为复选框添加事件监听器
        const checkbox = cardElement.querySelector('.filter-checkbox');
        checkbox.addEventListener('change', (e) => {
            this.filterLimitUpStocks(plate.id, e.target.checked);
        });
        
        return cardElement;
    }
    
    // 过滤涨停股票
    filterLimitUpStocks(plateId, hideLimitUp) {
        const stockItems = document.querySelectorAll(`[data-plate-id="${plateId}"] .plate-stock-item`);
        
        stockItems.forEach(item => {
            const isLimitUp = item.getAttribute('data-is-limit-up') === 'true';
            
            if (hideLimitUp && isLimitUp) {
                item.style.display = 'none';
            } else {
                item.style.display = 'flex';
            }
        });
    }

    // 为单个板块渲染走势图
    async renderPlateChart(plate) {
        const chartContainer = document.getElementById(`plate-chart-${plate.id}`);
        if (!chartContainer) {
            console.error(`找不到图表容器: plate-chart-${plate.id}`);
            return;
        }
        
        // 获取走势数据
        const trendData = await this.fetchPlateTrendData(plate.id);
        
        // 隐藏加载状态
        const loadingElement = chartContainer.parentElement.querySelector('.plate-card-loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        if (!trendData) {
            chartContainer.innerHTML = '<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#aaa;font-size:12px;">暂无走势数据</div>';
            chartContainer.style.display = 'block';
            return;
        }
        
        // 先显示图表容器，确保有宽度和高度
        chartContainer.style.display = 'block';
        
        // 初始化ECharts实例
        const chart = echarts.init(chartContainer);
        this.plateCharts[plate.id] = chart;
        
        const color = plate.increase >= 0 ? '#ff5252' : '#22e090';
        
        const option = {
            title: { show: false },
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(50, 50, 50, 0.9)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                textStyle: { color: '#fff' },
                formatter: function (params) {
                    if (params.length === 0) return '';
                    const time = params[0].axisValue;
                    let result = `<div style="font-weight: bold; margin-bottom: 4px;">${time}</div>`;
                    params.forEach(param => {
                        if (param.value !== null && param.value !== undefined) {
                            const value = parseFloat(param.value).toFixed(2);
                            result += `<div style="color: ${value >= 0 ? '#ff3333' : '#00ff00'}; margin-left: 12px;">
                                ${value >= 0 ? '+' : ''}${value}%
                            </div>`;
                        }
                    });
                    return result;
                }
            },
            grid: {
                left: '10%',
                right: '10%',
                top: '10%',
                bottom: '10%',
                containLabel: true
            },
            xAxis: [{
                type: 'category',
                boundaryGap: false,
                data: trendData.times,
                axisLine: {
                    lineStyle: {
                        color: 'rgba(255, 255, 255, 0.2)'
                    }
                },
                axisLabel: {
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: 10,
                    formatter: function (value) {
                        const importantTimes = ['09:30', '10:30', '11:30', '13:00', '14:00', '15:00'];
                        return importantTimes.includes(value) ? value : '';
                    }
                },
                splitLine: {
                    show: false
                }
            }],
            yAxis: [{
                type: 'value',
                axisLine: {
                    lineStyle: {
                        color: 'rgba(255, 255, 255, 0.2)'
                    }
                },
                axisLabel: {
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: 10,
                    formatter: '{value}%'
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: 'rgba(255, 255, 255, 0.08)',
                        type: 'dashed',
                        width: 0.5
                    }
                },
                splitNumber: 3
            }],
            series: [{
                name: plate.name,
                type: 'line',
                smooth: true,
                symbol: 'none',
                itemStyle: {
                    color: color
                },
                lineStyle: {
                    color: color,
                    width: 2
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: color + '30' },
                        { offset: 1, color: color + '03' }
                    ])
                },
                data: trendData.data
            }]
        };
        
        chart.setOption(option);
        
        // 确保图表正确渲染
        setTimeout(() => {
            if (chart && !chart.isDisposed()) {
                chart.resize();
            }
        }, 0);
        
        // 窗口大小改变时重绘图表
        window.addEventListener('resize', () => {
            if (chart && !chart.isDisposed()) {
                chart.resize();
            }
        });
    }

    // 渲染所有板块卡片
    async renderPlateCards(platesData) {
        // 清空现有内容
        this.plateCardsGrid.innerHTML = '';
        
        if (!platesData || platesData.length === 0) {
            this.errorElement.innerHTML = '<div style="color: #aaa; text-align: center; padding: 20px;">暂无数据</div>';
            this.errorElement.style.display = 'block';
            return;
        }
        
        // 按涨停个股数量倒序排序（数量多的排在前面）
        platesData.sort((a, b) => {
            const aLimitUpCount = (a.stocks || []).filter(stock => stock.isLimitUp).length;
            const bLimitUpCount = (b.stocks || []).filter(stock => stock.isLimitUp).length;
            return bLimitUpCount - aLimitUpCount;
        });
        
        // 隐藏错误和加载提示
        this.errorElement.style.display = 'none';
        this.loadingElement.style.display = 'none';
        
        // 创建并添加所有板块卡片，前3个标记"主线"
        platesData.forEach((plate, index) => {
            const cardElement = this.renderPlateCard(plate, index < 3);
            this.plateCardsGrid.appendChild(cardElement);
            
            // 异步加载并渲染走势图
            setTimeout(() => {
                this.renderPlateChart(plate);
            }, 0);
        });
    }
    
    // 渲染所有数据
    async renderData() {
        // 显示加载状态
        this.loadingElement.style.display = 'block';
        this.errorElement.style.display = 'none';
        
        try {
            // 从接口获取数据
            const data = await this.fetchHotspotData();
            
            // 渲染板块卡片
            await this.renderPlateCards(data);
        } catch (error) {
            console.error('渲染数据失败:', error);
            this.loadingElement.style.display = 'none';
            this.errorElement.innerHTML = '<div style="color: #ff5252; text-align: center; padding: 20px;">加载失败，请稍后重试</div>';
            this.errorElement.style.display = 'block';
        }
    }

    // 初始化
    init() {
        this.renderData();
        // 每60秒更新一次数据
        setInterval(() => this.renderData(), 60000);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    const hotspotManager = new HotspotManager();
    hotspotManager.init();
});
    hotspotManager.init();
