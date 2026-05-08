// bankuai.js - 板块股票列表功能脚本
const TRADING_TIMES = {
    morning: {
        start: '09:30',
        end: '11:30'
    },
    afternoon: {
        start: '13:00',
        end: '15:00'
    }
};


function isTradeTime() {
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + 
                now.getMinutes().toString().padStart(2, '0');
    const day = now.getDay();

    // 排除周末
    if (day === 0 || day === 6) return false;

    // 判断是否在交易时间内
    return (time >= TRADING_TIMES.morning.start && time <= TRADING_TIMES.morning.end) ||
           (time >= TRADING_TIMES.afternoon.start && time <= TRADING_TIMES.afternoon.end);
}

function processTimeChartData(trends) {
    const timeAxis = [];
    const priceData = [];
    const volumeData = [];
    
    if (!trends) {
        return { priceData, volumeData, timeAxis };
    }

    let lastValidPrice = null;
    
    trends.forEach(item => {
        const parts = item.split(',');
        const time = parts[0].substring(11, 16);
        const price = parseFloat(parts[2]);
        const volume = parseInt(parts[5]);
        
        timeAxis.push(time);
        priceData.push(price);
        volumeData.push(volume);
        lastValidPrice = price;
    });

    return { priceData, volumeData, timeAxis };
}

// 计算涨跌幅
function ratioCalculate(price, yclose) {
    return ((price - yclose) / yclose * 100).toFixed(2);
}

// 计算价格和涨跌幅的区间
function getMinMax(priceData, preClose) {
    const values = priceData.filter(val => val !== null);
    const maxa = Math.max(...values);
    const mina = Math.min(...values);
    const zfa = Math.abs((maxa / preClose - 1));
    const zfb = Math.abs((mina / preClose - 1));
    
    function minValue() {
        if(zfa >= zfb){
            return Number(preClose * (1 - zfa)).toFixed(2);
        }else{
            return mina;
        }
    }
    function maxValue() {
        if(zfb >= zfa){
            return Number(preClose * (1 + zfb)).toFixed(2);
        }else{
            return maxa;
        }
    }
    
    const _interval = (maxValue() - minValue()) / 4;
    return { min: minValue(), max: maxValue(), interval: _interval };
}

let currentSortField = null;
let sortDirection = 1;
let currentData = null;
let timeChart = null;
let lastStockCode = null;
let timeChartTimer = null;

function showTimeChart(stockCode, stockName) {
    const timestamp = Date.now();
    // 构建选股宝的股票代码格式（如：600515.SS）
    const marketSuffix = stockCode.startsWith('6') ? 'SS' : 'SZ';
    const xgbStockCode = `${stockCode}.${marketSuffix}`;
    const url = `https://api-ddc-wscn.xuangubao.cn/market/trend?fields=tick_at,close_px,avg_px,turnover_volume,turnover_value,open_px,high_px,low_px,px_change,px_change_rate&prod_code=${xgbStockCode}`;
    
    const modal = document.getElementById('chartModal');
    const chartContainer = document.getElementById('modalChartContainer');
    
    // 清除旧的定时器
    if (timeChartTimer) {
        clearInterval(timeChartTimer);
        timeChartTimer = null;
    }
    
    modal.style.display = 'block';
    document.getElementById('modalTitle').textContent = `${stockName}（${stockCode}）分时图`;
    
    // 如果图表实例不存在或已被销毁，则创建新的
    if (!timeChart || timeChart.isDisposed()) {
        chartContainer.innerHTML = ''; // 清空容器
        timeChart = echarts.init(chartContainer);
    }
    
    timeChart.showLoading({
        text: '加载中...',
        color: '#4a9eff',
        textColor: '#aaa',
        maskColor: 'rgba(0, 0, 0, 0)'
    });
    
    $.ajax({
        url: url,
        type: 'GET',
        dataType: 'json',
        success: function(data) {
            timeChart.hideLoading();
            if (data.code === 20000 && data.data && data.data.candle && data.data.candle[xgbStockCode]) {
                drawTimeChartFromXGB(stockCode, data);
            } else {
                timeChart.showLoading({
                    text: '没有获取到有效的分时图数据',
                    color: '#ff5252',
                    textColor: '#ff5252',
                    maskColor: 'rgba(0, 0, 0, 0)'
                });
            }
        },
        error: function(error) {
            console.error('获取分时图数据失败:', error);
            timeChart.showLoading({
                text: '获取分时图数据失败',
                color: '#ff5252',
                textColor: '#ff5252',
                maskColor: 'rgba(0, 0, 0, 0)'
            });
        }
    });
}

function processXGBTimeChartData(xgbData, stockCode) {
    const marketSuffix = stockCode.startsWith('6') ? 'SS' : 'SZ';
    const xgbStockCode = `${stockCode}.${marketSuffix}`;
    
    if (!xgbData.data || !xgbData.data.candle || !xgbData.data.candle[xgbStockCode]) {
        return { priceData: [], volumeData: [], timeAxis: [], preClose: 0 };
    }
    
    const stockData = xgbData.data.candle[xgbStockCode];
    const lines = stockData.lines || [];
    
    const timeAxis = [];
    const priceData = [];
    const volumeData = [];
    
    lines.forEach(line => {
        // line 格式: [timestamp, close_px, avg_px, turnover_volume, turnover_value, open_px, high_px, low_px, px_change, px_change_rate]
        const timestamp = line[0];
        const closePrice = line[1];
        const volume = line[3]; // turnover_volume
        
        // 将时间戳转换为时间格式
        const date = new Date(timestamp * 1000);
        const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        timeAxis.push(time);
        priceData.push(closePrice);
        volumeData.push(volume);
    });
    
    const preClose = stockData.pre_close_px || 0;
    
    return { priceData, volumeData, timeAxis, preClose };
}

function drawTimeChartFromXGB(stockCode, xgbData) {
    const { priceData, volumeData, timeAxis, preClose } = processXGBTimeChartData(xgbData, stockCode);
    
    if (priceData.length === 0) {
        return;
    }

    lastStockCode = stockCode;
    const { min, max, interval } = getMinMax(priceData, preClose);
    
    const option = {
        title: { show: false },
        animation: false,
        grid: [
            {
                left: '10%',
                right: '10%',
                top: '8%',
                height: '60%'
            },
            {
                left: '10%',
                right: '10%',
                top: '75%',
                height: '20%'
            }
        ],
        xAxis: [
            {
                type: 'category',
                data: timeAxis,
                boundaryGap: false,
                axisLine: { 
                    show: true,
                    lineStyle: {
                        color: '#555'
                    }
                },
                axisLabel: {
                    color: '#aaa',
                    fontSize: 12,
                    formatter: function(value) {
                        if (value === '09:30' || value === '10:30' || value === '11:30' || 
                            value === '13:00' || value === '14:00' || value === '15:00' ||
                            (value.split(':')[1] === '00' && value !== '13:00')) {
                            return value;
                        }
                        return '';
                    }
                },
                axisTick: { show: false }
            },
            {
                gridIndex: 1,
                type: 'category',
                data: timeAxis,
                boundaryGap: false,
                axisLine: { show: true },
                axisLabel: { show: false },
                axisTick: { show: false }
            }
        ],
        yAxis: [
            {
                type: 'value',
                position: 'left',
                scale: true,
                min: min,
                max: max,
                interval: interval,
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: '#333',
                        type: 'dashed'
                    }
                },
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#555'
                    }
                },
                axisLabel: {
                    color: function(value) {
                        if (value == preClose) return '#fff';
                        return value > preClose ? '#ff3333' : '#00ff00';
                    },
                    formatter: function(value) {
                        return Number(value).toFixed(2);
                    }
                }
            },
            {
                type: 'value',
                position: 'right',
                min: min,
                max: max,
                interval: interval,
                splitLine: { show: false },
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#555'
                    }
                },
                axisLabel: {
                    color: function(value) {
                        const ratio = ratioCalculate(value, preClose);
                        if (ratio == 0) return '#fff';
                        return ratio > 0 ? '#ff3333' : '#00ff00';
                    },
                    formatter: function(value) {
                        return ratioCalculate(value, preClose) + '%';
                    }
                }
            },
            {
                gridIndex: 1,
                type: 'value',
                position: 'right',
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: '#333',
                        type: 'dashed'
                    }
                },
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#555'
                    }
                },
                axisLabel: {
                    color: '#aaa',
                    formatter: function(value) {
                        return (value/10000).toFixed(0) + '万';
                    }
                }
            }
        ],
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(30,30,45,0.95)',
            borderColor: '#444',
            textStyle: { color: '#fff' },
            formatter: function(params) {
                let result = params[0].name + '<br/>';
                let price, volume;
                params.forEach(param => {
                    if (param.seriesName === '价格') {
                        price = param.value;
                        const color = price > preClose ? '#ff3333' : '#00ff00';
                        result += `价格: <span style="color:${color}">${price.toFixed(2)}</span><br/>`;
                        result += `涨跌幅: <span style="color:${color}">${ratioCalculate(price, preClose)}%</span><br/>`;
                    } else if (param.seriesName === '成交量') {
                        volume = param.value;
                        result += `成交量: ${(volume/10000).toFixed(0)}万手`;
                    }
                });
                return result;
            }
        },
        series: [
            {
                name: '价格',
                type: 'line',
                data: priceData,
                smooth: true,
                showSymbol: false,
                lineStyle: {
                    width: 1,
                    color: '#4a9eff'
                },
                markLine: {
                    symbol: 'none',
                    label: { show: false },
                    lineStyle: {
                        color: '#888',
                        type: 'dashed'
                    },
                    data: [
                        { yAxis: preClose }
                    ]
                }
            },
            {
                name: '成交量',
                type: 'bar',
                xAxisIndex: 1,
                yAxisIndex: 2,
                data: volumeData,
                barMaxWidth: 20,
                itemStyle: {
                    color: function(params) {
                        const value = params.value;
                        if (value === 0) return '#555';
                        if (priceData[params.dataIndex] >= (priceData[params.dataIndex-1] || preClose)) {
                            return '#ff3333';
                        }
                        return '#00ff00';
                    }
                }
            }
        ],
        dataZoom: [
            {
                type: 'inside',
                xAxisIndex: [0, 1],
                start: 0,
                end: 100
            }
        ]
    };

    timeChart.setOption(option, true);
    
    if (timeChartTimer) {
        clearInterval(timeChartTimer);
    }
}

// Stock pool functions using localStorage
const STOCK_POOL_KEY = 'stock_pool';

function getStockPool() {
    const poolStr = localStorage.getItem(STOCK_POOL_KEY);
    if (poolStr) {
        try {
            return JSON.parse(poolStr);
        } catch (e) {
            console.error('Error parsing stock pool', e);
        }
    }
    return [];
}

function saveStockPool(pool) {
    localStorage.setItem(STOCK_POOL_KEY, JSON.stringify(pool));
}

function toggleStockInPool(stockCode, stockName, element) {
    const pool = getStockPool();
    const existingIndex = pool.findIndex(item => item.code === stockCode);
    
    if (existingIndex !== -1) {
        // Remove from pool
        pool.splice(existingIndex, 1);
        element.textContent = '+';
        element.classList.remove('in-pool');
    } else {
        // Add to pool with current date
        const date = new Date();
        const dateString = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        pool.push({ 
            code: stockCode, 
            name: stockName,
            date: dateString,
            change: 0 // 添加默认涨跌幅
        });
        element.textContent = '-';
        element.classList.add('in-pool');
    }
    saveStockPool(pool);
}

function isInStockPool(stockCode) {
    return getStockPool().some(item => item.code === stockCode);
}

function getBlockCodeFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const blockCode = urlParams.get('code') || urlParams.get('blockCode');
    if (blockCode && !blockCode.startsWith('BK')) {
        return 'BK' + blockCode;
    }
    return blockCode && blockCode.trim() !== '' ? blockCode : null;
}

function fetchBlockName(blockCode, callback) {
    console.log('Fetching block name for:', blockCode);
    
    if (window.industryBoards && window.conceptBoards) {
        console.log('Using global boards data');
        findBlockName(blockCode, window.industryBoards, window.conceptBoards, callback);
        return;
    }
    
    try {
        const industryBoards = JSON.parse(localStorage.getItem('industryBoards') || '[]');
        const conceptBoards = JSON.parse(localStorage.getItem('conceptBoards') || '[]');
        
        if (industryBoards.length > 0 && conceptBoards.length > 0) {
            console.log('Using localStorage boards data');
            findBlockName(blockCode, industryBoards, conceptBoards, callback);
            return;
        }
    } catch (e) {
        console.error('加载本地存储的板块数据失败', e);
    }
    
    console.log('Fetching boards data from API');
    const industryUrl = 'https://push2.eastmoney.com/api/qt/clist/get?fid=f12&po=1&pz=1000&pn=1&np=1&fltt=2&invt=2&fs=m:90+t:2';
    const conceptUrl = 'https://push2.eastmoney.com/api/qt/clist/get?fid=f12&po=1&pz=1000&pn=1&np=1&fltt=2&invt=2&fs=m:90+t:3';
    
    Promise.all([
        fetch(industryUrl).then(res => res.json()),
        fetch(conceptUrl).then(res => res.json())
    ]).then(([industryData, conceptData]) => {
        console.log('API industry data:', industryData);
        console.log('API concept data:', conceptData);
        
        const industryBoards = industryData.data?.diff?.map(item => ({
            code: item.f12,
            name: item.f14
        })) || [];
        
        const conceptBoards = conceptData.data?.diff?.map(item => ({
            code: item.f12,
            name: item.f14
        })) || [];
        
        console.log('Processed industry boards:', industryBoards);
        console.log('Processed concept boards:', conceptBoards);
        
        window.industryBoards = industryBoards;
        window.conceptBoards = conceptBoards;
        try {
            localStorage.setItem('industryBoards', JSON.stringify(industryBoards));
            localStorage.setItem('conceptBoards', JSON.stringify(conceptBoards));
        } catch (e) {
            console.error('保存到localStorage失败', e);
        }
        
        console.log('API boards data loaded and processed');
        findBlockName(blockCode, industryBoards, conceptBoards, callback);
    }).catch(error => {
        console.error('从API获取板块数据失败:', error);
        callback(blockCode);
    });
}

function findBlockName(blockCode, industryBoards, conceptBoards, callback) {
    console.log('Searching for block:', blockCode);
    console.log('Industry boards:', industryBoards);
    console.log('Concept boards:', conceptBoards);
    
    const numericCode = blockCode.startsWith('BK') ? blockCode.substring(2) : blockCode;
    
    const industryMatch = industryBoards.find(board => {
        const match = board.code === blockCode || 
                     board.code === numericCode ||
                     board.code === `BK${numericCode}`;
        if (match) console.log('Industry match:', board);
        return match;
    });
    
    if (industryMatch) {
        console.log('Found industry match:', industryMatch);
        callback(industryMatch.name);
        return;
    }
    
    const conceptMatch = conceptBoards.find(board => {
        const match = board.code === blockCode || 
                     board.code === numericCode ||
                     board.code === `BK${numericCode}`;
        if (match) console.log('Concept match:', board);
        return match;
    });
    
    if (conceptMatch) {
        console.log('Found concept match:', conceptMatch);
        callback(conceptMatch.name);
        return;
    }
    
    console.log('No match found for block:', blockCode);
    callback(blockCode);
}

function fetchStockList(blockCode) {
    if (!blockCode) {
        blockCode = getBlockCodeFromUrl();
        if (!blockCode) {
            $('#result').html('<p>请提供板块代码或名称</p>');
            return;
        }
    }
    
    if (/^\d+$/.test(blockCode)) {
        blockCode = 'BK' + blockCode;
    }
    
    fetchBlockName(blockCode, function(blockName) {
        console.log('Fetched block name:', blockName, 'for code:', blockCode);
        if (blockName && blockName !== blockCode) {
            $('#blockName').text(blockName + ' (' + blockCode + ')');
        } else {
            $('#blockName').text(blockCode);
        }
    });

    $.ajax({
        url: `https://push2.eastmoney.com/api/qt/clist/get?fid=f12&po=1&pz=100&pn=1&np=1&fltt=2&invt=2&fs=b:${blockCode}&fields=f12,f14,f2,f3,f4,f62,f184,f66,f69,f72,f75,f78,f81,f84,f87,f204,f205,f124`,
        type: 'GET',
        dataType: 'json',
        success: function(data) {
            // 从股票列表计算板块统计
            fetchBlockDetail(blockCode, data.data);
            displayStockList(data);
        },
        error: function(error) {
            console.error('Error:', error);
            $('#result').html('<p>获取数据失败，请重试</p>');
        }
    });
}

function fetchBlockDetail(blockCode, stockData) {
    // 优先从股票列表数据计算汇总
    if (stockData && stockData.diff && stockData.diff.length > 0) {
        const stocks = stockData.diff;
        let totalInflow = 0;
        let upCount = 0, downCount = 0;
        let maxUpStock = null, maxUp = -999;
        
        stocks.forEach(s => {
            if (s.f62) totalInflow += s.f62;
            if (s.f3 > 0) upCount++;
            else if (s.f3 < 0) downCount++;
            if (s.f3 > maxUp) { maxUp = s.f3; maxUpStock = s; }
        });
        
        // 计算板块涨跌幅（平均）
        const avgChange = stocks.reduce((sum, s) => sum + (s.f3 || 0), 0) / stocks.length;
        const leadStockName = maxUpStock ? maxUpStock.f14 : '--';
        const leadStockCode = maxUpStock ? maxUpStock.f12 : '--';
        
        updateBlockHeader(blockCode, null, avgChange, totalInflow, upCount, downCount, leadStockName, leadStockCode);
        return;
    }
    
    // 降级：调用东方财富板块行情接口
    const secid = blockCode.startsWith('BK') ? `90.${blockCode}` : `90.BK${blockCode}`;
    const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=${secid}&fields=f12,f14,f2,f3,f62,f184,f66,f69,f72,f75,f78,f81,f84,f87,f124`;
    
    fetch(url)
        .then(res => res.json())
        .then(data => {
            console.log('板块详情:', data);
            if (data && data.data) {
                const d = data.data;
                updateBlockHeader(blockCode, d.f14, d.f3, d.f62, null, null, null, null, d.f2);
            }
        })
        .catch(err => {
            console.error('获取板块详情失败:', err);
        });
}

function updateBlockHeader(blockCode, name, change, inflow, upCount, downCount, leadStockName, leadStockCode, price) {
    const changeVal = change || 0;
    const changeStr = changeVal.toFixed(2) + '%';
    const inflowStr = inflow ? (inflow / 100000000).toFixed(2) + '亿' : '--';
    const priceStr = price || '--';
    
    // 获取板块名称（从已有标题或参数）
    const existingName = $('#blockName').text().split(' (')[0];
    const displayName = name || existingName || blockCode;
    
    let statsHtml = `
        <span class="stat-item ${changeVal >= 0 ? 'up' : 'down'}">
            <label>涨跌幅:</label> ${changeStr}
        </span>
        <span class="stat-item">
            <label>主力净流入:</label> ${inflowStr}
        </span>
    `;
    
    if (upCount !== null && downCount !== null) {
        statsHtml += `
            <span class="stat-item">
                <label>涨跌比:</label> ${upCount}/${downCount}
            </span>
        `;
    }
    
    if (leadStockName) {
        statsHtml += `
            <span class="stat-item">
                <label>领涨:</label> ${leadStockName} (${leadStockCode})
            </span>
        `;
    }
    
    const infoHtml = `
        <span class="card-title">
            <i class="fas fa-chart-line"></i>
            <span id="blockName">${displayName} (${blockCode})</span>
        </span>
        <div class="block-stats">${statsHtml}</div>
        <a href="main.html" class="back-link" title="返回首页">
            <i class="fas fa-arrow-left"></i> 返回
        </a>
    `;
    $('.card-title-row').html(infoHtml);
}

async function fetchLimitUpData() {
    try {
        const response = await fetch(`https://data.10jqka.com.cn/dataapi/limit_up/block_top`, {
            headers: {
                'Accept': 'application/json',
                'Referer': 'https://data.10jqka.com.cn/',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('涨停数据:', data);

        if (data && data.data && Array.isArray(data.data)) {
            const stockMap = new Map();
            
            data.data.forEach(block => {
                if (block.stock_list && Array.isArray(block.stock_list)) {
                    block.stock_list.forEach(stock => {
                        if (stock.code && typeof stock.code === 'string') {
                            stockMap.set(stock.code, {
                                high: stock.high || '涨停',
                                reason_type: stock.reason_type || '未知原因',
                                reason_info: stock.reason_info || '-',
                                change_tag: stock.change_tag || '-'
                            });
                        }
                    });
                }
            });
            
            console.log('涨停股票Map:', stockMap);
            return stockMap;
        } else {
            console.log('涨停数据为空');
            return new Map();
        }
    } catch (error) {
        console.error('获取涨停数据失败:', error);
    }
    return new Map();
}

async function displayStockList(data) {
    if (!data.data || !data.data.diff) {
        $('#result').html('<p>没有找到股票数据</p>');
        return;
    }
    
    fetchLimitUpData().then(function(limitUpMap) {
        window.limitUpMap = limitUpMap;
        console.log('获取到的涨停数据Map:', limitUpMap);
        console.log('涨停数据条数:', limitUpMap.size);
        console.log('股票列表数据:', data.data.diff);
        
        currentData = data;

        let html = '<div class="table-wrapper"><table><tr>' +
            '<th style="width:30px;"></th>' +
            '<th>代码</th>' +
            '<th>名称</th>' +
            '<th>最新价</th>' +
            '<th class="sortable" onclick="sortTable(\'f3\')">涨跌幅</th>' +
            '<th class="sortable" onclick="sortTable(\'f62\')">主力净流入(万)</th>' +
            '<th class="sortable" onclick="sortTable(\'f66\')">净流速(万)</th>' +
            '</tr>';
        
        // 过滤掉北交所股票（8/9/4开头）
        const filteredStocks = data.data.diff.filter(stock => !/^[894]/.test(stock.f12));
        console.log('[displayStockList] 过滤前:', data.data.diff.length, '过滤后:', filteredStocks.length);
        
        filteredStocks.forEach(stock => {
            const marketPrefix = stock.f12.startsWith('6') ? 'SH' : 'SZ';
            const prefixedCode = marketPrefix + stock.f12;
            
            const limitUpInfo = 
                limitUpMap.get(prefixedCode) || 
                limitUpMap.get(stock.f12) || 
                limitUpMap.get(stock.f12.substring(2));
            
            console.log(`股票${stock.f12}的涨停信息:`, limitUpInfo);
            if (limitUpInfo) {
                console.log(`为股票${stock.f14}(${stock.f12})添加涨停标记`);
            }

            const inflow = stock.f62 ? (stock.f62 / 10000).toFixed(2) : '--';
            const flowRate = stock.f66 ? (stock.f66 / 10000).toFixed(2) : '--';
            
            html += `<tr class="stock-row">
                <td><input type="checkbox" class="stock-ck" value="${stock.f12}" onclick="onStockCk('${stock.f12}', event)"></td>
                <td>${stock.f12}</td>
                <td class="stock-name-cell" style="cursor:pointer;" onclick="event.stopPropagation(); openSmartMoneyModal('${stock.f12}', '${stock.f14.replace(/'/g, "\\'")}')">
                    ${stock.f14}
                    ${limitUpInfo ? `
                    <span class="stock-flag">
                        <i class="fas fa-info-circle" style="color: #4a9eff;"></i>
                        <div class="tooltip">
                            <div class="flag-info"><strong>涨停类型:</strong> ${limitUpInfo.high}</div>
                            <div class="flag-info"><strong>涨停原因:</strong> ${limitUpInfo.reason_type}</div>
                            <div class="flag-info"><strong>详细信息:</strong> ${limitUpInfo.reason_info.replace(/\n/g, '<br>')}</div>
                            ${limitUpInfo.change_tag ? `<div class="flag-info"><strong>标签:</strong> ${limitUpInfo.change_tag}</div>` : ''}
                        </div>
                    </span>
                ` : ''}
                </td>
                <td>${stock.f2}</td>
                <td style="${stock.f3 > 0 ? 'color:#ff3333' : 'color:#00ff00'}">${stock.f3}%</td>
                <td style="${stock.f62 > 0 ? 'color:#ff3333' : 'color:#00ff00'}">${inflow}</td>
                <td style="${stock.f66 > 0 ? 'color:#ff3333' : 'color:#00ff00'}">${flowRate}</td>
            </tr>`;
        });

        if (limitUpMap.size > 0) {
            html += '</table></div>';
            $('#result').html(html);
        } else {
            html += '</table></div>';
            $('#result').html(html + '<p class="no-limit-up">今日无涨停股票数据（可能是非交易日）</p>');
        }
    console.log('[displayStockList] stocks count:', data.data.diff?.length);
    window.bankuaiStockData = data.data.diff;
    console.log('[displayStockList] bankuaiStockData set, length:', window.bankuaiStockData.length);
    renderBankuaiScatterChart(window.bankuaiStockData);
    }); // close fetchLimitUpData().then()
}

function sortTable(field) {
    if (!currentData || !currentData.data || !currentData.data.diff) return;
    
    if (currentSortField === field) {
        sortDirection *= -1;
    } else {
        currentSortField = field;
        sortDirection = 1;
    }
    
    document.querySelectorAll('.sortable').forEach(el => {
        el.classList.remove('asc', 'desc');
    });
    
    const header = document.querySelector(`th[onclick="sortTable('${field}')"]`);
    header.classList.add(sortDirection === 1 ? 'asc' : 'desc');
    
    currentData.data.diff.sort((a, b) => {
        const valA = a[field] || 0;
        const valB = b[field] || 0;
        return (valA - valB) * sortDirection;
    });
    
    displayStockList(currentData);
}

// ==================== 散点图视图 ====================
window.limitUpMap = new Map();
window.bankuaiStockData = [];
window.bankuaiScatterChart = null;

function renderBankuaiScatterChart(stocks) {
    const container = document.getElementById('scatterChartContainer');
    if (!container) { console.error('[scatter] container not found'); return; }
    if (!stocks || stocks.length === 0) { console.warn('[scatter] no data'); return; }
    if (window.bankuaiScatterChart) {
        try { window.bankuaiScatterChart.dispose(); } catch(e) {}
        window.bankuaiScatterChart = null;
    }
    container.innerHTML = '';
    container.style.backgroundColor = '#0d1117';
    window.bankuaiScatterChart = echarts.init(container);
    var wrapper = container.firstChild;
    if (wrapper && wrapper.style) { wrapper.style.width = '100%'; wrapper.style.height = '100%'; }
    console.log('[scatter] container rect:', container.offsetWidth, container.offsetHeight, 'stocks count:', stocks?.length);
    // 找最大成交额用于气泡大小缩放兜底
    var rawAmounts = stocks.map(function(s) { return Math.abs(s.f62 || 0); }).filter(function(v) { return v > 0; });
    var maxAmount = rawAmounts.length > 0 ? Math.max.apply(null, rawAmounts) : 1;
    // percentile rank 方案：强制拉开大小差异，避免相近值挤在窄带
    var sorted = rawAmounts.slice().sort(function(a, b) { return a - b; });
    var toRadius = function(v) {
        if (v <= 0) return 8;
        var rank = 0;
        for (var i = 0; i < sorted.length; i++) { if (sorted[i] <= v) rank = i + 1; else break; }
        var pct = rank / sorted.length; // 0~1
        return 6 + 64 * pct * pct; // 6~70px, square curve: head stocks much larger
    };
    // ECharts 5.x scatter expects [x, y] or [x, y, size], store extra in dataset
    // 计算流速范围用于opacity映射
    var flowRates = stocks.map(function(s) { return Math.abs(s.f66 || 0); }).filter(function(v) { return v > 0; });
    var maxFlow = flowRates.length > 0 ? Math.max.apply(null, flowRates) : 1;
    
    // 过滤掉北交所股票（8/9/4开头）
    var filteredStocks = stocks.filter(function(s) { return !/^[894]/.test(s.f12); });
    console.log('[scatter] 过滤前:', stocks.length, '过滤后:', filteredStocks.length);
    
    var pts = filteredStocks.map(function(s) {
        var netInflow = (s.f62 || 0) / 10000;
        var changePct = parseFloat(s.f3 || 0);
        var amount = Math.abs(s.f62 || 0) || 10;
        var flowRate = Math.abs(s.f66 || 0);
        var rise = changePct >= 0;
        // 流速越大opacity越高 (0.4 ~ 1.0)
        var opacity = flowRate > 0 ? 0.4 + 0.6 * (flowRate / maxFlow) : 0.5;
        // 颜色逻辑：涨停→紫色，跌停→深绿，普通涨→红色，普通跌→绿色
        // 涨停/跌停以 limitUpMap 为准（非 9.9% 阈值）
        var stockCode = s.f12;
        var isLimitUp = !!(window.limitUpMap && window.limitUpMap.has(stockCode));
        var isLimitDown = changePct < 0 && !isLimitUp;
        var bubbleColor;
        if (isLimitUp) {
            bubbleColor = '#A855F7'; // 紫色=涨停
        } else if (isLimitDown) {
            bubbleColor = '#15803d'; // 深绿=跌停
        } else {
            bubbleColor = rise ? '#ef4444' : '#34d058';
        }
        return {
            value: [netInflow, changePct],
            symbolSize: toRadius(amount),
            symbol: 'circle',
            itemStyle: {
                color: bubbleColor,
                opacity: opacity
            },
            _name: s.f14 || '',
            _code: s.f12 || '',
            _price: s.f2 || '--',
            _flowRate: s.f66 ? (s.f66 / 10000).toFixed(2) : '--',
            _isLimitUp: isLimitUp,
            _isLimitDown: isLimitDown
        };
    });
    console.log('[scatter] pts[0]:', JSON.stringify(pts[0]));
    console.log('[scatter] chart inited, w:', container.offsetWidth, 'h:', container.offsetHeight);
    window.bankuaiScatterChart.setOption({
        animation: false,
        grid: { left: 68, right: 40, top: 20, bottom: 50 },
        xAxis: {
            type: 'value', name: '主力净流入(万)',
            nameTextStyle: { color: '#889', fontSize: 12 },
            splitLine: { lineStyle: { color: '#2a3444', type: 'dashed' } },
            axisLabel: { color: '#667' }
        },
        yAxis: {
            type: 'value', name: '涨跌幅%',
            nameTextStyle: { color: '#889', fontSize: 12 },
            splitLine: { lineStyle: { color: '#2a3444', type: 'dashed' } },
            axisLabel: { color: '#667' }
        },
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(17,24,39,0.95)',
            borderColor: '#2e3c51',
            textStyle: { color: '#e2e8f0' },
            formatter: function(p) {
                var d = p.data || {};
                var name = d._name || '', code = d._code || '';
                var v = d.value || [0, 0];
                var price = d._price || '--';
                var flowRate = d._flowRate || '--';
                // 颜色：涨停→紫色，跌停→深绿，普通涨→红色，普通跌→绿色
                var color = '#A855F7'; // 涨停紫色
                if (d._isLimitDown) color = '#15803d'; // 跌停深绿
                else if (v[1] >= 0) color = '#ef4444'; // 普通涨红
                else color = '#34d058'; // 普通跌绿
                var flowColor = parseFloat(v[0]) >= 0 ? '#ef4444' : '#34d058';
                var rateColor = parseFloat(flowRate) >= 0 ? '#ef4444' : '#34d058';
                return '<b style="font-size:14px">' + name + '</b> <span style="color:#889">(' + code + ')</span><br/>' +
                    '<span style="color:#889">最新价:</span> ' + price + '<br/>' +
                    '<span style="color:#889">涨跌幅:</span> <span style="color:' + color + ';font-weight:bold">' + v[1].toFixed(2) + '%</span><br/>' +
                    '<span style="color:#889">主力净流入:</span> <span style="color:' + flowColor + ';font-weight:bold">' + v[0].toFixed(0) + '万</span><br/>' +
                    '<span style="color:#889">净流速:</span> <span style="color:' + rateColor + '">' + flowRate + '万</span>';
            }
        },
        series: [{
            type: 'scatter', data: pts,
            label: {
                show: function(p) { return (p.data.symbolSize || 0) >= 18; },
                formatter: function(p) { return p.data._name || ''; },
                position: 'inside',
                color: '#fff',
                fontSize: function(p) { return (p.data.symbolSize || 10) > 35 ? 11 : 9; },
                fontWeight: 'bold',
                textShadowColor: 'rgba(0,0,0,0.7)',
                textShadowBlur: 3
            },
            emphasis: { itemStyle: { shadowBlur: 12 } }
        }]
    });
    // 点击气泡打开smart_money.html弹窗
    window.bankuaiScatterChart.on('click', function(params) {
        if (params.data && params.data._code) {
            openSmartMoneyModal(params.data._code, params.data._name);
        }
    });
    console.log('[scatter] chart setOption done, pts.length:', pts.length);
    }

// 打开smart_money.html弹窗
function openSmartMoneyModal(stockCode, stockName) {
    let modal = document.getElementById('smartMoneyModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'smartMoneyModal';
        modal.className = 'modal-overlay';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close" onclick="closeSmartMoneyModal()">&times;</span>
                <iframe id="smartMoneyFrame" class="modal-iframe"></iframe>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    document.getElementById('smartMoneyFrame').src = 'smart_money.html##' + stockCode;
    modal.style.display = 'block';
}

function closeSmartMoneyModal() {
    const modal = document.getElementById('smartMoneyModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('smartMoneyFrame').src = '';
    }
}

// Tab 切换：散点图 / 列表
function switchBankuaiView(view) {
    const scatterEl = document.getElementById('scatterView');
    const tableEl = document.getElementById('result');
    const scatterBtn = document.getElementById('btn-scatter');
    const tableBtn = document.getElementById('btn-table');

    if (view === 'scatter') {
        if (scatterEl) scatterEl.style.display = 'block';
        if (tableEl) tableEl.style.display = 'none';
        if (scatterBtn) scatterBtn.classList.add('active');
        if (tableBtn) tableBtn.classList.remove('active');
        if (window.bankuaiStockData.length > 0) {
            setTimeout(() => renderBankuaiScatterChart(window.bankuaiStockData), 100);
        }
    } else {
        if (scatterEl) scatterEl.style.display = 'none';
        if (tableEl) tableEl.style.display = 'block';
        if (tableBtn) tableBtn.classList.add('active');
        if (scatterBtn) scatterBtn.classList.remove('active');
    }
}

// ========== 多选功能 ==========
var selectedStocks = new Set();

function onStockCk(code, e) {
    e.stopPropagation();
    if (selectedStocks.has(code)) {
        selectedStocks.delete(code);
    } else {
        if (selectedStocks.size >= 12) {
            showToast('最多选12只股票');
            e.target.checked = false;
            return;
        }
        selectedStocks.add(code);
    }
    updateCompareBtn();
}

function toggleAllCk() {
    var allCk = document.getElementById('selectAll');
    var cks = document.querySelectorAll('.stock-ck');
    if (allCk && allCk.checked) {
        cks.forEach(function(ck) {
            if (selectedStocks.size < 12) {
                selectedStocks.add(ck.value);
                ck.checked = true;
            }
        });
    } else {
        selectedStocks.clear();
        cks.forEach(function(ck) { ck.checked = false; });
    }
    updateCompareBtn();
}

function updateCompareBtn() {
    var btn = document.getElementById('compareBtn');
    var countEl = document.getElementById('selCount');
    if (btn) {
        btn.disabled = selectedStocks.size < 2;
        if (countEl) countEl.textContent = selectedStocks.size;
    }
}

function openCompare() {
    if (selectedStocks.size < 2) { showToast('请至少选2只股票'); return; }
    var codes = [];
    var names = [];
    document.querySelectorAll('.stock-ck:checked').forEach(function(ck) {
        var row = ck.closest('tr');
        var nameTd = row ? row.querySelector('.stock-name-cell') : null;
        var name = nameTd ? nameTd.childNodes[0].textContent.trim() : ck.value;
        codes.push(ck.value);
        names.push(name);
    });
    var params = codes.map(function(c, i) { return c + ':' + names[i]; }).join(',');
    var url = 'stock-compare.html?codes=' + encodeURIComponent(params);
    var modal = document.getElementById('stockModal');
    var frame = document.getElementById('stockModalFrame');
    if (modal && frame) {
        frame.onload = function() {
            setTimeout(function() {
                try { frame.contentWindow.postMessage('resize', '*'); } catch(e) {}
            }, 500);
        };
        frame.src = url;
        modal.style.display = 'block';
    } else {
        window.open(url, '_blank');
    }
}

function closeStockModal() {
    document.getElementById('stockModal').style.display = 'none';
    document.getElementById('stockModalFrame').src = '';
}

(function() {
    const c = document.querySelector('.modal-close');
    if (c) c.addEventListener('click', closeStockModal);
    const m = document.getElementById('stockModal');
    if (m) m.addEventListener('click', function(e) { if (e.target === this) closeStockModal(); });
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeStockModal(); });
})();

function copyCodes() {
    if (selectedStocks.size === 0) { showToast('请先选择股票'); return; }
    var codes = Array.from(selectedStocks).join(', ');
    navigator.clipboard.writeText(codes).then(function() {
        showToast('已复制: ' + codes);
    }).catch(function() {
        var ta = document.createElement('textarea');
        ta.value = codes;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('已复制: ' + codes);
    });
}
