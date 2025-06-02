// fund-flow.js - 资金流向相关功能

// 拉取数据并渲染 Chart.js 资金流向图
function loadFundFlowCharts() {
    // 优先从API获取数据，如果失败则使用本地JSON
    const baseUrl = "https://push2.eastmoney.com/api/qt/clist/get";

    // 行业板块参数
    const industryParams = new URLSearchParams({
        "pn": "1",
        "pz": "99999",
        "po": "1",
        "np": "1",
        "fltt": "2",
        "invt": "2",
        "fid": "f62",
        "fs": "m:90+t:2",  // 行业板块
        "fields": "f12,f14,f2,f3,f62,f184,f66,f69,f72,f75,f78,f81,f84,f87,f204,f205,f124,f1,f13"
    });

    // 概念板块参数
    const conceptParams = new URLSearchParams({
        "pn": "1",
        "pz": "99999",
        "po": "1",
        "np": "1",
        "fltt": "2",
        "invt": "2",
        "fid": "f62",
        "fs": "m:90+t:3",  // 概念板块
        "fields": "f12,f14,f2,f3,f62,f184,f66,f69,f72,f75,f78,f81,f84,f87,f204,f205,f124,f1,f13"
    });

    Promise.all([
        fetch(`${baseUrl}?${industryParams.toString()}`)
            .catch(error => {
                console.warn('API不可用或发生错误，尝试使用本地行业板块数据', error);
                return fetch('data/industry_boards.json');
            }),
        fetch(`${baseUrl}?${conceptParams.toString()}`)
            .catch(error => {
                console.warn('API不可用或发生错误，尝试使用本地概念板块数据', error);
                return fetch('data/concept_boards.json');
            })
    ])
    .then(function(responses) {
        return Promise.all(responses.map(function(response) {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        }));
    })
    .then(function(dataArray) {
        // Transform data from Eastmoney API format to expected format
        const transformedDataArray = dataArray.map(apiData => {
            // Assuming apiData has a structure like { data: { diff: [...] } }
            if (apiData && apiData.data && apiData.data.diff) {
                return apiData.data.diff.map(item => ({
                    // *** 推测性映射，可能需要根据实际API返回结构调整 ***
                    板块名称: item.f14, // 板块名称
                    主力净流入_亿: item.f62 / 100000000, // 主力净流入 (单位从元转换为亿)
                    涨跌幅_百分比: item.f3, // 涨跌幅
                    换手_百分比: item.f184 // 换手率
                    // 其他字段根据需要添加和映射
                }));
            } else {
                console.error('Unexpected API data structure:', apiData);
                return []; // Return empty array if data structure is unexpected
            }
        });

        // Render charts
        // dataArray[0] is industry data, dataArray[1] is concept data
        renderScatterChart(transformedDataArray[0], 'industryChart');
        renderScatterChart(transformedDataArray[1], 'conceptChart');
    })
    .catch(function(error) {
        console.error('Error loading fund flow data:', error);
    });
}

function renderScatterChart(data, canvasId) {
    // Check if data is valid
    if (!data || data.length === 0) {
        console.error('No valid data for chart:', canvasId);
        return;
    }

    var ctx = document.getElementById(canvasId).getContext('2d');

    // Prepare chart data
    var chartData = {
        datasets: [{
            label: null,
            data: data.map(function(item) {
                return {
                    x: item.主力净流入_亿,
                    y: item.涨跌幅_百分比,
                    r: Math.sqrt(Math.abs(item.主力净流入_亿)) * 4, // Bubble size based on absolute fund flow
                    name: item.板块名称,
                    volume: item.换手_百分比  // Turnover rate
                };
            }),
             backgroundColor: data.map(function(item) {
                 return item.涨跌幅_百分比 >= 0 ?
                     'rgba(255, 76, 76, 0.7)' : // Red for rise (Adjusted for dark theme)
                     'rgba(30, 203, 123, 0.7)'; // Green for fall (Adjusted for dark theme)
             }),
             borderColor: data.map(function(item) {
                 return item.涨跌幅_百分比 >= 0 ?
                     'rgba(255, 76, 76, 1)' : // Darker red border
                     'rgba(30, 203, 123, 1)'; // Darker green border
             }),
            borderWidth: 1,
            hoverBackgroundColor: undefined,
            hoverBorderColor: undefined,
            hoverBorderWidth: 0
        }]
    };

    // Ensure Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded correctly');
        return;
    }

    // Destroy existing chart instance if it exists
    if (ctx.chart) {
        ctx.chart.destroy();
    }

    // Create chart
    new Chart(ctx, {
        type: 'bubble',
        data: chartData,
        plugins: [], // Plugins are added in options.plugins now
        options: {
            responsive: true,
            maintainAspectRatio: false,
            events: ['click', 'mousemove'],
            plugins: {
                 zoom: {
                     pan: {
                         enabled: true,
                         mode: 'xy',
                         modifierKey: 'ctrl'
                     },
                     zoom: {
                         wheel: {
                             enabled: true
                         },
                         pinch: {
                             enabled: true
                         },
                         mode: 'xy',
                         drag: {
                             enabled: true,
                             modifierKey: 'ctrl'
                         }
                     }
                 },
                // tooltips handled by callbacks below
                legend: {
                    display: false
                },
                datalabels: {
                    display: function(context) {
                        // Only show labels for larger bubbles
                        return context.dataset.data[context.dataIndex].r > 10;
                    },
                    formatter: function(value, context) {
                        return context.dataset.data[context.dataIndex].name;
                    },
                    color: '#e0e0e0', // Label color for dark theme
                    font: {
                        weight: 'bold',
                        size: 10
                    },
                    align: 'center',
                    anchor: 'center',
                    offset: 0,
                    padding: 4,
                    backgroundColor: 'rgba(0,0,0,0.6)', // Background for dark theme
                    borderRadius: 4
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '主力净流入 (亿)',
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        color: '#b0b0b0' // Title color for dark theme
                    },
                    ticks: {
                        callback: function(value) {
                            return value;
                        },
                        color: '#b0b0b0' // Tick color for dark theme
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)' // Grid line color for dark theme
                    },
                     position: 'bottom' // Ensure x-axis is at the bottom
                },
                y: {
                    title: {
                        display: true,
                        text: '涨跌幅 (%)',
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        color: '#b0b0b0' // Title color for dark theme
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        },
                        color: '#b0b0b0', // Tick color for dark theme
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)' // Grid line color for dark theme
                    }
                }
            },
            // Custom tooltip
                tooltips: {
                enabled: true,
                mode: 'nearest',
                intersect: true,
                backgroundColor: 'rgba(40,40,40,0.85)', /* Darker tooltip background */
                titleFontSize: 12,
                titleFontStyle: 'bold',
                bodyFontSize: 11,
                padding: 8,
                cornerRadius: 4,
                caretSize: 6,
                titleFontColor: '#fff',
                bodyFontColor: '#fff',
                footerFontColor: '#fff',
                displayColors: false,
                callbacks: {
                    title: function(tooltipItem, data) {
                        var dataPoint = data.datasets[tooltipItem[0].datasetIndex].data[tooltipItem[0].index];
                        return dataPoint.name;
                    },
                    label: function(tooltipItem, data) {
                        var dataPoint = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];

                        // Calculate metrics (simplified)
                        var strengthIndex = (dataPoint.y + (dataPoint.x / 10)).toFixed(1);
                        var activityIndex = (dataPoint.volume + (Math.abs(dataPoint.x) / 5)).toFixed(1);
                        var efficiencyIndex = Math.abs(dataPoint.x) > 0.1 ? (dataPoint.y / Math.abs(dataPoint.x)).toFixed(2) : 'N/A';
                        var rsiValue = dataPoint.volume > 0 ? (dataPoint.y / dataPoint.volume).toFixed(2) : 'N/A';

                        return [
                            '涨跌幅: ' + dataPoint.y.toFixed(2) + '%',
                            '主力净流入: ' + dataPoint.x.toFixed(2) + '亿',
                            '换手率: ' + dataPoint.volume.toFixed(2) + '%',
                            '强度: ' + strengthIndex,
                            '活跃度: ' + activityIndex,
                            '效率: ' + efficiencyIndex,
                            '相对强弱: ' + rsiValue
                        ];
                    }
                }
            },
            hover: {
                mode: 'nearest',
                intersect: true
            }
        }
    });
}

// Initial data load
loadFundFlowCharts();

// Refresh data every minute (60000 milliseconds)
setInterval(loadFundFlowCharts, 60000); 