// news-plates.js - 新闻和板块异动相关功能

// 高频异动类型映射
const typeMap = {
    '10001': '封涨停板',
    '10005': '逼近涨停',
    '10003': '打开涨停',
    '10007': '即将打开涨停',
    '10009': '大幅拉升'
};

// 板块异动类型映射
const typeMapPlates = {
    '11000': '板块拉升',
    '11001': '板块走强'
};

// 热点股票数据
let hotspotStocksData = {};

// 高频异动相关函数
function renderNews(newsData) {
    var container = document.getElementById('newsContainer');
    $('#loading').hide();
    
    if (!newsData || newsData.length === 0) {
        container.innerHTML = '<div style="color: yellow;">暂无数据</div>';
        return;
    }

    // 过滤掉包含ST的股票
    var filteredData = [];
    for (var i = 0; i < newsData.length; i++) {
        var item = newsData[i];
        var stockData = item.stock_abnormal_event_data;
        if (stockData && stockData.name.indexOf('ST') === -1) {
            filteredData.push(item);
        }
    }

    var newsHtml = '';
    for (var j = 0; j < filteredData.length; j++) {
        var item = filteredData[j];
        var content = '';
        var stockData = item.stock_abnormal_event_data;
        
        if (stockData) {
            var changePercent = (stockData.pcp * 100).toFixed(2);
            var color = stockData.pcp > 0 ? '#ff3333' : '#00ff00';
            // 判断市场类型：以6开头的是上海，其他是深圳
            var marketPrefix = stockData.symbol.indexOf('6') === 0 ? '1' : '0';
            var stockCode = stockData.symbol.split('.')[0]; // 去掉 .ss 或 .sz 后缀
            var fullStockCode = marketPrefix + stockCode;
            content = '<span style="color: ' + color + '">' +
                '<a href="javascript:openStockModal(\'redball.html##' + stockCode + '##\')" style="color: inherit; text-decoration: underline;">' +
                    stockCode + '</a> ' +
                '<a href="javascript:openStockModal(\'redball.html##' + stockCode + '##\')" style="color: inherit; text-decoration: underline;">' +
                    stockData.name + '</a> ' +
                changePercent + '% ￥' + stockData.price +
                '</span>';
            
            if (stockData.related_plates && stockData.related_plates.length > 0) {
                var plates = [];
                for (var k = 0; k < Math.min(stockData.related_plates.length, 3); k++) {
                    var plate = stockData.related_plates[k];
                    var plateChange = (plate.plate_pcp * 100).toFixed(2);
                    var plateColor = plate.plate_pcp > 0 ? '#ff3333' : '#00ff00';
                    plates.push('<span style="color: ' + plateColor + '">' + plate.plate_name + '(' + plateChange + '%)</span>');
                }
                content += '<div class="related-plates">' + plates.join(' ') + '</div>';
            }
        }
        
        newsHtml += '<div class="news-item">' +
            '<span class="news-type type-' + item.event_type + '">' + (typeMap[item.event_type] || '其他') + '</span>' +
            '<div class="news-time">' + formatTime(item.event_timestamp) + '</div>' +
            '<div class="news-content">' + content + '</div>' +
        '</div>';
    }

    container.innerHTML = newsHtml;
}

function fetchNews() {
    $('#loading').show();
    $('#error').hide();
    
    $.ajax({
        url: 'https://flash-api.xuangubao.com.cn/api/event/history',
        type: 'GET',
        data: {
            count: 50,
            types: '10001,10005,10003,10007,10009'
        },
        dataType: 'json',
        success: function(response) {
            $('#loading').hide();
            console.log('Raw Response:', response);
            
            try {
                if (response && response.code === 20000 && Array.isArray(response.data)) {
                    renderNews(response.data);
                } else {
                    throw new Error('无效的数据格式');
                }
            } catch (e) {
                console.error('数据解析错误:', e);
                $('#error').text('数据解析错误：' + e.message).show();
            }
        },
        error: function(xhr, status, error) {
            $('#loading').hide();
            console.error('Network Error:', {
                status: status,
                error: error,
                response: xhr.responseText
            });
            $('#error').text('网络请求失败: ' + error).show();
        }
    });
}

// 板块异动相关函数
function formatTimePlates(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit'
    });
}

function renderPlates(plateData) {
    const container = document.getElementById('plateContainer');
    $('#loading').hide();
    
    if (!plateData || plateData.length === 0) {
        container.innerHTML = '<div style="color: yellow;">暂无数据</div>';
        return;
    }

    const plateHtml = plateData.map(item => {
        const plateInfo = item.plate_abnormal_event_data;
        if (!plateInfo) return '';

        // Get plate percentage change from pcp field
        const changePercent = plateInfo.pcp ? (plateInfo.pcp * 100) : 0;
        const formattedChangePercent = changePercent.toFixed(2);
        const color = changePercent > 0 ? '#ff3333' : '#00ff00';

        let stockListHtml = '';
        if (plateInfo.related_stocks && plateInfo.related_stocks.length > 0) {
            const stockItems = plateInfo.related_stocks.map(stock => {
                // Get stock percentage change and mtm
                const stockChangePercent = stock.pcp ? (stock.pcp * 100) : 0;
                const stockMtm = stock.mtm ? (stock.mtm * 100) : 0;
                const formattedStockChangePercent = stockChangePercent.toFixed(2);
                const formattedStockMtm = stockMtm.toFixed(2);
                const stockColor = stockChangePercent > 0 ? '#ff3333' : '#00ff00';
                
                // Extract stock code and determine market type
                const stockCode = stock.symbol.split('.')[0]; // 去掉 .ss 或 .sz 后缀
                const marketPrefix = stockCode.startsWith('6') ? '1' : '0';
                const fullStockCode = marketPrefix + stockCode;
                
                return `<span class="stock-item" style="color: ${stockColor}">
                    <a href="javascript:openStockModal('redball.html##${stockCode}##')" style="color: inherit; text-decoration: none;">
                        ${stock.name}<span style="color: #888;">(${stockCode})</span>
                    </a>
                    <span class="stock-change">${formattedStockChangePercent}%</span>
                    <span class="stock-mtm">涨速:${formattedStockMtm}%</span>
                </span>`;
            }).join('');
            stockListHtml = `<div class="stock-list"><span class="stock-title">领涨个股：</span>${stockItems}</div>`;
        }

        return `
            <div class="plate-item">
                <span class="plate-type type-${item.event_type}">${typeMapPlates[item.event_type] || '其他'}</span>
                <div class="plate-time">${formatTimePlates(item.event_timestamp)}</div>
                <div class="plate-content">
                    <span style="color: ${color}">${plateInfo.plate_name} ${formattedChangePercent}%</span>
                    ${stockListHtml}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = plateHtml;
}

function fetchPlates() {
    $('#loading').show();
    $('#error').hide();
    
    $.ajax({
        url: 'https://flash-api.xuangubao.com.cn/api/event/history',
        type: 'GET',
        data: {
            count: 30,
            types: '11000,11001'
        },
        dataType: 'json',
        success: function(response) {
            $('#loading').hide();
            console.log('Raw Response:', response);
            
            try {
                if (response && response.code === 20000 && Array.isArray(response.data)) {
                    renderPlates(response.data);
                } else {
                    throw new Error('无效的数据格式');
                }
            } catch (e) {
                console.error('数据解析错误:', e);
                $('#error').text('数据解析错误：' + e.message).show();
            }
        },
        error: function(xhr, status, error) {
            $('#loading').hide();
            console.error('Network Error:', {
                status: status,
                error: error,
                response: xhr.responseText
            });
            $('#error').text('网络请求失败: ' + error).show();
        }
    });
}

// 热点解读相关函数
function formatTimeHotspot(timestamp) {
    var date = new Date(timestamp * 1000);
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    return (hours < 10 ? '0' + hours : hours) + ':' + 
           (minutes < 10 ? '0' + minutes : minutes) + ':' + 
           (seconds < 10 ? '0' + seconds : seconds);
}

function fetchHotspotStocks() {
    return $.ajax({
        url: 'https://flash-api.xuangubao.com.cn/api/surge_stock/stocks?normal=true&uplimit=true',
        type: 'GET',
        dataType: 'json'
    });
}

function processHotspotStocksData(response) {
    if (response && response.code === 20000 && response.data && response.data.items) {
        hotspotStocksData = {};
        response.data.items.forEach(function(stock) {
            if (stock[8]) { // plates array
                stock[8].forEach(function(plate) {
                    if (!hotspotStocksData[plate.id]) {
                        hotspotStocksData[plate.id] = [];
                    }
                    hotspotStocksData[plate.id].push(stock);
                });
            }
        });
    }
}

function renderHotspotPlates(plateData) {
    var container = document.getElementById('hotspotContainer'); // Updated container ID
    $('#loading-hotspot').hide(); // Updated loading ID
    $('#error-hotspot').hide(); // Updated error ID
    
    if (!plateData || !plateData.items || plateData.items.length === 0) {
        container.innerHTML = '<div style="color: yellow; padding: 20px; text-align: center;">暂无数据</div>';
        return;
    }

    var plateHtml = '';
    plateData.items.forEach(function(plate) {
        var stockHtml = '';
        // Check if there are associated stocks for this plate
        if (hotspotStocksData[plate.id]) {
            hotspotStocksData[plate.id].forEach(function(stock) {
                var changePercent = (stock[3] * 100).toFixed(2);
                var turnover = (stock[10] * 100).toFixed(2);
                var marketValue = (stock[4] / 100000000).toFixed(2);
                var changeClass = stock[3] > 0 ? 'positive-hotspot' : 'negative-hotspot';
                var stockCode = stock[0].split('.')[0]; // 去掉 .ss 或 .sz 后缀
                
                stockHtml += '<div class="stock-item-hotspot">' +
                    '<div style="display: flex; align-items: center; margin-bottom: 5px;">' +
                        '<a href="javascript:openStockModal(\'redball.html##' + stockCode + '##\')" class="stock-name-hotspot" style="color: inherit; text-decoration: none;">' + stock[1] + '</a>' +
                        '<a href="javascript:openStockModal(\'redball.html##' + stockCode + '##\')" class="stock-code-hotspot" style="margin-left: 8px; color: inherit; text-decoration: none;">' + stockCode + '</a>' +
                        '<div style="flex-grow: 1; text-align: right;">' +
                            '<span class="stock-price-hotspot" style="margin-right: 15px;">' + stock[2] + '</span>' +
                            '<span class="stock-info-item-hotspot" style="color: ' + (stock[3] > 0 ? '#ff3333' : '#00ff00') + '; font-weight: bold;">' +  
                                (stock[3] > 0 ? '+' : '') + changePercent + '%</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="stock-info-line-hotspot">' +
                        '<span class="stock-info-item-hotspot">换手: ' + turnover + '%</span>' +
                        '<span class="divider-hotspot"> | </span>' +
                        '<span class="stock-info-item-hotspot">市值: ' + marketValue + '亿</span>' +
                    '</div>';
                
                if (stock[5]) {
                    stockHtml += '<div class="stock-desc-hotspot">' + stock[5] + '</div>';
                }
                
                stockHtml += '</div>';
            });
        }

        // Further simplified HTML structure for plate item
        plateHtml += '<div class="plate-item-hotspot">' +
            '<span class="plate-name-hotspot">' + plate.name + '</span>' +
            '<div class="plate-desc-hotspot">' + (plate.description || '暂无描述') + '</div>' +
            (stockHtml ? '<div class="stock-list-hotspot">' + stockHtml + '</div>' : '') +
        '</div>';
    });

    container.innerHTML = plateHtml;
}

function fetchHotspotData() {
     $('#loading-hotspot').show(); // Updated loading ID
    $('#error-hotspot').hide(); // Updated error ID
    
    // Fetch plates data from the working endpoint
    $.ajax({
        url: 'https://flash-api.xuangubao.com.cn/api/surge_stock/plates', // Using the working plate endpoint
        type: 'GET',
        dataType: 'json',
        success: function(plateResponse) {
             $('#loading-hotspot').hide(); // Updated loading ID
             if (plateResponse && plateResponse.code === 20000 && plateResponse.data && plateResponse.data.items) {
                 // Fetch stocks data after getting plates
                 fetchHotspotStocks().done(function(stockResponse) {
                     processHotspotStocksData(stockResponse);
                     renderHotspotPlates(plateResponse.data); // Pass plate data to render function
                 }).fail(function(xhr, status, error) {
                     console.error('Hotspot Stocks Network Error:', { status: status, error: error, response: xhr.responseText });
                     $('#error-hotspot').text('热点个股加载失败: ' + error).show(); // Updated error ID
                 });
             } else {
                 throw new Error('无效的板块数据格式');
             }
         },
        error: function(xhr, status, error) {
            $('#loading-hotspot').hide(); // Updated loading ID
            // Added detailed error logging
            console.error('Hotspot Plates Network Error Details:', {
                status: status,
                error: error,
                response: xhr.responseText,
                xhr: xhr // Include full XHR object for inspection
            });
            console.error('Hotspot Plates Network Error:', { status: status, error: error, response: xhr.responseText });
            $('#error-hotspot').text('热点板块加载失败: ' + error).show(); // Updated error ID
        }
    });
}
