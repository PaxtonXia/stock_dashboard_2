// 主要指数走势模块
const MarketTrend = {
    chart: null,
    data: {
        times: [],
        values: {
            sh: [],
            sz: [],
            zz: [],
            a500: []
        }
    },

    init() {
        this.chart = echarts.init(document.getElementById('mainIndexLineChart'));
        this.setupChart();
        this.startDataFetch();
    },

    setupChart() {
        const option = {
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: '5%',
                containLabel: true
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'line',
                    lineStyle: {
                        color: '#555',
                        type: 'dashed'
                    }
                }
            },
            legend: {
                data: ['上证指数', '深证成指', '中证1000', 'A500'],
                textStyle: { color: '#888' },
                top: 0,
                right: 0
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
            series: [
                {
                    name: '上证指数',
                    type: 'line',
                    data: new Array(240).fill(null),
                    lineStyle: { color: '#ff4c4c' },
                    itemStyle: { color: '#ff4c4c' },
                    connectNulls: true
                },
                {
                    name: '深证成指',
                    type: 'line',
                    data: new Array(240).fill(null),
                    lineStyle: { color: '#1ecb7b' },
                    itemStyle: { color: '#1ecb7b' },
                    connectNulls: true
                },
                {
                    name: '中证1000',
                    type: 'line',
                    data: new Array(240).fill(null),
                    lineStyle: { color: '#ffd700' },
                    itemStyle: { color: '#ffd700' },
                    connectNulls: true
                },
                {
                    name: 'A500',
                    type: 'line',
                    data: new Array(240).fill(null),
                    lineStyle: { color: '#42a5f5' },
                    itemStyle: { color: '#42a5f5' },
                    connectNulls: true
                }
            ]
        };
        this.chart.setOption(option);
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
                const responses = await Promise.all([
                    fetch('/api/index/sh'),
                    fetch('/api/index/sz'),
                    fetch('/api/index/zz'),
                    fetch('/api/index/a500')
                ]);
                
                const [shData, szData, zzData, a500Data] = await Promise.all(
                    responses.map(res => res.json())
                );

                // 更新数据
                const currentTime = new Date();
                const timeStr = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
                const timeIndex = this.chart.getOption().xAxis[0].data.indexOf(timeStr);
                
                if (timeIndex !== -1) {
                    const newData = this.chart.getOption().series.map((series, index) => {
                        const data = series.data.slice();
                        const value = [shData, szData, zzData, a500Data][index].changePercent;
                        data[timeIndex] = value;
                        return data;
                    });
                    
                    this.chart.setOption({
                        series: newData.map((data, index) => ({
                            data: data
                        }))
                    });
                }
            } catch (error) {
                console.error('获取指数数据失败:', error);
            }
        }, 30000); // 30秒更新一次
    }
};