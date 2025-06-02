// 市场情绪模块
const MarketSentiment = {
    gaugeChart: null,
    lineChart: null,
    data: {
        times: [],
        values: []
    },

    init() {
        this.gaugeChart = echarts.init(document.getElementById('marketTempGauge'));
        this.lineChart = echarts.init(document.getElementById('marketTempLineChart'));
        this.setupCharts();
        this.startDataFetch();
    },

    setupCharts() {
        // 设置仪表盘
        const gaugeOption = {
            series: [{
                type: 'gauge',
                startAngle: 180,
                endAngle: 0,
                min: 0,
                max: 100,
                splitNumber: 10,
                itemStyle: {
                    color: '#1ecb7b'
                },
                progress: {
                    show: true,
                    roundCap: true,
                    width: 18
                },
                pointer: {
                    show: false
                },
                axisLine: {
                    roundCap: true,
                    lineStyle: {
                        width: 18
                    }
                },
                axisTick: {
                    splitNumber: 2,
                    lineStyle: {
                        width: 2,
                        color: '#999'
                    }
                },
                splitLine: {
                    length: 12,
                    lineStyle: {
                        width: 3,
                        color: '#999'
                    }
                },
                axisLabel: {
                    distance: 30,
                    color: '#999',
                    fontSize: 14
                },
                title: {
                    show: false
                },
                detail: {
                    backgroundColor: '#1e1e1e',
                    borderColor: '#999',
                    borderWidth: 2,
                    width: '60%',
                    lineHeight: 40,
                    height: 40,
                    borderRadius: 8,
                    offsetCenter: [0, '-15%'],
                    valueAnimation: true,
                    formatter: '{value}',
                    color: '#fff'
                },
                data: [{
                    value: 50
                }]
            }]
        };

        // 设置趋势线图
        const lineOption = {
            grid: {
                top: '5%',
                left: '3%',
                right: '4%',
                bottom: '8%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: this.generateTradingTimeAxis(),
                axisLine: { lineStyle: { color: '#333' } },
                axisLabel: { color: '#888' }
            },
            yAxis: {
                type: 'value',
                axisLine: { lineStyle: { color: '#333' } },
                axisLabel: { color: '#888' },
                splitLine: { lineStyle: { color: '#333', type: 'dashed' } }
            },
            series: [{
                data: new Array(240).fill(null),
                type: 'line',
                smooth: true,
                symbol: 'none',
                lineStyle: { color: '#1ecb7b' },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(30,203,123,0.3)' },
                        { offset: 1, color: 'rgba(30,203,123,0)' }
                    ])
                },
                connectNulls: true
            }]
        };

        this.gaugeChart.setOption(gaugeOption);
        this.lineChart.setOption(lineOption);
    },

    generateTradingTimeAxis() {
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
    },

    startDataFetch() {
        setInterval(async () => {
            try {
                const response = await fetch('/api/market/sentiment');
                const data = await response.json();
                
                // 更新仪表盘
                this.gaugeChart.setOption({
                    series: [{
                        data: [{
                            value: data.currentValue
                        }]
                    }]
                });

                // 更新趋势线
                const currentTime = new Date();
                const timeStr = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
                const timeIndex = this.lineChart.getOption().xAxis[0].data.indexOf(timeStr);
                
                if (timeIndex !== -1) {
                    const newData = this.lineChart.getOption().series[0].data.slice();
                    newData[timeIndex] = data.currentValue;
                    
                    this.lineChart.setOption({
                        series: [{
                            data: newData
                        }]
                    });
                }
            } catch (error) {
                console.error('获取市场情绪数据失败:', error);
            }
        }, 30000); // 30秒更新一次
    }
};