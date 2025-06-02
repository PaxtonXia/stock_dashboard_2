// market-sentiment.js - 市场情绪相关功能

// 初始化所有ECharts实例
let bar, line1, line2, line3, line4, marketTempGauge, marketTempLineChart;

// 初始化函数
function initMarketSentimentCharts() {
    bar = echarts.init(document.getElementById('bar'));
    line1 = echarts.init(document.getElementById('line1'));
    line2 = echarts.init(document.getElementById('line2'));
    line3 = echarts.init(document.getElementById('line3'));
    line4 = echarts.init(document.getElementById('line4'));
    marketTempGauge = echarts.init(document.getElementById('marketTempGauge'));
    marketTempLineChart = echarts.init(document.getElementById('marketTempLineChart'));
}

// 拉取数据并渲染 ECharts
async function fetchMarketSentiment() {
    const url = 'https://flash-api.xuangubao.com.cn/api/market_indicator/line?fields=rise_count,fall_count,limit_up_count,limit_down_count,limit_up_broken_count,limit_up_broken_ratio,market_temperature,yesterday_limit_up_avg_pcp';
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) return;
        const arr = data.data;
        const last = arr[arr.length-1];

        // 1. 市场真实热度
        const marketTemp = last.market_temperature;
        const marketTempElement = document.querySelector('.dashboard-side .card:nth-child(1) .card-title-row .card-value');
        if (marketTempElement) {
            // 数值精确到小数点后2位
            marketTempElement.textContent = marketTemp.toFixed(2) + '%';
            
            // 更新操作建议
            const adviceType = document.getElementById('adviceType');
            const adviceContent = document.getElementById('adviceContent');
            
            if (marketTemp < 20) {
                adviceType.textContent = '谨慎观望';
                adviceType.style.color = '#22e090';
                adviceContent.textContent = '市场热度低迷，交投不活跃，建议以观望为主，控制仓位，等待市场企稳信号。';
            } else if (marketTemp >= 20 && marketTemp < 40) {
                adviceType.textContent = '轻仓试探';
                adviceType.style.color = '#ffcc00';
                adviceContent.textContent = '市场热度温和，可轻仓参与，关注强势板块，设置止损位，控制风险。';
            } else if (marketTemp >= 40 && marketTemp < 60) {
                adviceType.textContent = '积极参与';
                adviceType.style.color = '#ff9900';
                adviceContent.textContent = '市场热度适中，可适当加仓，跟踪市场热点，注意个股基本面，波段操作为宜。';
            } else if (marketTemp >= 60 && marketTemp < 80) {
                adviceType.textContent = '波段操作';
                adviceType.style.color = '#ff5252';
                adviceContent.textContent = '市场热度较高，短线机会增多，可适度参与，但需注意高位风险，及时止盈。';
            } else {
                adviceType.textContent = '注意风险';
                adviceType.style.color = '#ff0000';
                adviceContent.textContent = '市场热度过高，存在泡沫风险，建议降低仓位，落袋为安，规避风险。';
            }
        } else {
            console.error('Market temperature element not found');
        }
        
        // 更新仪表盘数据
        marketTempGauge.setOption({
            series: [{
                type: 'gauge',
                startAngle: 180,
                endAngle: 0,
                min: 0,
                max: 100,
                splitNumber: 4,
                axisLine: {
                    lineStyle: {
                        width: 8,
                        color: [[0.4, '#22e090'], [0.6, '#ffcc00'], [1, '#ff5252']]
                    }
                },
                pointer: { show: true }, // 显示指针
                progress: { show: false },
                axisTick: { show: false },
                splitLine: { show: false },
                axisLabel: { show: false },
                detail: { 
                    show: true, // 显示数值
                    formatter: function (value) {
                        return value.toFixed(2) + '%热度'; // 格式化数值，保留两位小数
                    },
                    fontSize: 20, // 增大字体大小
                    offsetCenter: ['0%', '80%'], // 调整位置
                    color: 'auto'
                },
                data: [{ value: marketTemp }]
            }],
            textStyle: { color: '#ffffff' }
        });

        // 生成固定时间轴
        let timeAxis = generateTradingTimeAxis();
        // 用null填充
        const fixedData = new Array(timeAxis.length).fill(null);
        // 将历史数据填入对应时间点
        arr.forEach(d => {
            const t = formatTimeHM(d.timestamp);
            const idx = timeAxis.indexOf(t);
            if (idx !== -1) fixedData[idx] = d.market_temperature;
        });
        marketTempLineChart.setOption({
            grid: { left: 5, right: 5, top: 5, bottom: 5, containLabel: true },
            xAxis: { 
                type: 'category',
                data: timeAxis
            },
            yAxis: { 
                type: 'value', 
                show: false,
                scale: true
            },
            series: [{
                name: '市场真实热度',
                type: 'line',
                data: fixedData,
                smooth: true,
                showSymbol: false,
                lineStyle: { color: '#3388ff', width: 1.5 },
                areaStyle: { color: 'rgba(51, 136, 255, 0.15)' }
            }],
            tooltip: {
                trigger: 'axis',
                formatter: function (params) {
                    const idx = params[0].dataIndex;
                    const t = timeAxis[idx];
                    const v = params[0].value;
                    return `${t}\n热度: ${typeof v === 'number' && !isNaN(v) ? v.toFixed(2) : '--'}%`;
                }
            }
        });

        // 2. 涨跌分布
        try {
            const distRes = await fetch('https://flash-api.xuangubao.com.cn/api/market_indicator/pcp_distribution');
            const distData = await distRes.json();
            
            if (distData.code === 20000) {
                const dist = distData.data;
                const categories = [];
                const values = [];
                const colors = [];
                
                // Negative changes (left side)
                for (let i = -20; i < 0; i++) {
                    if (dist[i] > 0) {
                        categories.push(i + '%');
                        values.push(dist[i]);
                        colors.push('#1ecb7b');
                    }
                }
                
                // Zero change
                categories.push('0%');
                values.push(dist[0]);
                colors.push('#888888');
                
                // Positive changes (right side)
                for (let i = 1; i <= 20; i++) {
                    if (dist[i] > 0) {
                        categories.push(i + '%');
                        values.push(dist[i]);
                        colors.push('#ff4c4c');
                    }
                }
                
                // Special cases (limit up/down)
                categories.push('涨停');
                values.push(dist.limit_up_count);
                colors.push('#00aa00');
                
                categories.push('ST涨停');
                values.push(dist.st_limit_up_count);
                colors.push('#66ff66');
                
                categories.push('跌停');
                values.push(dist.limit_down_count);
                colors.push('#ff0000');
                
                categories.push('ST跌停');
                values.push(dist.st_limit_down_count);
                colors.push('#ff6666');
                
                bar.setOption({
                    grid: { left: 40, right: 40, top: 20, bottom: 30 },
                    xAxis: {
                        type: 'category',
                        data: categories,
                        axisLabel: {
                            interval: 0,
                            rotate: 45,
                            fontSize: 10
                        },
                        splitLine: {
                            show: true,
                            lineStyle: {
                                type: 'dashed',
                                color: 'rgba(255,255,255,0.15)'
                            }
                        }
                    },
                    yAxis: {
                        type: 'value',
                        axisLabel: {
                            fontSize: 10
                        },
                        splitLine: {
                            show: true,
                            lineStyle: {
                                type: 'dashed',
                                color: 'rgba(255,255,255,0.15)'
                            }
                        }
                    },
                    series: [{
                        type: 'bar',
                        data: values,
                        itemStyle: {
                            color: function(params) {
                                return colors[params.dataIndex];
                            },
                            borderRadius: [2,2,0,0]
                        },
                        barWidth: '60%',
                        label: {
                            show: true,
                            position: 'top',
                            fontSize: 10,
                            formatter: function(params) {
                                return params.value > 50 ? params.value : '';
                            }
                        }
                    }],
                    tooltip: {
                        trigger: 'item',
                        formatter: function(params) {
                            return `${params.name}: ${params.value}家`;
                        }
                    }
                });
            }
        } catch (e) {
            console.error('涨跌分布接口异常', e);
        }

        // 3. 涨跌停对比
        // 生成固定时间轴
        timeAxis = generateTradingTimeAxis();
        const upArr = new Array(timeAxis.length).fill(null);
        const downArr = new Array(timeAxis.length).fill(null);
        // 填充历史数据
        arr.forEach(d => {
            const t = formatTimeHM(d.timestamp);
            const idx = timeAxis.indexOf(t);
            if (idx !== -1) {
                upArr[idx] = d.limit_up_count;
                downArr[idx] = d.limit_down_count;
            }
        });
        // 取最后一个非null的涨跌停数
        let lastUp = '--', lastDown = '--';
        for (let i = upArr.length - 1; i >= 0; i--) {
            if (typeof upArr[i] === 'number' && typeof downArr[i] === 'number') {
                lastUp = upArr[i];
                lastDown = downArr[i];
                break;
            }
        }
        const limitUpCard = document.querySelector('.dashboard-side .card:nth-child(4)');
        if (limitUpCard) {
            const titleRow = limitUpCard.querySelector('.card-title-row');
            if (titleRow) {
                const values = titleRow.querySelectorAll('.card-value');
                if (values.length >= 2) {
                    values[0].textContent = `${lastUp}:${lastDown}`;
                    values[1].style.display = 'none';
                }
            }
        }
        line1.setOption({
            animation: false, // Disable animation for better performance
            grid: { left: 0, right: 0, top: 8, bottom: 24, containLabel: true },
            yAxis: { show: false,
                splitLine: {
                    show: true,
                    lineStyle: {
                        type: 'dashed',
                        color: 'rgba(255,255,255,0.2)'
                    }
                }
            },
            xAxis: {
                type: 'category',
                data: timeAxis,
                show: true,
                axisLabel: {
                    interval: Math.floor(timeAxis.length/8),
                    fontSize: 10,
                    color: '#ffffff',
                    formatter: function(value) {
                        return value.substring(0,5); // 显示HH:MM
                    }
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        type: 'dashed',
                        color: 'rgba(255,255,255,0.2)'
                    }
                }
            },
            series: [{
                type: 'line',
                data: upArr,
                lineStyle: { color: '#ff5252', width: 1.5 },
                symbol: 'none',
                areaStyle: { color: 'rgba(255, 82, 82, 0.15)' },
                smooth: true,
                showSymbol: false
            }, {
                type: 'line',
                data: downArr,
                lineStyle: { color: '#22e090', width: 1.5 },
                symbol: 'none',
                areaStyle: { color: 'rgba(34, 224, 144, 0.15)' },
                smooth: true,
                showSymbol: false
            }],
            tooltip: {
                trigger: 'axis',
                formatter: function (params) {
                    const idx = params[0].dataIndex;
                    const t = timeAxis[idx];
                    const upValue = params[0]?.value ?? '--';
                    const downValue = params[1]?.value ?? '--';
                    return `${t}\n涨停: ${typeof upValue === 'number' && !isNaN(upValue) ? upValue : '--'}\n跌停: ${typeof downValue === 'number' && !isNaN(downValue) ? downValue : '--'}`;
                }
            }
        });

        // 4. 涨跌家数对比
        // 生成固定时间轴数据
        const riseArr = new Array(timeAxis.length).fill(null);
        const fallArr = new Array(timeAxis.length).fill(null);
        arr.forEach(d => {
            const t = formatTimeHM(d.timestamp);
            const idx = timeAxis.indexOf(t);
            if (idx !== -1) {
                riseArr[idx] = d.rise_count;
                fallArr[idx] = d.fall_count;
            }
        });
        // 取最后一个非null的涨跌家数
        let lastRise = '--', lastFall = '--';
        for (let i = riseArr.length - 1; i >= 0; i--) {
            if (typeof riseArr[i] === 'number' && typeof fallArr[i] === 'number') {
                lastRise = riseArr[i];
                lastFall = fallArr[i];
                break;
            }
        }
        document.querySelector('.dashboard-side .card:nth-child(3) .card-title-row .card-value').textContent = `${lastRise}:${lastFall}`;

        // 设置涨跌家数对比图表
        line2.setOption({
            grid: { left: 0, right: 0, top: 8, bottom: 24, containLabel: true },
            xAxis: { 
                show: true,
                type: 'category',
                data: timeAxis,
                axisLabel: {
                    interval: Math.floor(timeAxis.length/8),
                    fontSize: 10,
                    color: '#ffffff',
                    formatter: function(value) {
                        return value.substring(0,5);
                    }
                },
                boundaryGap: false,
                splitLine: {
                    show: true,
                    lineStyle: {
                        type: 'dashed',
                        color: 'rgba(255,255,255,0.2)'
                    }
                }
            },
            yAxis: { 
                show: false,
                type: 'value',
                scale: true,
                splitLine: {
                    show: true,
                    lineStyle: {
                        type: 'dashed',
                        color: 'rgba(255,255,255,0.2)'
                    }
                }
            },
            series: [
                {
                    type: 'line',
                    data: riseArr,
                    lineStyle: { color: '#ff5252', width: 1.5 },
                    symbol: 'none',
                    areaStyle: { color: 'rgba(255, 76, 76, 0.08)' },
                    smooth: true,
                    showSymbol: false,
                    connectNulls: true
                },
                {
                    type: 'line',
                    data: fallArr,
                    lineStyle: { color: '#1ecb7b', width: 1 },
                    symbol: 'none',
                    areaStyle: { color: 'rgba(30, 203, 123, 0.08)' },
                    smooth: true,
                    showSymbol: false,
                    connectNulls: true
                }
            ],
            tooltip: {
                trigger: 'axis',
                formatter: function (params) {
                    const idx = params[0].dataIndex;
                    const t = timeAxis[idx];
                    const upValue = params[0]?.value ?? '--';
                    const downValue = params[1]?.value ?? '--';
                    return `${t}\n上涨: ${typeof upValue === 'number' && !isNaN(upValue) ? upValue : '--'}\n下跌: ${typeof downValue === 'number' && !isNaN(downValue) ? downValue : '--'}`;
                }
            }
        });

        // 5. 封板未遂
        // 生成固定时间轴数据
        const brokenArr = new Array(timeAxis.length).fill(null);
        const limitUpArrForBroken = new Array(timeAxis.length).fill(null);
        arr.forEach(d => {
            const t = formatTimeHM(d.timestamp);
            const idx = timeAxis.indexOf(t);
            if (idx !== -1) {
                brokenArr[idx] = d.limit_up_broken_count;
                limitUpArrForBroken[idx] = d.limit_up_count;
            }
        });
        // 取最后一个非null的封板未遂和炸板率
        let lastBroken = '--', lastLimitUp = '--', lastRatio = '--';
        for (let i = brokenArr.length - 1; i >= 0; i--) {
            if (typeof brokenArr[i] === 'number' && typeof limitUpArrForBroken[i] === 'number' && limitUpArrForBroken[i] !== 0) {
                lastBroken = brokenArr[i];
                lastLimitUp = limitUpArrForBroken[i];
                lastRatio = ((lastBroken / lastLimitUp) * 100).toFixed(0);
                break;
            }
        }
        document.querySelector('.dashboard-side .card:nth-child(5) .card-title-row .card-value.gray').textContent = `（炸板率${lastRatio}%）`;

        // 设置封板未遂图表
        line3.setOption({
            grid: { left: 0, right: 0, top: 8, bottom: 24, containLabel: true },
            xAxis: { 
                show: true,
                type: 'category',
                data: timeAxis,
                axisLabel: {
                    interval: Math.floor(timeAxis.length/8),
                    fontSize: 10,
                    color: '#ffffff',
                    formatter: function(value) {
                        return value.substring(0,5);
                    }
                },
                boundaryGap: false,
                splitLine: {
                    show: true,
                    lineStyle: {
                        type: 'dashed',
                        color: 'rgba(255,255,255,0.2)'
                    }
                }
            },
            yAxis: { show: false,
                splitLine: {
                    show: true,
                    lineStyle: {
                        type: 'dashed',
                        color: 'rgba(255,255,255,0.2)'
                    }
                }
            },
            series: [{
                type: 'line',
                data: brokenArr,
                lineStyle: { color: '#3388ff', width: 1.5 },
                symbol: 'none',
                areaStyle: { color: 'rgba(51, 136, 255, 0.15)' },
                smooth: true,
                showSymbol: false,
                connectNulls: true
            }],
            tooltip: {
                trigger: 'axis',
                formatter: function (params) {
                    const idx = params[0].dataIndex;
                    const t = timeAxis[idx];
                    const brokenValue = params[0]?.value ?? '--';
                    const limitUpValue = limitUpArrForBroken[idx];
                    let ratio = '--';
                    if (typeof brokenValue === 'number' && typeof limitUpValue === 'number' && limitUpValue !== 0) {
                        ratio = ((brokenValue/limitUpValue)*100).toFixed(1) + '%';
                    }
                    return `${t}\n封板未遂: ${typeof brokenValue === 'number' && !isNaN(brokenValue) ? brokenValue : '--'}\n炸板率: ${ratio}`;
                }
            }
        });

        // 6. 昨日涨停今日表现
        const yArr = new Array(timeAxis.length).fill(null);
        arr.forEach(d => {
            const t = formatTimeHM(d.timestamp);
            const idx = timeAxis.indexOf(t);
            if (idx !== -1) {
                yArr[idx] = d.yesterday_limit_up_avg_pcp*100;
            }
        });
        const lastValue = yArr.filter(v => typeof v === 'number' && !isNaN(v)).slice(-1)[0] || 0;
        const yesterdayLimitUpElement = document.querySelector('.dashboard-side .card:nth-child(6) .card-title-row .card-value.red');
        if (yesterdayLimitUpElement) {
            yesterdayLimitUpElement.textContent = lastValue.toFixed(2) + '%';
        } else {
            console.error('Yesterday limit up element not found');
        }
        line4.setOption({
            grid: { left: 0, right: 0, top: 8, bottom: 24, containLabel: true },
            xAxis: { 
                show: true,
                type: 'category',
                data: timeAxis,
                axisLabel: {
                    interval: Math.floor(timeAxis.length/8),
                    fontSize: 10,
                    color: '#ffffff',
                    formatter: function(value) {
                        return value.substring(0,5);
                    }
                },
                boundaryGap: false,
                splitLine: {
                    show: true,
                    lineStyle: {
                        type: 'dashed',
                        color: 'rgba(255,255,255,0.2)'
                    }
                }
            },
            yAxis: { show: false,
                splitLine: {
                    show: true,
                    lineStyle: {
                        type: 'dashed',
                        color: 'rgba(255,255,255,0.2)'
                    }
                }
            },
            series: [{
                type: 'line',
                data: yArr,
                lineStyle: { color: lastValue >= 0 ? '#22e090' : '#ff5252', width: 1.5 },
                symbol: 'none',
                areaStyle: { color: lastValue >= 0 ? 'rgba(34, 224, 144, 0.15)' : 'rgba(255, 82, 82, 0.15)' },
                smooth: true,
                showSymbol: false
            }],
            tooltip: {
                trigger: 'axis',
                formatter: function (params) {
                    const idx = params[0].dataIndex;
                    const t = timeAxis[idx];
                    const v = params[0].value;
                    return `${t}\n表现: ${typeof v === 'number' && !isNaN(v) ? v.toFixed(2) : '--'}%`;
                }
            }
        });
    } catch(e) { console.error('市场情绪接口异常',e); }
} 