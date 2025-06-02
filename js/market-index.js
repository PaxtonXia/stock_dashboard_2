// market-index.js - 大盘指数相关功能

// 大盘走势折线图实例
let mainIndexLineChart;

// 初始化函数
function initMainIndexChart() {
    mainIndexLineChart = echarts.init(document.getElementById('mainIndexLineChart'));
}

// 固定的交易时间横坐标
const tradingTimes = generateTradingTimeAxis();
let currentDataSH = new Array(tradingTimes.length).fill(null);
let currentDataSZ = new Array(tradingTimes.length).fill(null);
let currentDataZZ = new Array(tradingTimes.length).fill(null);
let currentDataA500 = new Array(tradingTimes.length).fill(null);

async function fetchMainIndexTrend() {
    const urlSH = 'https://api-ddc-wscn.xuangubao.com.cn/market/trend?fields=tick_at,close_px&prod_code=000001.SS';
    const urlSZ = 'https://api-ddc-wscn.xuangubao.com.cn/market/trend?fields=tick_at,close_px&prod_code=399001.SZ';
    const urlZZ = 'https://api-ddc-wscn.xuangubao.com.cn/market/trend?fields=tick_at,close_px&prod_code=000852.SS';
    const urlA500 = 'https://api-ddc-wscn.xuangubao.com.cn/market/trend?fields=tick_at,close_px&prod_code=512050.SS';
    
    try {
        const [resSH, resSZ, resZZ, resA500] = await Promise.all([
            fetch(urlSH),
            fetch(urlSZ),
            fetch(urlZZ),
            fetch(urlA500)
        ]);
        
        const [dataSH, dataSZ, dataZZ, dataA500] = await Promise.all([
            resSH.json(),
            resSZ.json(),
            resZZ.json(),
            resA500.json()
        ]);

        // 处理数据并更新到固定数组中
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

        currentDataSH = processData(dataSH, currentDataSH, '000001.SS');
        currentDataSZ = processData(dataSZ, currentDataSZ, '399001.SZ');
        currentDataZZ = processData(dataZZ, currentDataZZ, '000852.SS');
        currentDataA500 = processData(dataA500, currentDataA500, '512050.SS');

        // 更新图表
        mainIndexLineChart.setOption({
            grid: { left: 10, right: 10, top: 10, bottom: 10, containLabel: true },
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
            series: [{
                name: '上证指数',
                type: 'line',
                data: currentDataSH,
                symbol: 'none',
                lineStyle: { 
                    width: 1.5,
                    color: '#ff5252'
                },
                connectNulls: true
            }, {
                name: '深证成指',
                type: 'line',
                data: currentDataSZ,
                symbol: 'none',
                lineStyle: { 
                    width: 1.5,
                    color: '#22e090'
                },
                connectNulls: true
            }, {
                name: '中证1000',
                type: 'line',
                data: currentDataZZ,
                symbol: 'none',
                lineStyle: { 
                    width: 1.5,
                    color: '#ffdd00'
                },
                connectNulls: true
            }, {
                name: 'A500',
                type: 'line',
                data: currentDataA500,
                symbol: 'none',
                lineStyle: { 
                    width: 1.5,
                    color: '#3388ff'
                },
                connectNulls: true
            }],
            tooltip: {
                trigger: 'axis',
                formatter: function(params) {
                    let result = params[0].axisValue + '<br/>';
                    params.forEach(param => {
                        if (param.value !== null && param.value !== undefined) {
                            const color = param.value >= 0 ? '#ff5252' : '#22e090';
                            const sign = param.value >= 0 ? '+' : '';
                            result += `<span style="color:${color}">${param.seriesName}: ${sign}${param.value.toFixed(2)}%</span><br/>`;
                        }
                    });
                    return result;
                }
            }
        });
    } catch (error) {
        console.error('获取大盘指数数据失败:', error);
    }
} 