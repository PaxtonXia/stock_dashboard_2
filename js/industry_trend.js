// industry_trend.js - 行业走势相关功能

// 行业走势折线图实例
let industryLineChart;

// 初始化行业走势图表
function drawIndustryTrendChart(containerId) {
    industryLineChart = echarts.init(document.getElementById(containerId));
    
    // 设置初始图表选项
    industryLineChart.setOption({
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
            data: generateTradingTimeAxis(),
            axisLabel: {
                fontSize: 10,
                interval: Math.floor(generateTradingTimeAxis().length / 8),
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
            name: '消费',
            type: 'line',
            data: new Array(generateTradingTimeAxis().length).fill(null),
            symbol: 'none',
            lineStyle: { 
                width: 1.5,
                color: '#d35400'
            },
            itemStyle: {
                color: '#d35400'
            },
            connectNulls: true
        }, {
            name: '房产',
            type: 'line',
            data: new Array(generateTradingTimeAxis().length).fill(null),
            symbol: 'none',
            lineStyle: { 
                width: 1.5,
                color: '#9b59b6'
            },
            itemStyle: {
                color: '#9b59b6'
            },
            connectNulls: true
        }, {
            name: '银行',
            type: 'line',
            data: new Array(generateTradingTimeAxis().length).fill(null),
            symbol: 'none',
            lineStyle: { 
                width: 1.5,
                color: '#3498db'
            },
            itemStyle: {
                color: '#3498db'
            },
            connectNulls: true
        }, {
            name: '券商',
            type: 'line',
            data: new Array(generateTradingTimeAxis().length).fill(null),
            symbol: 'none',
            lineStyle: { 
                width: 1.5,
                color: '#2ecc71'
            },
            itemStyle: {
                color: '#2ecc71'
            },
            connectNulls: true
        }, {
            name: '游戏',
            type: 'line',
            data: new Array(generateTradingTimeAxis().length).fill(null),
            symbol: 'none',
            lineStyle: { 
                width: 1.5,
                color: '#e74c3c'
            },
            itemStyle: {
                color: '#e74c3c'
            },
            connectNulls: true
        }, {
            name: '旅游',
            type: 'line',
            data: new Array(generateTradingTimeAxis().length).fill(null),
            symbol: 'none',
            lineStyle: { 
                width: 1.5,
                color: '#f39c12'
            },
            itemStyle: {
                color: '#f39c12'
            },
            connectNulls: true
        }, {
            name: '军工',
            type: 'line',
            data: new Array(generateTradingTimeAxis().length).fill(null),
            symbol: 'none',
            lineStyle: { 
                width: 1.5,
                color: '#8e44ad'
            },
            itemStyle: {
                color: '#8e44ad'
            },
            connectNulls: true
        }, {
            name: '软件',
            type: 'line',
            data: new Array(generateTradingTimeAxis().length).fill(null),
            symbol: 'none',
            lineStyle: { 
                width: 1.5,
                color: '#16a085'
            },
            itemStyle: {
                color: '#16a085'
            },
            connectNulls: true
        }, {
            name: '创新药',
            type: 'line',
            data: new Array(generateTradingTimeAxis().length).fill(null),
            symbol: 'none',
            lineStyle: { 
                width: 1.5,
                color: '#c0392b'
            },
            itemStyle: {
                color: '#c0392b'
            },
            connectNulls: true
        }, {
            name: '半导体',
            type: 'line',
            data: new Array(generateTradingTimeAxis().length).fill(null),
            symbol: 'none',
            lineStyle: { 
                width: 1.5,
                color: '#2980b9'
            },
            itemStyle: {
                color: '#2980b9'
            },
            connectNulls: true
        }, {
            name: '有色',
            type: 'line',
            data: new Array(generateTradingTimeAxis().length).fill(null),
            symbol: 'none',
            lineStyle: { 
                width: 1.5,
                color: '#d35400'
            },
            itemStyle: {
                color: '#d35400'
            },
            connectNulls: true
        }, {
            name: '光伏',
            type: 'line',
            data: new Array(generateTradingTimeAxis().length).fill(null),
            symbol: 'none',
            lineStyle: { 
                width: 1.5,
                color: '#f1c40f'
            },
            itemStyle: {
                color: '#f1c40f'
            },
            connectNulls: true
        }]
    });
}

// 生成交易时间段
function generateTradingTimeAxis() {
    const times = [];
    // 上午交易时段：9:30-11:30
    for (let h = 9; h <= 11; h++) {
        for (let m = 0; m < 60; m++) {
            if ((h === 9 && m >= 30) || (h === 11 && m <= 30) || (h === 10)) {
                times.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
            }
        }
    }
    // 下午交易时段：13:00-15:00
    for (let h = 13; h <= 15; h++) {
        for (let m = 0; m < 60; m++) {
            if (h !== 15 || m === 0) {
                times.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
            }
        }
    }
    return times;
}

// 固定的交易时间横坐标
const tradingTimes = generateTradingTimeAxis();
let currentDataConsume = new Array(tradingTimes.length).fill(null);
let currentDataEstate = new Array(tradingTimes.length).fill(null);
let currentDataBank = new Array(tradingTimes.length).fill(null);
let currentDataBroker = new Array(tradingTimes.length).fill(null);
let currentDataGame = new Array(tradingTimes.length).fill(null);
let currentDataTourism = new Array(tradingTimes.length).fill(null);
let currentDataMilitary = new Array(tradingTimes.length).fill(null);
let currentDataSoftware = new Array(tradingTimes.length).fill(null);
let currentDataInnovationPharma = new Array(tradingTimes.length).fill(null);
let currentDataSemiconductor = new Array(tradingTimes.length).fill(null);
let currentDataNonferrous = new Array(tradingTimes.length).fill(null);
let currentDataSolar = new Array(tradingTimes.length).fill(null);

// 更新行业走势数据
async function fetchIndustryTrend() {
// 行业指数API地址（已更新）
    const urlConsume = 'https://flash-api.xuangubao.com.cn/api/plate/index_realtime?index_type=1&plate_id=6346009&data_type=1';
    const urlEstate = 'https://flash-api.xuangubao.com.cn/api/plate/index_realtime?index_type=1&plate_id=17236249&data_type=1';
    const urlBank = 'https://flash-api.xuangubao.com.cn/api/plate/index_realtime?index_type=1&plate_id=16997081&data_type=1';
    const urlBroker = 'https://flash-api.xuangubao.com.cn/api/plate/index_realtime?index_type=1&plate_id=17006066&data_type=1';
    const urlGame = 'https://flash-api.xuangubao.com.cn/api/plate/index_realtime?index_type=1&plate_id=18621010&data_type=1';
    const urlTourism = 'https://flash-api.xuangubao.com.cn/api/plate/index_realtime?index_type=1&plate_id=19993841&data_type=1';
    const urlMilitary = 'https://flash-api.xuangubao.com.cn/api/plate/index_realtime?index_type=1&plate_id=25513273&data_type=1';
    const urlSoftware = 'https://flash-api.xuangubao.com.cn/api/plate/index_realtime?index_type=1&plate_id=16853682&data_type=1';
    const urlInnovationPharma = 'https://flash-api.xuangubao.com.cn/api/plate/index_realtime?index_type=1&plate_id=16813522&data_type=1';
    const urlSemiconductor = 'https://flash-api.xuangubao.com.cn/api/plate/index_realtime?index_type=1&plate_id=16844702&data_type=1';
    const urlNonferrous = 'https://flash-api.xuangubao.com.cn/api/plate/index_realtime?index_type=1&plate_id=23460626&data_type=1';
    const urlSolar = 'https://flash-api.xuangubao.com.cn/api/plate/index_realtime?index_type=1&plate_id=21825682&data_type=1';
    
    try {
        const [resConsume, resEstate, resBank, resBroker, resGame, resTourism, resMilitary, resSoftware, resInnovationPharma, resSemiconductor, resNonferrous, resSolar] = await Promise.all([
            fetch(urlConsume),
            fetch(urlEstate),
            fetch(urlBank),
            fetch(urlBroker),
            fetch(urlGame),
            fetch(urlTourism),
            fetch(urlMilitary),
            fetch(urlSoftware),
            fetch(urlInnovationPharma),
            fetch(urlSemiconductor),
            fetch(urlNonferrous),
            fetch(urlSolar)
        ]);
        
        const [dataConsume, dataEstate, dataBank, dataBroker, dataGame, dataTourism, dataMilitary, dataSoftware, dataInnovationPharma, dataSemiconductor, dataNonferrous, dataSolar] = await Promise.all([
            resConsume.json(),
            resEstate.json(),
            resBank.json(),
            resBroker.json(),
            resGame.json(),
            resTourism.json(),
            resMilitary.json(),
            resSoftware.json(),
            resInnovationPharma.json(),
            resSemiconductor.json(),
            resNonferrous.json(),
            resSolar.json()
        ]);

        // 处理数据并更新到固定数组中
        function processData(data, currentData) {
            if (!data?.data?.items) return currentData;
            const items = data.data.items;
            const prevCloseIdx = data.data.prev_close_idx || 1;
            
            items.forEach(item => {
                const time = new Date(item.time * 1000);
                const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
                const index = tradingTimes.indexOf(timeStr);
                if (index !== -1) {
                    // 计算涨跌幅百分比：(当前指数 - 前收盘指数) / 前收盘指数 * 100
                    currentData[index] = ((item.index - prevCloseIdx) / prevCloseIdx * 100);
                }
            });
            return currentData;
        }

        currentDataConsume = processData(dataConsume, currentDataConsume);
        currentDataEstate = processData(dataEstate, currentDataEstate);
        currentDataBank = processData(dataBank, currentDataBank);
        currentDataBroker = processData(dataBroker, currentDataBroker);
        currentDataGame = processData(dataGame, currentDataGame);
        currentDataTourism = processData(dataTourism, currentDataTourism);
        currentDataMilitary = processData(dataMilitary, currentDataMilitary);
        currentDataSoftware = processData(dataSoftware, currentDataSoftware);
        currentDataInnovationPharma = processData(dataInnovationPharma, currentDataInnovationPharma);
        currentDataSemiconductor = processData(dataSemiconductor, currentDataSemiconductor);
        currentDataNonferrous = processData(dataNonferrous, currentDataNonferrous);
        currentDataSolar = processData(dataSolar, currentDataSolar);

        // 更新图表
        industryLineChart.setOption({
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
                name: '消费',
                type: 'line',
                data: currentDataConsume,
                symbol: 'none',
                lineStyle: { 
                    width: 1.5,
                    color: '#d35400'
                },
                itemStyle: {
                    color: '#d35400'
                },
                connectNulls: true
            }, {
                name: '房产',
                type: 'line',
                data: currentDataEstate,
                symbol: 'none',
                lineStyle: { 
                    width: 1.5,
                    color: '#9b59b6'
                },
                itemStyle: {
                    color: '#9b59b6'
                },
                connectNulls: true
            }, {
                name: '银行',
                type: 'line',
                data: currentDataBank,
                symbol: 'none',
                lineStyle: { 
                    width: 1.5,
                    color: '#3498db'
                },
                itemStyle: {
                    color: '#3498db'
                },
                connectNulls: true
            }, {
                name: '券商',
                type: 'line',
                data: currentDataBroker,
                symbol: 'none',
                lineStyle: { 
                    width: 1.5,
                    color: '#2ecc71'
                },
                itemStyle: {
                    color: '#2ecc71'
                },
                connectNulls: true
            }, {
                name: '游戏',
                type: 'line',
                data: currentDataGame,
                symbol: 'none',
                lineStyle: { 
                    width: 1.5,
                    color: '#e74c3c'
                },
                itemStyle: {
                    color: '#e74c3c'
                },
                connectNulls: true
            }, {
                name: '旅游',
                type: 'line',
                data: currentDataTourism,
                symbol: 'none',
                lineStyle: { 
                    width: 1.5,
                    color: '#f39c12'
                },
                itemStyle: {
                    color: '#f39c12'
                },
                connectNulls: true
            }, {
                name: '军工',
                type: 'line',
                data: currentDataMilitary,
                symbol: 'none',
                lineStyle: { 
                    width: 1.5,
                    color: '#8e44ad'
                },
                itemStyle: {
                    color: '#8e44ad'
                },
                connectNulls: true
            }, {
                name: '软件',
                type: 'line',
                data: currentDataSoftware,
                symbol: 'none',
                lineStyle: { 
                    width: 1.5,
                    color: '#16a085'
                },
                itemStyle: {
                    color: '#16a085'
                },
                connectNulls: true
            }, {
                name: '创新药',
                type: 'line',
                data: currentDataInnovationPharma,
                symbol: 'none',
                lineStyle: { 
                    width: 1.5,
                    color: '#c0392b'
                },
                itemStyle: {
                    color: '#c0392b'
                },
                connectNulls: true
            }, {
                name: '半导体',
                type: 'line',
                data: currentDataSemiconductor,
                symbol: 'none',
                lineStyle: { 
                    width: 1.5,
                    color: '#2980b9'
                },
                itemStyle: {
                    color: '#2980b9'
                },
                connectNulls: true
            }, {
                name: '有色',
                type: 'line',
                data: currentDataNonferrous,
                symbol: 'none',
                lineStyle: { 
                    width: 1.5,
                    color: '#d35400'
                },
                itemStyle: {
                    color: '#d35400'
                },
                connectNulls: true
            }, {
                name: '光伏',
                type: 'line',
                data: currentDataSolar,
                symbol: 'none',
                lineStyle: { 
                    width: 1.5,
                    color: '#f1c40f'
                },
                itemStyle: {
                    color: '#f1c40f'
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
                formatter: function(params) {
                    let time = params[0]?.axisValue || '';
                    let html = `<div style="margin-bottom:4px;color:#aaa;">时间：${time}</div>`;
                    html += params.map(item => {
                        const value = item.value != null ? item.value.toFixed(2) : '--';
                        const valueColor = value > 0 ? '#ff5252' : (value < 0 ? '#22e090' : '#aaa');
                        return `
                            ${item.marker}
                            <span style="color:${item.color}">${item.seriesName}</span>: 
                            <span style="color:${valueColor}">${value}%</span>
                        `;
                    }).join('<br>');
                    return html;
                }
            }
        });
    } catch (error) {
        console.error('获取行业指数数据失败:', error);
    }
}
