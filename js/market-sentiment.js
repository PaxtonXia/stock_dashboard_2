// market-sentiment.js - 市场情绪相关功能

// 初始化所有ECharts实例
let bar, line1, line2, line3, line4, marketTempGauge, marketTempLineChart;

// 股吧情绪相关实例
let gubaSentimentGauge, gubaSentimentChart;

// 初始化函数
function initMarketSentimentCharts() {
    bar = echarts.init(document.getElementById('bar'));
    line1 = echarts.init(document.getElementById('line1'));
    line2 = echarts.init(document.getElementById('line2'));
    line3 = echarts.init(document.getElementById('line3'));
    line4 = echarts.init(document.getElementById('line4'));
    marketTempGauge = echarts.init(document.getElementById('marketTempGauge'));
    marketTempLineChart = echarts.init(document.getElementById('marketTempLineChart'));
    
    // 股吧情绪初始化
    gubaSentimentGauge = echarts.init(document.getElementById('gubaSentimentGauge'));
    gubaSentimentChart = echarts.init(document.getElementById('gubaSentimentChart'));
}

// ==================== 股吧情绪 ====================
function fetchGubaSentiment() {
    const url = 'https://gbapi.eastmoney.com/data/api/Data/GetIndexData?product=guba&version=9005000&plat=ipad&deviceid=1&callback=__jp0';
    const script = document.createElement('script');
    script.src = url;
    document.body.appendChild(script);

    window.__jp0 = function(data) {
        try {
            if (data && data.re && Array.isArray(data.re)) {
                updateGubaChart(data.re);
                updateGubaAdvice(data.re[0].value);
            } else {
                console.error('Invalid data format:', data);
            }
        } catch (e) {
            console.error('Error processing data:', e);
        } finally {
            document.body.removeChild(script);
        }
    };
}

function updateGubaChart(data) {
    const recentData = data.slice(0, 30).reverse();
    const times = recentData.map(item => {
        const d = new Date(item.time);
        return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    });
    const values = recentData.map(item => {
        const val = parseFloat(item.value) * 100;
        return isNaN(val) ? null : val;
    });
    const currentValue = values[values.length - 1] || 0;

    // 更新卡片数值
    const gubaValueEl = document.querySelector('.sentiment-col:last-child .sentiment-label .card-value');
    if (gubaValueEl) {
        gubaValueEl.textContent = `${currentValue.toFixed(1)}%`;
    }

    // 仪表盘
    gubaSentimentGauge.setOption({
        series: [{
            type: 'gauge',
            startAngle: 180, endAngle: 0,
            min: 0, max: 100, splitNumber: 4,
            axisLine: { lineStyle: { width: 8, color: [[0.4, '#34d058'], [0.6, '#f59f00'], [1, '#ef4444']] } },
            pointer: { show: true },
            progress: { show: false },
            axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
            detail: { show: true, formatter: v => v.toFixed(1) + '%', fontSize: 18, offsetCenter: ['0%', '80%'], color: 'auto' },
            data: [{ value: currentValue }]
        }],
        textStyle: { color: '#ffffff' }
    });

    // 趋势线
    gubaSentimentChart.setOption({
        grid: { left: 5, right: 5, top: 5, bottom: 5, containLabel: true },
        xAxis: {
            type: 'category', data: times,
            axisLine: { lineStyle: { color: '#666' } },
            axisLabel: { color: '#d0d0d0', fontSize: 10, formatter: v => v.substring(0,5) },
            splitLine: { show: true, lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.1)' } }
        },
        yAxis: { type: 'value', show: false, scale: true },
        series: [{
            name: '股吧情绪', type: 'line', data: values,
            smooth: true, showSymbol: false,
            lineStyle: { color: '#3b82f6', width: 1.5 },
            areaStyle: { color: 'rgba(59, 130, 246, 0.12)' }
        }],
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(20,20,40,0.95)', borderColor: '#3a3a5a', textStyle: { color: '#fff' },
            formatter: params => {
                const v = params[0].value;
                return `${times[params[0].dataIndex]}\n情绪: ${typeof v === 'number' && !isNaN(v) ? v.toFixed(2) : '--'}%`;
            }
        }
    });
}

function updateGubaAdvice(value) {
    const pct = value * 100;
    const typeEl = document.getElementById('gubaAdviceType');
    const contentEl = document.getElementById('gubaAdviceContent');
    if (pct > 70) {
        typeEl.textContent = '积极'; typeEl.style.color = 'var(--c-fall-bright)';
        contentEl.textContent = '股吧情绪高涨，投资者乐观情绪较强，可考虑适当参与热门话题个股';
    } else if (pct > 50) {
        typeEl.textContent = '中性'; typeEl.style.color = 'var(--c-warn-bright)';
        contentEl.textContent = '股吧情绪平稳，投资者观望情绪较浓，建议谨慎操作';
    } else {
        typeEl.textContent = '谨慎'; typeEl.style.color = 'var(--c-rise-bright)';
        contentEl.textContent = '股吧情绪低迷，投资者悲观情绪较重，建议控制仓位等待机会';
    }
}

// ==================== 浮动资金流 ====================
function updateFloatingFundFlow(data) {
    const sorted = [...data].sort((a, b) => b['主力净流入_亿'] - a['主力净流入_亿']);
    const topInflows = sorted.filter(i => i['主力净流入_亿'] > 0).slice(0, 5);
    const topOutflows = sorted.filter(i => i['主力净流入_亿'] < 0)
                             .sort((a, b) => a['主力净流入_亿'] - b['主力净流入_亿']).slice(0, 5);

    document.getElementById('topInflowsList').innerHTML = topInflows.map(item => `
        <div class="floating-fund-flow-item">
            <span class="floating-fund-flow-name" onclick="openStockModal('bankuai.html?blockCode=${encodeURIComponent(item['板块代码'] || '')}')">${item['板块名称']}</span>
            <span class="floating-fund-flow-value positive">+${item['主力净流入_亿'].toFixed(2)}亿</span>
        </div>
    `).join('');

    document.getElementById('topOutflowsList').innerHTML = topOutflows.length > 0
        ? topOutflows.map(item => `
            <div class="floating-fund-flow-item">
                <span class="floating-fund-flow-name" onclick="openStockModal('bankuai.html?blockCode=${encodeURIComponent(item['板块代码'] || '')}')">${item['板块名称']}</span>
                <span class="floating-fund-flow-value negative">${item['主力净流入_亿'].toFixed(2)}亿</span>
            </div>
        `).join('')
        : '<div class="floating-fund-flow-item" style="color:var(--c-text-muted);justify-content:center;">暂无净流出板块</div>';
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
        const marketTempElement = document.querySelector('.sentiment-col:first-child .sentiment-label .card-value');
        if (marketTempElement) {
            marketTempElement.textContent = marketTemp.toFixed(2) + '%';
            
            const adviceType = document.getElementById('adviceType');
            const adviceContent = document.getElementById('adviceContent');
            
            if (adviceType && adviceContent) {
                if (marketTemp < 20) {
                    adviceType.textContent = '谨慎观望';
                    adviceType.style.color = '#34d058';
                    adviceContent.textContent = '市场热度低迷，交投不活跃，建议以观望为主，控制仓位，等待市场企稳信号。';
                } else if (marketTemp >= 20 && marketTemp < 40) {
                    adviceType.textContent = '轻仓试探';
                    adviceType.style.color = '#f59f00';
                    adviceContent.textContent = '市场热度温和，可轻仓参与，关注强势板块，设置止损位，控制风险。';
                } else if (marketTemp >= 40 && marketTemp < 60) {
                    adviceType.textContent = '积极参与';
                    adviceType.style.color = '#f59f00';
                    adviceContent.textContent = '市场热度适中，可适当加仓，跟踪市场热点，注意个股基本面，波段操作为宜。';
                } else if (marketTemp >= 60 && marketTemp < 80) {
                    adviceType.textContent = '波段操作';
                    adviceType.style.color = '#ef4444';
                    adviceContent.textContent = '市场热度较高，短线机会增多，可适度参与，但需注意高位风险，及时止盈。';
                } else {
                    adviceType.textContent = '注意风险';
                    adviceType.style.color = '#ff0000';
                    adviceContent.textContent = '市场热度过高，存在泡沫风险，建议降低仓位，落袋为安，规避风险。';
                }
            }
        }
        
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
                        color: [[0.4, '#34d058'], [0.6, '#f59f00'], [1, '#ef4444']]
                    }
                },
                pointer: { show: true },
                progress: { show: false },
                axisTick: { show: false },
                splitLine: { show: false },
                axisLabel: { show: false },
                detail: { 
                    show: true,
                    formatter: function (value) {
                        return value.toFixed(2) + '%';
                    },
                    fontSize: 20,
                    offsetCenter: ['0%', '80%'],
                    color: 'auto'
                },
                data: [{ value: marketTemp }]
            }],
            textStyle: { color: '#ffffff' }
        });

        let timeAxis = generateTradingTimeAxis();
        const fixedData = new Array(timeAxis.length).fill(null);
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
                lineStyle: { color: '#3b82f6', width: 1.5 },
                areaStyle: { color: 'rgba(59, 130, 246, 0.15)' }
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
                
                for (let i = -20; i < 0; i++) {
                    if (dist[i] > 0) {
                        categories.push(i + '%');
                        values.push(dist[i]);
                        colors.push('#34d058');
                    }
                }
                
                categories.push('0%');
                values.push(dist[0]);
                colors.push('#888888');
                
                for (let i = 1; i <= 20; i++) {
                    if (dist[i] > 0) {
                        categories.push(i + '%');
                        values.push(dist[i]);
                        colors.push('#ef4444');
                    }
                }
                
                categories.push('涨停');
                values.push(dist.limit_up_count);
                colors.push('#22c55e');
                
                categories.push('ST涨停');
                values.push(dist.st_limit_up_count);
                colors.push('#86efac');
                
                categories.push('跌停');
                values.push(dist.limit_down_count);
                colors.push('#dc2626');
                
                categories.push('ST跌停');
                values.push(dist.st_limit_down_count);
                colors.push('#fca5a5');
                
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
        timeAxis = generateTradingTimeAxis();
        const upArr = new Array(timeAxis.length).fill(null);
        const downArr = new Array(timeAxis.length).fill(null);
        arr.forEach(d => {
            const t = formatTimeHM(d.timestamp);
            const idx = timeAxis.indexOf(t);
            if (idx !== -1) {
                upArr[idx] = d.limit_up_count;
                downArr[idx] = d.limit_down_count;
            }
        });
        let lastUp = '--', lastDown = '--';
        for (let i = upArr.length - 1; i >= 0; i--) {
            if (typeof upArr[i] === 'number' && typeof downArr[i] === 'number') {
                lastUp = upArr[i];
                lastDown = downArr[i];
                break;
            }
        }
        const limitUpDownEl = document.getElementById('limitUpDownCount');
        if (limitUpDownEl) {
            limitUpDownEl.textContent = lastUp + '/' + lastDown;
        }
        line1.setOption({
            animation: false,
            grid: { left: 0, right: 0, top: 26, bottom: 24, containLabel: true },
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
                        return value.substring(0,5);
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
                lineStyle: { color: '#ef4444', width: 1.5 },
                symbol: 'none',
                areaStyle: { color: 'rgba(239, 68, 68, 0.15)' },
                smooth: true,
                showSymbol: false
            }, {
                type: 'line',
                data: downArr,
                lineStyle: { color: '#34d058', width: 1.5 },
                symbol: 'none',
                areaStyle: { color: 'rgba(52, 208, 88, 0.15)' },
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
        let lastRise = '--', lastFall = '--';
        for (let i = riseArr.length - 1; i >= 0; i--) {
            if (typeof riseArr[i] === 'number' && typeof fallArr[i] === 'number') {
                lastRise = riseArr[i];
                lastFall = fallArr[i];
                break;
            }
        }
        const riseFallEl = document.getElementById('riseFallCount');
        if (riseFallEl) {
            riseFallEl.textContent = lastRise + ':' + lastFall;
        }

        line2.setOption({
            grid: { left: 0, right: 0, top: 26, bottom: 24, containLabel: true },
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
                    lineStyle: { color: '#ef4444', width: 1.5 },
                    symbol: 'none',
                    areaStyle: { color: 'rgba(239, 68, 68, 0.08)' },
                    smooth: true,
                    showSymbol: false,
                    connectNulls: true
                },
                {
                    type: 'line',
                    data: fallArr,
                    lineStyle: { color: '#34d058', width: 1 },
                    symbol: 'none',
                    areaStyle: { color: 'rgba(52, 208, 88, 0.08)' },
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
        let lastBroken = '--', lastLimitUp = '--', lastRatio = '--';
        for (let i = brokenArr.length - 1; i >= 0; i--) {
            if (typeof brokenArr[i] === 'number' && typeof limitUpArrForBroken[i] === 'number' && limitUpArrForBroken[i] !== 0) {
                lastBroken = brokenArr[i];
                lastLimitUp = limitUpArrForBroken[i];
                lastRatio = ((lastBroken / lastLimitUp) * 100).toFixed(0);
                break;
            }
        }
        const brokenRateEl = document.getElementById('brokenRate');
        if (brokenRateEl) {
            brokenRateEl.textContent = lastRatio + '%';
        }

        line3.setOption({
            grid: { left: 0, right: 0, top: 26, bottom: 24, containLabel: true },
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
                lineStyle: { color: '#3b82f6', width: 1.5 },
                symbol: 'none',
                areaStyle: { color: 'rgba(59, 130, 246, 0.15)' },
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
        const yesterdayLimitEl = document.getElementById('yesterdayLimit');
        if (yesterdayLimitEl) {
            yesterdayLimitEl.textContent = lastValue.toFixed(2) + '%';
        }
        line4.setOption({
            grid: { left: 0, right: 0, top: 26, bottom: 24, containLabel: true },
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
                lineStyle: { color: lastValue >= 0 ? '#34d058' : '#ef4444', width: 1.5 },
                symbol: 'none',
                areaStyle: { color: lastValue >= 0 ? 'rgba(52, 208, 88, 0.15)' : 'rgba(239, 68, 68, 0.15)' },
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

// 初始化调用
document.addEventListener('DOMContentLoaded', fetchGubaSentiment);
setInterval(fetchGubaSentiment, 60000);

// 初始示例数据
updateFloatingFundFlow([
    {"板块名称":"电子元件","板块代码":"BK0451","主力净流入_亿":12.5},
    {"板块名称":"医药制造","板块代码":"BK0465","主力净流入_亿":8.7},
    {"板块名称":"银行","板块代码":"BK0475","主力净流入_亿":-3.2},
    {"板块名称":"房地产","板块代码":"BK0451","主力净流入_亿":-5.8},
    {"板块名称":"汽车制造","板块代码":"BK0481","主力净流入_亿":6.3},
    {"板块名称":"钢铁","板块代码":"BK0479","主力净流入_亿":-2.1},
    {"板块名称":"煤炭","板块代码":"BK0437","主力净流入_亿":3.9},
    {"板块名称":"食品饮料","板块代码":"BK0438","主力净流入_亿":7.2},
    {"板块名称":"计算机","板块代码":"BK0459","主力净流入_亿":9.8},
    {"板块名称":"通信","板块代码":"BK0448","主力净流入_亿":5.4}
]);

// 浮动资金流关闭按钮
document.getElementById('floatingFundFlowClose')?.addEventListener('click', function() {
    document.getElementById('floatingFundFlow').style.display = 'none';
});

// 窗口大小变化时重新调整图表
window.addEventListener('resize', function() {
    gubaSentimentChart?.resize();
});
