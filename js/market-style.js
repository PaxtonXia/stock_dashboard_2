// market-style.js - 风格走势相关功能

let mainStyleLineChart = null;

function initStyleChart() {
    const chartDom = document.getElementById('mainStyleLineChart');
    if (chartDom && !mainStyleLineChart) {
        mainStyleLineChart = echarts.init(chartDom);
    }
}

let currentDataValue = new Array(tradingTimes.length).fill(null);
let currentDataGrowth = new Array(tradingTimes.length).fill(null);

async function fetchStyleTrend() {
    if (!mainStyleLineChart) return;
    
    const urlValue = 'https://api-ddc-wscn.xuangubao.com.cn/market/trend?fields=tick_at,close_px&prod_code=000919.SH';  // 大盘价值
    const urlGrowth = 'https://api-ddc-wscn.xuangubao.com.cn/market/trend?fields=tick_at,close_px&prod_code=000922.CSI'; // 中小盘成长
    
    try {
        const [resValue, resGrowth] = await Promise.all([
            fetch(urlValue),
            fetch(urlGrowth)
        ]);
        
        const [dataValue, dataGrowth] = await Promise.all([
            resValue.json(),
            resGrowth.json()
        ]);

        function processData(data, currentData, code) {
            if (!data?.data?.candle?.[code]?.lines) return currentData;
            const lines = data.data.candle[code].lines;
            const baseValue = lines[0][1];
            
            lines.forEach(item => {
                const time = new Date(item[0] * 1000);
                const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
                const index = tradingTimes.indexOf(timeStr);
                if (index !== -1) {
                    currentData[index] = ((item[1] - baseValue) / baseValue * 100);
                }
            });
            return currentData;
        }

        currentDataValue = processData(dataValue, currentDataValue, '000919.SH');
        currentDataGrowth = processData(dataGrowth, currentDataGrowth, '000922.CSI');

        mainStyleLineChart.setOption({
            grid: { 
                left: 50,
                right: 30,
                top: 20,
                bottom: 30,
                containLabel: true 
            },
            legend: {
                show: true,
                top: 0,
                right: 10,
                textStyle: {
                    color: '#ffffff',
                    fontSize: 10
                },
                itemWidth: 15,
                itemHeight: 2
            },
            xAxis: {
                type: 'category',
                data: tradingTimes,
                axisLabel: {
                    fontSize: 10,
                    interval: Math.floor(tradingTimes.length / 8),
                    formatter: value => value,
                    color: '#ffffff'
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        type: 'dashed',
                        color: 'rgba(255,255,255,0.2)'
                    }
                }
            },
            yAxis: {
                type: 'value',
                scale: true,
                axisLabel: { fontSize: 10, formatter: '{value}%', color: '#ffffff' },
                splitLine: {
                    show: true,
                    lineStyle: {
                        type: 'dashed',
                        color: 'rgba(255,255,255,0.2)'
                    }
                }
            },
            dataZoom: [{
                type: 'inside',
                start: 0,
                end: 100,
                zoomLock: true
            }],
            series: [{
                name: '大盘价值',
                type: 'line',
                data: currentDataValue,
                symbol: 'none',
                lineStyle: { 
                    width: 1.5,
                    color: '#ff5252'
                },
                itemStyle: {
                    color: '#ff5252'
                },
                connectNulls: true
            }, {
                name: '中小盘成长',
                type: 'line',
                data: currentDataGrowth,
                symbol: 'none',
                lineStyle: { 
                    width: 1.5,
                    color: '#22e090'
                },
                itemStyle: {
                    color: '#22e090'
                },
                connectNulls: true
            }],
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } },
                backgroundColor: 'rgba(30,30,45,0.95)',
                borderColor: '#444',
                borderWidth: 1,
                textStyle: { color: '#fff' },
                extraCssText: 'box-shadow: 0 2px 8px rgba(0,0,0,0.4);',
                position: ['70%', '10%'],
                formatter: function(params) {
                    let time = params[0]?.axisValue || '';
                    let html = `<div style="margin-bottom:4px;color:#aaa;">时间：${time}</div>`;
                    html += params.map(item => `
                        ${item.marker}
                        <span style="color:${item.color}">${item.seriesName}</span>: 
                        <span style="color:${item.value > 0 ? '#ff5252' : (item.value < 0 ? '#22e090' : '#aaa')}">${item.value != null ? item.value.toFixed(2) : '--'}%</span>
                    `).join('<br>');
                    return html;
                }
            }
        });
    } catch (error) {
        console.error('获取风格走势数据失败:', error);
    }
}