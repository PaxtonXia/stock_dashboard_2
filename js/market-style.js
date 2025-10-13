// market-style.js - 风格走势相关功能 (已更新)
document.addEventListener('DOMContentLoaded', function() {
    // 确保在DOM完全加载后执行
    
    // 使用固定交易时间轴定义（避免依赖外部函数）
    const tradingTimes = [
        '09:30', '09:35', '09:40', '09:45', '09:50', '09:55', '10:00', '10:05', '10:10', '10:15', '10:20', '10:25', '10:30',
        '10:35', '10:40', '10:45', '10:50', '10:55', '11:00', '11:05', '11:10', '11:15', '11:20', '11:25', '11:30',
        '13:00', '13:05', '13:10', '13:15', '13:20', '13:25', '13:30', '13:35', '13:40', '13:45', '13:50', '13:55', '14:00',
        '14:05', '14:10', '14:15', '14:20', '14:25', '14:30', '14:35', '14:40', '14:45', '14:50', '14:55', '15:00'
    ];
    
    let marketStyleChart = null;

    function initMarketStyleChart(callback) {
        if (marketStyleChart) {
            callback(marketStyleChart);
            return;
        }
        
        const chartDom = document.getElementById('market-style-chart');
        if (!chartDom) {
            console.error('未找到图表容器');
            callback(null);
            return;
        }
        
        // 临时显示容器以确保尺寸正确
        const originalDisplay = chartDom.style.display;
        chartDom.style.display = 'block';
        
        // 短暂延迟确保DOM更新
        setTimeout(() => {
            try {
                marketStyleChart = echarts.init(chartDom);
                console.log('风格走势图表初始化成功');
                
                // 恢复原始显示状态
                chartDom.style.display = originalDisplay;
                
                // 成功时执行回调
                callback(marketStyleChart);
            } catch (e) {
                console.error('图表初始化失败:', e);
                // 恢复原始显示状态
                chartDom.style.display = originalDisplay;
                callback(null);
            }
        }, 100);
    }

    // 定义多个指数的配置
    const indicators = [
        { code: '399383.SZ', name: '大盘价值', color: '#ff5252', data: new Array(tradingTimes.length).fill(null) },
        { code: '399372.SZ', name: '大盘成长', color: '#22e090', data: new Array(tradingTimes.length).fill(null) },
        { code: '399377.SZ', name: '小盘价值', color: '#8866ee', data: new Array(tradingTimes.length).fill(null) },
        { code: '399376.SZ', name: '小盘成长', color: '#66ccff', data: new Array(tradingTimes.length).fill(null) }
    ];

    async function fetchStyleTrend() {
        if (!marketStyleChart) {
            if (!initMarketStyleChart()) return;
        }
        
        console.log('开始获取多个指数走势数据');
        
        try {
            // 为所有指数创建API请求
            const fetchPromises = indicators.map(indicator => 
                fetch(`https://api-ddc-wscn.xuangubao.com.cn/market/trend?fields=tick_at,close_px&prod_code=${indicator.code}`)
            );
            
            // 等待所有请求完成
            const responses = await Promise.all(fetchPromises);
            
            // 检查响应状态并转换为JSON
            const responseData = await Promise.all(
                responses.map((res, index) => {
                    if (!res.ok) {
                        throw new Error(`${indicators[index].name}数据请求失败: ${res.status}`);
                    }
                    return res.json();
                })
            );
            
            // 调试日志：显示原始数据
            responseData.forEach((data, index) => {
                console.log(`${indicators[index].name}原始数据:`, data);
            });
            
            // 数据处理函数
            function processData(indicator, data) {
                if (!data?.data?.candle?.[indicator.code]?.lines) {
                    console.error(`${indicator.name}数据格式错误:`, data);
                    return indicator.data;
                }
                
                const lines = data.data.candle[indicator.code].lines;
                const baseValue = lines[0][1];
                const newData = [...indicator.data]; // 创建副本以避免修改原始数组
                let count = 0;
                
                lines.forEach(item => {
                    const time = new Date(item[0] * 1000);
                    const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
                    const index = tradingTimes.indexOf(timeStr);
                    if (index !== -1) {
                        newData[index] = ((item[1] - baseValue) / baseValue * 100);
                        count++;
                    }
                });
                
                console.log(`处理${indicator.name}数据点: ${count}/${lines.length}`);
                return newData;
            }
            
            // 处理每个指数的数据
            indicators.forEach((indicator, index) => {
                indicator.data = processData(indicator, responseData[index]);
            });
            
            // 创建图表系列数据
            const series = indicators.map(indicator => ({
                name: indicator.name,
                type: 'line',
                data: indicator.data.map((val, i) => tradingTimes[i] === '12:00' ? null : val),
                showSymbol: false,
                smooth: false,
                lineStyle: { width: 1.5, color: indicator.color },
                connectNulls: true
            }));
            
            // 添加休市分隔线
            series.push({
                name: '休市分隔线',
                type: 'line',
                data: tradingTimes.map(time => time === '11:30' || time === '13:00' ? 0 : null),
                symbol: 'none',
                lineStyle: { type: 'dashed', width: 1, color: '#555' },
                markArea: {
                    silent: true,
                    itemStyle: { color: 'rgba(30, 30, 45, 0.7)' },
                    data: [[
                        { name: '-', xAxis: '11:30' },
                        { xAxis: '13:00' }
                    ]]
                }
            });

            // 更新图表配置
            marketStyleChart.setOption({
                animation: false,
                title: { show: false },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } },
                    backgroundColor: 'rgba(30,30,45,0.95)',
                    borderColor: '#444',
                    borderWidth: 1,
                    textStyle: { color: '#fff' },
                    extraCssText: 'box-shadow: 0 2px 8px rgba(0,0,0,0.4);',
                    formatter: function(params) {
                        let time = params[0].axisValue;
                        if (time === '休市') {
                            return `<div style="text-align:center;color:#aaa;">午间休市<br>11:30-13:00</div>`;
                        }
                        let html = `<div style="margin-bottom:4px;color:#aaa;">时间：${time}</div>`;
                        // 过滤掉休市分隔线系列
                        const filteredParams = params.filter(item => item.seriesName !== '休市分隔线');
                        filteredParams.forEach(item => {
                            const val = item.value;
                            let displayValue = '--';
                            let valueColor = '#aaa';
                            
                            if (typeof val === 'number' && !isNaN(val)) {
                                displayValue = val.toFixed(2);
                                valueColor = val >= 0 ? '#ff5252' : '#22e090';
                            }
                            
                            html += `
                                ${item.marker}
                                <span style="color:${item.color}">${item.seriesName}</span>: 
                                <span style="color:${valueColor}">${displayValue}%</span><br>`;
                        });
                        return html;
                    }
                },
                legend: {
                    data: indicators.map(ind => ind.name),
                    right: 10,
                    top: 5,
                    type: 'scroll',
                    textStyle: { color: '#d0d0d0', fontSize: 11 },
                    itemWidth: 10,
                    itemHeight: 6,
                    itemGap: 8,
                    padding: [5, 15],
                    pageIconColor: '#aaa',
                    pageTextStyle: { color: '#d0d0d0' }
                },
                grid: {
                    left: 50,
                    right: 30,
                    bottom: 10,
                    top: 10,
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: tradingTimes,
                    boundaryGap: false,
                    axisLine: { lineStyle: { color: '#666' } },
                    splitLine: { 
                        show: true,
                        lineStyle: {
                            type: 'dashed',
                            color: 'rgba(255,255,255,0.2)'
                        }
                    },
                    axisLabel: {
                        fontSize: 10,
                        interval: Math.floor(tradingTimes.length / 8),
                        formatter: value => value,
                        color: '#ffffff'
                    }
                },
                yAxis: {
                    type: 'value',
                    scale: true,
                    axisLabel: { color: '#d0d0d0', formatter: '{value}%' },
                    axisLine: { show: true, lineStyle: { color: '#666' } },
                    splitLine: { lineStyle: { color: '#333', type: 'dashed' } },
                    boundaryGap: ['10%', '10%']
                },
                series: series
            }, true); // 使用true参数强制重绘
            
            console.log('风格走势数据更新完成');
        } catch (error) {
            console.error('获取风格走势数据失败:', error);
            // 显示错误信息
            const errorElement = document.createElement('div');
            errorElement.style.color = 'red';
            errorElement.style.padding = '10px';
            errorElement.textContent = `数据加载失败: ${error.message}`;
            document.getElementById('market-style-chart').appendChild(errorElement);
        }
    }

    // 初始化并启动
    initMarketStyleChart(function(chartInstance) {
        if (chartInstance) {
            marketStyleChart = chartInstance;
            fetchStyleTrend();
            // 设置定时更新（每30秒）
            setInterval(fetchStyleTrend, 30000);
        } else {
            console.error('无法初始化风格走势图表');
        }
    });
});
