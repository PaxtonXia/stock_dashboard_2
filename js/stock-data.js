// stock-data.js - 鑲＄エ鏁版嵁鐩稿叧鍔熻兘

// ==================== 涓诲姏鍑€娴佸叆鑲＄エ ====================
function fetchInflowStocks() {
    const baseUrl = "https://push2.eastmoney.com/api/qt/clist/get";
    const params = new URLSearchParams({
        'fid': 'f62',
        'po': '1',
        'pz': '30',
        'pn': '1',
        'np': '1',
        'fltt': '2',
        'invt': '2',
        'ut': 'b2884a393a59ad64002292a3e90d46a5',
        'fs': 'm:0+t:6+f:!2,m:0+t:13+f:!2,m:0+t:80+f:!2,m:1+t:2+f:!2',
        'fields': 'f12,f14,f2,f3,f62,f605',
    });

    const filters = 'f20>0,f62!=0,f105>0';
    const apiUrl = `${baseUrl}?${params.toString()}&filters=${encodeURIComponent(filters)}`;

    $.ajax({
        url: apiUrl,
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response && response.data && Array.isArray(response.data.diff)) {
                const transformedData = response.data.diff.map(item => ({
                    '鑲＄エ浠ｇ爜': item.f12,
                    '鑲＄エ鍚嶇О': item.f14,
                    '鏈€鏂颁环': item.f2,
                    '娑ㄨ穼骞?%)': item.f3,
                    '涓诲姏鍑€娴佸叆(鍏?': item.f62,
                    '鍑€娴侀€?鍏?': item.f605
                }));
                window.inflowStocksData = transformedData;
                renderInflowStocks(transformedData);
            } else {
                console.error('涓诲姏鍑€娴佸叆鏁版嵁鏍煎紡閿欒:', response);
                $('#inflowStocksBody').html('<tr><td colspan="4" style="text-align:center;padding:20px;color:#ef4444;">鏁版嵁鏍煎紡閿欒</td></tr>');
            }
        },
        error: function(xhr, status, error) {
            console.error('鑾峰彇涓诲姏鍑€娴佸叆鏁版嵁澶辫触:', error);
            $('#inflowStocksBody').html('<tr><td colspan="4" style="text-align:center;padding:20px;color:#ef4444;">鑾峰彇鏁版嵁澶辫触</td></tr>');
            
            $.getJSON('data/inflow_stocks.json')
                .done(function(localData) {
                    if (localData && localData.code === 200 && Array.isArray(localData.data)) {
                        window.inflowStocksData = localData.data;
                        renderInflowStocks(localData.data);
                    }
                });
        }
    });
}

function renderInflowStocks(data, sortKey = null, sortDirection = 'desc') {
    if (sortKey) {
        data = [...data];
        data.sort((a, b) => {
            let valueA, valueB;
            if (sortKey === 'inflow') {
                valueA = parseFloat(a['涓诲姏鍑€娴佸叆(鍏?']);
                valueB = parseFloat(b['涓诲姏鍑€娴佸叆(鍏?']);
            } else if (sortKey === 'inflowSpeed') {
                valueA = parseFloat(a['鍑€娴侀€?鍏?']);
                valueB = parseFloat(b['鍑€娴侀€?鍏?']);
            }
            return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
        });
    }
    
    const limitedData = data.slice(0, 30);
    let html = '';
    limitedData.forEach(function(stock) {
        const changePercent = parseFloat(stock['娑ㄨ穼骞?%)']);
        const changeColor = changePercent >= 0 ? '#ef4444' : '#34d058';
        const changeSign = changePercent >= 0 ? '+' : '';
        
        const inflow = (parseFloat(stock['涓诲姏鍑€娴佸叆(鍏?']) / 10000).toFixed(2);
        const inflowSpeed = (parseFloat(stock['鍑€娴侀€?鍏?']) / 10000).toFixed(2);
        const inflowSpeedColor = parseFloat(stock['鍑€娴侀€?鍏?']) >= 0 ? '#ef4444' : '#34d058';
        const stockCode = stock['鑲＄エ浠ｇ爜'].toString();
        
        html += `<tr style="border-bottom:1px solid #333;">
            <td style="padding:8px;text-align:left;font-size:12px;">
                <a href="javascript:openStockModal('smart_money.html##${stockCode}##')" style="color:${changeColor};text-decoration:none;">
                    ${stock['鑲＄エ鍚嶇О']}
                </a>
                <div style="color:#888;font-size:10px;">${stockCode}</div>
            </td>
            <td style="padding:8px;text-align:right;font-size:12px;line-height:1.4;">
                <div>${stock['鏈€鏂颁环']}</div>
                <div style="color:${changeColor};font-size:11px;">${changeSign}${changePercent.toFixed(2)}%</div>
            </td>
            <td style="padding:8px;text-align:right;font-size:12px;">${inflow}</td>
            <td style="padding:8px;text-align:right;font-size:12px;color:${inflowSpeedColor};">${inflowSpeed}</td>
        </tr>`;
    });
    
    $('#inflowStocksBody').html(html);
    
    if (sortKey) {
        $('.sortable i').attr('class', 'fas fa-sort');
        $(`.sortable[data-sort="${sortKey}"] i`).attr('class', sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down');
    }
}

// ==================== 鍐插埡娑ㄥ仠鑲＄エ ====================
function fetchLimitUpStocks() {
    $.ajax({
        url: 'https://data.10jqka.com.cn/dataapi/limit_up/limit_up?page=1&limit=15&field=199112,10,48,1968584,19,3475914,9003,9004&filter=HS,GEM2STAR&order_field=199112&order_type=0&date=',
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response && response.status_code === 0 && response.data && response.data.info) {
                renderLimitUpStocks(response.data.info);
                updateLimitUpStats(response.data.limit_up_count);
            } else {
                $('#limitUpStocksBody').html('<tr><td colspan="4" style="text-align:center;padding:20px;color:#ef4444;">鏁版嵁鏍煎紡閿欒</td></tr>');
            }
        },
        error: function() {
            $('#limitUpStocksBody').html('<tr><td colspan="4" style="text-align:center;padding:20px;color:#ef4444;">鑾峰彇鏁版嵁澶辫触</td></tr>');
            $.getJSON('data/limit_up_stocks.json')
                .done(function(localData) {
                    if (localData && localData.status_code === 0 && localData.data && localData.data.info) {
                        renderLimitUpStocks(localData.data.info);
                        updateLimitUpStats(localData.data.limit_up_count);
                    }
                });
        }
    });
}

function renderLimitUpStocks(data) {
    const limitedData = data.slice(0, 15);
    let html = '';
    limitedData.forEach(function(stock) {
        const changePercent = parseFloat(stock.change_rate);
        const stockCode = stock.code;
        const timePreview = stock.time_preview || [];
        const lastValues = timePreview.slice(-5);
        const momentum = lastValues.length > 0 ? lastValues.reduce((sum, val) => sum + val, 0) / lastValues.length : 0;
        
        let status = '';
        let statusColor = '';
        if (stock.change_tag === 'LIMIT_FAILED') {
            status = '鐐告澘';
            statusColor = '#f59f00';
        } else if (changePercent >= 9.9) {
            status = '娑ㄥ仠';
            statusColor = '#ef4444';
        } else {
            status = '鍐插埡';
            statusColor = '#3b82f6';
        }
        
        const momentumColor = momentum > 15 ? '#ef4444' : momentum > 10 ? '#f59f00' : momentum > 5 ? '#eab308' : '#34d058';
        
        html += `<tr style="border-bottom:1px solid #333;">
            <td style="padding:8px;text-align:left;font-size:12px;">
                <a href="javascript:openStockModal('smart_money.html##${stockCode}##')" style="color:#fff;text-decoration:none;">
                    ${stock.name}
                </a>
                <div style="color:#888;font-size:10px;">${stockCode}</div>
            </td>
            <td style="padding:8px;text-align:right;font-size:12px;line-height:1.4;">
                <div>${stock.latest}</div>
                <div style="color:#ef4444;font-size:11px;">+${changePercent.toFixed(2)}%</div>
            </td>
            <td style="padding:8px;text-align:right;font-size:12px;color:${momentumColor};">
                <div style="width:100%;height:4px;background:#333;border-radius:2px;overflow:hidden;">
                    <div style="height:100%;width:${Math.min(100, momentum * 5)}%;background:${momentumColor};"></div>
                </div>
                ${momentum.toFixed(1)}
            </td>
            <td style="padding:8px;text-align:right;font-size:12px;color:${statusColor};font-weight:bold;">${status}</td>
        </tr>`;
    });
    
    $('#limitUpStocksBody').html(html);
}

function updateLimitUpStats(limitUpCount) {
    if (!limitUpCount || !limitUpCount.today) return;
    const today = limitUpCount.today;
    $('#todayLimitUp').text(today.num || '--');
    $('#limitUpRate').text(today.rate ? (today.rate * 100).toFixed(1) + '%' : '--');
    $('#openLimitUp').text(today.open_num || '--');
}

function initStockTableSorting() {
    $('.sortable').click(function() {
        const sortKey = $(this).data('sort');
        const currentIcon = $(this).find('i').attr('class');
        let sortDirection = 'desc';
        if (currentIcon.includes('fa-sort-down')) sortDirection = 'asc';
        if (window.inflowStocksData) renderInflowStocks(window.inflowStocksData, sortKey, sortDirection);
    });
}

// ==================== 鑷€夎偂鍔熻兘 ====================
const STOCK_POOL_KEY = 'stock_pool';

function getFavoriteStocks() {
    const poolStr = localStorage.getItem(STOCK_POOL_KEY);
    if (poolStr) {
        try { return JSON.parse(poolStr); }
        catch (e) { console.error('瑙ｆ瀽鑷€夎偂鏁版嵁澶辫触:', e); }
    }
    return [];
}

function saveFavoriteStocks(stocks) {
    localStorage.setItem(STOCK_POOL_KEY, JSON.stringify(stocks));
}

function renderFavoriteStocks() {
    const stocks = getFavoriteStocks();
    const stocksList = document.getElementById('favoriteStocksList');
    if (!stocksList) return;

    stocksList.innerHTML = stocks.length
        ? stocks.map(stock => `<div class="fav-stock-item">
                <div class="fav-stock-row">
                    <span class="fav-stock-name">${stock.name}</span>
                    <span class="fav-stock-change ${stock.change >= 0 ? 'text-rise' : 'text-fall'}">
                        ${stock.change !== undefined && stock.change !== 0 ? (stock.change >= 0 ? '+' : '') + stock.change + '%' : ''}
                    </span>
                </div>
                <div class="fav-stock-meta">
                    <span>${stock.code}</span>
                    <span>${stock.date || '鏃ユ湡鏈煡'}</span>
                </div>
                <div class="fav-stock-remove" onclick="removeFromFavorites('${stock.code}', event)" title="绉婚櫎鑷€?>脳</div>
            </div>`).join('')
        : '<div style="padding:10px;color:var(--c-text-muted);text-align:center;">鏆傛棤鑷€夎偂</div>';
}

function removeFromFavorites(stockCode, event) {
    try {
        const stocks = getFavoriteStocks();
        saveFavoriteStocks(stocks.filter(s => s.code !== stockCode));
        renderFavoriteStocks();
        if (event) { event.stopPropagation(); event.preventDefault(); }
    } catch (e) { console.error('绉婚櫎鑷€夎偂澶辫触:', e); }
}

document.addEventListener('DOMContentLoaded', function() {
    renderFavoriteStocks();
    const favoriteIcon = document.querySelector('.favorite-stock-icon');
    const dropdown = document.querySelector('.favorite-stocks-dropdown');
    if (favoriteIcon && dropdown) {
        favoriteIcon.addEventListener('mouseenter', function() {
            dropdown.style.display = 'block';
            renderFavoriteStocks();
        });
        favoriteIcon.addEventListener('mouseleave', function() {
            dropdown.style.display = 'none';
        });
    }
    document.getElementById('favoriteStocksList')?.addEventListener('click', function(e) {
        const target = e.target.closest('[onclick^="removeFromFavorites"]');
        if (target) {
            const match = target.getAttribute('onclick').match(/'([^']+)'/);
            if (match) removeFromFavorites(match[1], e);
        }
    });
});
