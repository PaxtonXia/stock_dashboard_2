// fund-flow.js - 资金流向相关功能

// 全局 Chart 实例缓存，避免隐藏 canvas 上重复创建导致尺寸为 0
window.fundFlowCharts = window.fundFlowCharts || {};

// 通用字段列表
const FUND_FLOW_FIELDS = 'f12,f14,f2,f3,f62,f184,f66,f69,f72,f75,f78,f81,f84,f87,f204,f205,f124,f1,f13';

/**
 * 构造东方财富板块 API 请求参数
 * API 硬限单次返回 100 条，要同时拿到 top 流入和 top 流出必须分两次请求
 * @param {string} fs - 板块筛选条件，如 'm:90+t:2'(行业) 或 'm:90+t:3'(概念)
 * @param {string} po - 排序方向 '1'=降序(流入) '0'=升序(流出)
 * @returns {URLSearchParams}
 */
function buildBoardParams(fs, po) {
    return new URLSearchParams({
        'pn': '1',
        'pz': '100',
        'po': po,
        'np': '1',
        'fltt': '2',
        'invt': '2',
        'fid': 'f62',
        'fs': fs,
        'fields': FUND_FLOW_FIELDS
    });
}

/**
 * 将东方财富 API 响应中的 diff 数组转换为标准格式
 */
function transformBoardData(apiData) {
    if (apiData && apiData.data && apiData.data.diff) {
        return apiData.data.diff.map(item => ({
            板块名称: (item.f14 || '').trim(),
            板块代码: item.f12 || item.code,
            主力净流入_亿: item.f62 / 100000000,
            涨跌幅_百分比: item.f3,
            换手_百分比: item.f184
        }));
    } else {
        console.error('Unexpected API data structure:', apiData);
        return [];
    }
}

/**
 * 合并两批数据（top流入 + top流出），按板块代码去重，保留更极端的值
 */
function mergeBoardData(inflowData, outflowData) {
    const map = new Map();
    [inflowData, outflowData].forEach(arr => {
        arr.forEach(item => {
            const code = item.板块代码;
            if (map.has(code)) {
                // 保留绝对值更大的（流入更大的或流出更大的）
                const existing = map.get(code);
                if (Math.abs(item.主力净流入_亿) > Math.abs(existing.主力净流入_亿)) {
                    map.set(code, item);
                }
            } else {
                map.set(code, item);
            }
        });
    });
    return Array.from(map.values());
}

// 拉取数据并渲染 Chart.js 资金流向图
function loadFundFlowCharts() {
    const baseUrl = 'https://push2.eastmoney.com/api/qt/clist/get';

    // 每种板块分两次请求：po=1 取 top100 流入，po=0 取 top100 流出
    const requests = [
        // 行业板块 - 流入 + 流出
        fetch(`${baseUrl}?${buildBoardParams('m:90+t:2', '1').toString()}`)
            .catch(() => fetch('data/industry_boards.json')),
        fetch(`${baseUrl}?${buildBoardParams('m:90+t:2', '0').toString()}`)
            .catch(() => []),
        // 概念板块 - 流入 + 流出
        fetch(`${baseUrl}?${buildBoardParams('m:90+t:3', '1').toString()}`)
            .catch(() => fetch('data/concept_boards.json')),
        fetch(`${baseUrl}?${buildBoardParams('m:90+t:3', '0').toString()}`)
            .catch(() => [])
    ];

    Promise.all(requests)
    .then(function(responses) {
        return Promise.all(responses.map(function(response) {
            // 空 catch fallback 直接返回空数组
            if (!response || typeof response.json !== 'function') {
                return Promise.resolve({});
            }
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        }));
    })
    .then(function(dataArray) {
        // dataArray: [行业流入, 行业流出, 概念流入, 概念流出]
        const industryInflow = transformBoardData(dataArray[0]);
        const industryOutflow = transformBoardData(dataArray[1]);
        const conceptInflow = transformBoardData(dataArray[2]);
        const conceptOutflow = transformBoardData(dataArray[3]);

        // 合并流入和流出数据（去重）
        const industryData = mergeBoardData(industryInflow, industryOutflow);
        const conceptData = mergeBoardData(conceptInflow, conceptOutflow);

        console.log('行业板块数据:', industryData.length, '条 (流入:', industryInflow.length, '流出:', industryOutflow.length, ')');
        console.log('概念板块数据:', conceptData.length, '条 (流入:', conceptInflow.length, '流出:', conceptOutflow.length, ')');

        // Render charts
        renderScatterChart(industryData, 'industryChart');
        renderScatterChart(conceptData, 'conceptChart');

        // Update floating layers with data
        if (window.updateFloatingFundFlow) {
            window.updateFloatingFundFlow(industryData);
        }
        if (window.updateFloatingConceptFlow) {
            window.updateFloatingConceptFlow(conceptData);
        }
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

    // 销毁旧实例（用缓存引用，不依赖 ctx.chart）
    if (window.fundFlowCharts[canvasId]) {
        window.fundFlowCharts[canvasId].destroy();
        window.fundFlowCharts[canvasId] = null;
    }

    var ctx = document.getElementById(canvasId).getContext('2d');

    // 如果 canvas 所在 wrapper 当前隐藏，跳过渲染，等 tab 切换时再画
    var canvas = document.getElementById(canvasId);
    var wrapper = canvas && canvas.parentElement;
    var isHidden = (canvas && canvas.offsetParent === null) || (wrapper && wrapper.style.display === 'none');
    if (isHidden) {
        console.warn('Canvas', canvasId, 'is hidden, deferring chart render to tab switch.');
        // 保存待渲染数据，tab 切换时使用
        window.fundFlowCharts[canvasId + '_pendingData'] = data;
        return;
    }

    // Prepare chart data
    var chartData = {
        datasets: [{
            label: null,
            data: data.map(function(item) {
                return {
                    x: item.主力净流入_亿,
                    y: item.涨跌幅_百分比,
                    r: Math.max(3, Math.log1p(Math.abs(item.主力净流入_亿)) * 5), // Bubble size: log scale for better visual differentiation
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

    // Create chart and缓存实例
    // Alternating row background plugin - simulates ECharts splitArea
    var splitAreaPlugin = {
        id: 'splitArea_' + canvasId,
        beforeDraw: function(chart) {
            var yAxis = chart.scales && chart.scales.y;
            if (!yAxis) return;
            var ctx = chart.ctx;
            var chartArea = chart.chartArea;
            var ticks = yAxis.ticks;
            if (!ticks || ticks.length < 2) return;
            ctx.save();
            for (var i = 0; i < ticks.length - 1; i++) {
                var yTop = yAxis.getPixelForValue(ticks[i].value);
                var yBottom = yAxis.getPixelForValue(ticks[i + 1].value);
                ctx.fillStyle = (i % 2 === 0) ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.05)';
                ctx.fillRect(chartArea.left, Math.min(yTop, yBottom), chartArea.right - chartArea.left, Math.abs(yBottom - yTop));
            }
            ctx.restore();
        }
    };

    window.fundFlowCharts[canvasId] = new Chart(ctx, {
                type: 'bubble',
                data: chartData,
                plugins: [splitAreaPlugin],
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    events: ['click', 'mousemove'],
                    onHover: (event, chartElement) => {
                        if (event.target) {
                            event.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
                        }
                    },
                    onClick: function(evt) {
                        console.log('Chart click event triggered', evt);
                        try {
                            const elements = this.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
                            console.log('Clicked elements:', elements);
                            
                            if (elements && elements.length > 0) {
                                const firstElement = elements[0];
                                console.log('Clicked element details:', firstElement);
                                
                                const datasetIndex = firstElement._datasetIndex;
                                const index = firstElement._index;
                                console.log(`Data index: ${index}, Dataset index: ${datasetIndex}`);
                                
                                if (this.data && this.data.datasets && this.data.datasets[datasetIndex] && 
                                    this.data.datasets[datasetIndex].data && this.data.datasets[datasetIndex].data[index]) {
                                    
                                    const dataPoint = this.data.datasets[datasetIndex].data[index];
                                    console.log('Clicked data point:', dataPoint);
                                    
                                    if (data && Array.isArray(data)) {
                                        console.log('Searching in original data:', data);
                                        const blockData = data.find(item => {
                                            const match = item.板块名称 && dataPoint.name && 
                                                item.板块名称.trim() === dataPoint.name.trim();
                                            console.log(`Matching "${item.板块名称}" with "${dataPoint.name}": ${match}`);
                                            return match;
                                        });
                                        
                                        if (blockData) {
                                            console.log('Found matching block data:', blockData);
                                            if (blockData.板块代码) {
                                                const url = `bankuai.html?blockCode=${encodeURIComponent(blockData.板块代码)}`;
                                                console.log('Opening modal with URL:', url);
                                                if (typeof openStockModal === 'function') {
                                                    openStockModal(url);
                                                } else {
                                                    console.error('openStockModal is not a function');
                                                }
                                            } else {
                                                console.warn('Block code missing in:', blockData);
                                            }
                                        } else {
                                            console.warn('No matching block found for:', dataPoint.name);
                                        }
                                    } else {
                                        console.error('Original data is invalid:', data);
                                    }
                                }
                            }
                        } catch (error) {
                            console.error('Error handling chart click:', error);
                        }
                    },
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
                        color: 'rgba(150, 150, 150, 0.4)',
                        lineWidth: 1,
                        borderDash: [4, 4]
                    },
                     position: 'bottom'
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
                        color: 'rgba(150, 150, 150, 0.4)',
                        lineWidth: 1,
                        borderDash: [4, 4]
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

// Update concept floating fund flow layer
function updateFloatingConceptFlow(data) {
    // Sort by net inflow (descending)
    const sorted = [...data].sort((a, b) => b['主力净流入_亿'] - a['主力净流入_亿']);
    
    // Get top 5 inflows (positive values)
    const topInflows = sorted.filter(item => item['主力净流入_亿'] > 0).slice(0, 5);
    
    // Get top 5 outflows (negative values, sorted by most negative)
    const topOutflows = sorted.filter(item => item['主力净流入_亿'] < 0)
                            .sort((a, b) => a['主力净流入_亿'] - b['主力净流入_亿'])
                            .slice(0, 5);
    
    // Update inflows list
    const inflowsList = document.getElementById('topConceptInflowsList');
    inflowsList.innerHTML = topInflows.map(item => `
        <div class="floating-fund-flow-item">
            <span class="floating-fund-flow-name" style="cursor:pointer;" onclick="if(typeof openStockModal === 'function' && '${item['板块代码']}'){openStockModal('bankuai.html?blockCode=${item['板块代码']}')}else{console.error('无效的板块代码:', '${item['板块代码']}')}">${item['板块名称']}</span>
            <span class="floating-fund-flow-value positive">+${item['主力净流入_亿'].toFixed(2)}亿</span>
        </div>
    `).join('');
    
    // Update outflows list
    const outflowsList = document.getElementById('topConceptOutflowsList');
    outflowsList.innerHTML = topOutflows.length > 0
        ? topOutflows.map(item => `
        <div class="floating-fund-flow-item">
            <span class="floating-fund-flow-name" style="cursor:pointer;" onclick="if(typeof openStockModal === 'function' && '${item['板块代码']}'){openStockModal('bankuai.html?blockCode=${item['板块代码']}')}else{console.error('无效的板块代码:', '${item['板块代码']}')}" >${item['板块名称']}</span>
            <span class="floating-fund-flow-value negative">${item['主力净流入_亿'].toFixed(2)}亿</span>
        </div>
    `).join('')
        : '<div class="floating-fund-flow-item" style="color:#666;font-size:12px;justify-content:center;">暂无净流出板块</div>';
}

// Wait for DOM to be fully loaded before setting up event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Tab switch handlers
    const industryTabBtn = document.getElementById('industryTabBtn');
    const conceptTabBtn = document.getElementById('conceptTabBtn');
    const floatingFundFlow = document.getElementById('floatingFundFlow');
    const floatingConceptFlow = document.getElementById('floatingConceptFlow');
    const floatingFundFlowClose = document.getElementById('floatingFundFlowClose');
    const floatingConceptFlowClose = document.getElementById('floatingConceptFlowClose');

    if (industryTabBtn && conceptTabBtn && floatingFundFlow && floatingConceptFlow) {
        // Position both floating layers in the same location (right side)
        floatingConceptFlow.style.right = '10px';
        floatingConceptFlow.style.left = 'auto';
        floatingConceptFlow.style.top = '60px';

        // Make both floating layers draggable
        function makeDraggable(element) {
            let isDragging = false;
            let offsetX, offsetY;

            element.addEventListener('mousedown', function(e) {
                if (e.target === element || e.target.classList.contains('floating-fund-flow-header')) {
                    isDragging = true;
                    offsetX = e.clientX - element.getBoundingClientRect().left;
                    offsetY = e.clientY - element.getBoundingClientRect().top;
                    element.style.cursor = 'grabbing';
                }
            });

            document.addEventListener('mousemove', function(e) {
                if (!isDragging) return;
                
                const parentRect = element.parentElement.getBoundingClientRect();
                let left = e.clientX - offsetX - parentRect.left;
                let top = e.clientY - offsetY - parentRect.top;
                
                // Constrain to parent bounds
                left = Math.max(0, Math.min(left, parentRect.width - element.offsetWidth));
                top = Math.max(0, Math.min(top, parentRect.height - element.offsetHeight));
                
                element.style.left = left + 'px';
                element.style.right = 'auto';
                element.style.top = top + 'px';
            });

            document.addEventListener('mouseup', function() {
                isDragging = false;
                element.style.cursor = 'grab';
            });
        }

        makeDraggable(floatingFundFlow);
        makeDraggable(floatingConceptFlow);

        // Initialize cursor style
        floatingFundFlow.style.cursor = 'grab';
        floatingConceptFlow.style.cursor = 'grab';

        industryTabBtn.addEventListener('click', function() {
            floatingFundFlow.style.display = 'block';
            floatingConceptFlow.style.display = 'none';
            // 行业图从 hidden 变 visible，处理延迟渲染或 resize
            if (window.fundFlowCharts['industryChart']) {
                window.fundFlowCharts['industryChart'].resize();
            } else if (window.fundFlowCharts['industryChart_pendingData']) {
                renderScatterChart(window.fundFlowCharts['industryChart_pendingData'], 'industryChart');
                delete window.fundFlowCharts['industryChart_pendingData'];
            }
        });

        conceptTabBtn.addEventListener('click', function() {
            floatingFundFlow.style.display = 'none';
            floatingConceptFlow.style.display = 'block';
            // 概念图从 hidden 变 visible，处理延迟渲染或 resize
            if (window.fundFlowCharts['conceptChart']) {
                window.fundFlowCharts['conceptChart'].resize();
            } else if (window.fundFlowCharts['conceptChart_pendingData']) {
                renderScatterChart(window.fundFlowCharts['conceptChart_pendingData'], 'conceptChart');
                delete window.fundFlowCharts['conceptChart_pendingData'];
            }
        });
    }

    if (floatingFundFlowClose) {
        floatingFundFlowClose.addEventListener('click', function() {
            floatingFundFlow.style.display = 'none';
        });
    }

    if (floatingConceptFlowClose) {
        floatingConceptFlowClose.addEventListener('click', function() {
            floatingConceptFlow.style.display = 'none';
        });
    }

    // Initialize visibility
    if (floatingConceptFlow) {
        floatingConceptFlow.style.display = 'none';
    }

    // Initial data load
    loadFundFlowCharts();

    // Refresh data every minute (60000 milliseconds)
    setInterval(loadFundFlowCharts, 60000);
});
