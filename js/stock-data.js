// stock-data.js - 股票数据相关功能

// ==================== 主力净流入股票 ====================
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
                    '股票代码': item.f12,
                    '股票名称': item.f14,
                    '最新价': item.f2,
                    '涨跌幅(%)': item.f3,
                    '主力净流入(元)': item.f62,
                    '净流速(元)': item.f605
                }));
                window.inflowStocksData = transformedData;
                renderInflowStocks(transformedData);
            } else {
                console.error('主力净流入数据格式错误:', response);
                $('#inflowStocksBody').html('<tr><td colspan="4" style="text-align:center;padding:20px;color:#ef4444;">数据格式错误</td></tr>');
            }
        },
        error: function(xhr, status, error) {
            console.error('获取主力净流入数据失败:', error);
            $('#inflowStocksBody').html('<tr><td colspan="4" style="text-align:center;padding:20px;color:#ef4444;">获取数据失败</td></tr>');
            
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
                valueA = parseFloat(a['主力净流入(元)']);
                valueB = parseFloat(b['主力净流入(元)']);
            } else if (sortKey === 'inflowSpeed') {
                valueA = parseFloat(a['净流速(元)']);
                valueB = parseFloat(b['净流速(元)']);
            }
            return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
        });
    }
    
    const limitedData = data.slice(0, 30);
    let html = '';
    limitedData.forEach(function(stock) {
        const changePercent = parseFloat(stock['涨跌幅(%)']);
        const changeColor = changePercent >= 0 ? '#ef4444' : '#34d058';
        const changeSign = changePercent >= 0 ? '+' : '';
        
        const inflow = (parseFloat(stock['主力净流入(元)']) / 10000).toFixed(2);
        const inflowSpeed = (parseFloat(stock['净流速(元)']) / 10000).toFixed(2);
        const inflowSpeedColor = parseFloat(stock['净流速(元)']) >= 0 ? '#ef4444' : '#34d058';
        const stockCode = stock['股票代码'].toString();
        
        html += `<tr style="border-bottom:1px solid #333;">
            <td style="padding:8px;text-align:left;font-size:12px;">
                <a href="javascript:openStockModal('redball.html##${stockCode}##')" style="color:${changeColor};text-decoration:none;">
                    ${stock['股票名称']}
                </a>
                <div style="color:#888;font-size:10px;">${stockCode}</div>
            </td>
            <td style="padding:8px;text-align:right;font-size:12px;line-height:1.4;">
                <div>${stock['最新价']}</div>
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

// ==================== 冲刺涨停股票 ====================
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
                $('#limitUpStocksBody').html('<tr><td colspan="4" style="text-align:center;padding:20px;color:#ef4444;">数据格式错误</td></tr>');
            }
        },
        error: function() {
            $('#limitUpStocksBody').html('<tr><td colspan="4" style="text-align:center;padding:20px;color:#ef4444;">获取数据失败</td></tr>');
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
            status = '炸板';
            statusColor = '#f59f00';
        } else if (changePercent >= 9.9) {
            status = '涨停';
            statusColor = '#ef4444';
        } else {
            status = '冲刺';
            statusColor = '#3b82f6';
        }
        
        const momentumColor = momentum > 15 ? '#ef4444' : momentum > 10 ? '#f59f00' : momentum > 5 ? '#eab308' : '#34d058';
        
        html += `<tr style="border-bottom:1px solid #333;">
            <td style="padding:8px;text-align:left;font-size:12px;">
                <a href="javascript:openStockModal('redball.html##${stockCode}##')" style="color:#fff;text-decoration:none;">
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

// ==================== 自选股功能 ====================
const STOCK_POOL_KEY = 'stock_pool';

function getFavoriteStocks() {
    const poolStr = localStorage.getItem(STOCK_POOL_KEY);
    if (poolStr) {
        try { return JSON.parse(poolStr); }
        catch (e) { console.error('解析自选股数据失败:', e); }
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
                    <span>${stock.date || '日期未知'}</span>
                </div>
                <div class="fav-stock-remove" onclick="removeFromFavorites('${stock.code}', event)" title="移除自选">×</div>
            </div>`).join('')
        : '<div style="padding:10px;color:var(--c-text-muted);text-align:center;">暂无自选股</div>';
}

function removeFromFavorites(stockCode, event) {
    try {
        const stocks = getFavoriteStocks();
        saveFavoriteStocks(stocks.filter(s => s.code !== stockCode));
        renderFavoriteStocks();
        if (event) { event.stopPropagation(); event.preventDefault(); }
    } catch (e) { console.error('移除自选股失败:', e); }
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
