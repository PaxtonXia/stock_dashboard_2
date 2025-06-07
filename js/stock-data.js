// stock-data.js - 股票数据相关功能

// 添加主力净流入股票数据获取和渲染函数
function fetchInflowStocks() {
    const baseUrl = "https://push2.eastmoney.com/api/qt/clist/get";

    // 请求参数，参考提供的Python代码
    const params = new URLSearchParams({
        'fid': 'f62',  // 按主力净流入排序
        'po': 1,       // 排序方式，1为降序
        'pz': 30,      // 每页数量 (与renderInflowStocks中的slice(0, 30)一致)
        'pn': 1,       // 页码
        'np': 1,
        'fltt': 2,     // 数据格式
        'invt': 2,
        'ut': 'b2884a393a59ad64002292a3e90d46a5', // 可能需要根据实际情况调整或删除
        'fs': 'm:0+t:6+f:!2,m:0+t:13+f:!2,m:0+t:80+f:!2,m:1+t:2+f:!2',  // 仅主板非ST股票
        'fields': 'f12,f14,f2,f3,f62,f605',  // 股票代码,名称,最新价,涨跌幅,主力净流入,净流速
        // filters参数需要特殊处理，因为URLSearchParams对其编码可能不符合API要求
        // 'filters': 'f20>0,f62!=0,f105>0'
    });

    // 手动构建filters参数，确保格式正确
    const filters = 'f20>0,f62!=0,f105>0';
    const apiUrl = `${baseUrl}?${params.toString()}&filters=${encodeURIComponent(filters)}`;

    $.ajax({
        url: apiUrl,
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response && response.data && Array.isArray(response.data.diff)) {
                // Transform data from Eastmoney API format to expected format
                const transformedData = response.data.diff.map(item => ({
                    // *** 推测性映射，可能需要根据实际API返回结构调整 ***
                    '股票代码': item.f12,
                    '股票名称': item.f14,
                    '最新价': item.f2,
                    '涨跌幅(%)': item.f3,
                    '主力净流入(元)': item.f62, // API返回单位可能是元
                    '净流速(元)': item.f605 // API返回单位可能是元
                    // 其他字段根据需要添加和映射
                }));

                // 保存数据到全局变量，以便排序使用
                window.inflowStocksData = transformedData;
                renderInflowStocks(transformedData);
            } else {
                console.error('主力净流入数据格式错误:', response);
                $('#inflowStocksBody').html('<tr><td colspan="5" style="text-align: center; padding: 20px; color: #ff5252;">数据格式错误</td></tr>');
            }
        },
        error: function(xhr, status, error) {
            console.error('获取主力净流入数据失败:', error);
            $('#inflowStocksBody').html('<tr><td colspan="5" style="text-align: center; padding: 20px; color: #ff5252;">获取数据失败</td></tr>');
            
            // 如果API不可用，尝试使用本地数据
            $.getJSON('data/inflow_stocks.json')
                .done(function(localData) {
                    if (localData && localData.code === 200 && Array.isArray(localData.data)) {
                        console.log('使用本地主力净流入数据');
                        window.inflowStocksData = localData.data;
                        renderInflowStocks(localData.data);
                    }
                })
                .fail(function() {
                    console.error('本地主力净流入数据也不可用');
                });
        }
    });
}

function renderInflowStocks(data, sortKey = null, sortDirection = 'desc') {
    // 如果指定了排序键，则进行排序
    if (sortKey) {
        data = [...data]; // 创建数据副本，避免修改原始数据
        
        data.sort((a, b) => {
            let valueA, valueB;
            
            if (sortKey === 'inflow') {
                valueA = parseFloat(a['主力净流入(元)']);
                valueB = parseFloat(b['主力净流入(元)']);
            } else if (sortKey === 'inflowSpeed') {
                valueA = parseFloat(a['净流速(元)']);
                valueB = parseFloat(b['净流速(元)']);
            }
            
            // 根据排序方向返回比较结果
            return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
        });
    }
    
    // 限制显示前30条记录
    const limitedData = data.slice(0, 30);
    
    let html = '';
    limitedData.forEach(function(stock) {
        // 格式化数据
        const changePercent = parseFloat(stock['涨跌幅(%)']);
        const changeColor = changePercent >= 0 ? '#ff5252' : '#22e090';
        const changeSign = changePercent >= 0 ? '+' : '';
        
        // 将元转换为万元
        const inflow = (parseFloat(stock['主力净流入(元)']) / 10000).toFixed(2);
        const inflowSpeed = (parseFloat(stock['净流速(元)']) / 10000).toFixed(2);
        const inflowSpeedColor = parseFloat(stock['净流速(元)']) >= 0 ? '#ff5252' : '#22e090';
        
        // 获取股票代码
        const stockCode = stock['股票代码'].toString();
        
        html += `
            <tr style="border-bottom: 1px solid #333;">
                <td style="padding: 8px; text-align: left; font-size: 12px;">
                    <a href="javascript:openStockModal('redball.html##${stockCode}##')" style="color: #fff; text-decoration: none;">
                        ${stock['股票名称']}
                    </a>
                    <span style="color: #888; font-size: 10px;">${stockCode}</span>
                </td>
                <td style="padding: 8px; text-align: right; font-size: 12px;">${stock['最新价']}</td>
                <td style="padding: 8px; text-align: right; font-size: 12px; color: ${changeColor};">${changeSign}${changePercent.toFixed(2)}%</td>
                <td style="padding: 8px; text-align: right; font-size: 12px;">${inflow}</td>
                <td style="padding: 8px; text-align: right; font-size: 12px; color: ${inflowSpeedColor};">${inflowSpeed}</td>
            </tr>
        `;
    });
    
    $('#inflowStocksBody').html(html);
    
    // 更新排序图标
    if (sortKey) {
        // 先重置所有排序图标
        $('.sortable i').attr('class', 'fas fa-sort');
        
        // 设置当前排序列的图标
        $(`.sortable[data-sort="${sortKey}"] i`).attr('class', 
            sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down');
    }
}

// 添加冲刺涨停股票数据获取和渲染函数
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
                console.error('冲刺涨停数据格式错误:', response);
                $('#limitUpStocksBody').html('<tr><td colspan="5" style="text-align: center; padding: 20px; color: #ff5252;">数据格式错误</td></tr>');
            }
        },
        error: function(xhr, status, error) {
            console.error('获取冲刺涨停数据失败:', error);
            $('#limitUpStocksBody').html('<tr><td colspan="5" style="text-align: center; padding: 20px; color: #ff5252;">获取数据失败</td></tr>');
            
            // 如果API不可用，尝试使用本地数据
            $.getJSON('data/limit_up_stocks.json')
                .done(function(localData) {
                    if (localData && localData.status_code === 0 && localData.data && localData.data.info) {
                        console.log('使用本地冲刺涨停数据');
                        renderLimitUpStocks(localData.data.info);
                        updateLimitUpStats(localData.data.limit_up_count);
                    }
                })
                .fail(function() {
                    console.error('本地冲刺涨停数据也不可用');
                });
        }
    });
}

function renderLimitUpStocks(data) {
    // 限制显示前15条记录
    const limitedData = data.slice(0, 15);
    
    let html = '';
    limitedData.forEach(function(stock) {
        // 格式化数据
        const changePercent = parseFloat(stock.change_rate);
        const changeColor = '#ff5252'; // 冲刺涨停都是上涨的，所以都是红色
        
        // 获取股票代码和市场类型
        const stockCode = stock.code;
        const marketType = stock.market_type;
        
        // 计算冲击力度（使用time_preview数组的最后几个值的平均值作为冲击力度指标）
        const timePreview = stock.time_preview || [];
        const lastValues = timePreview.slice(-5); // 取最后5个值
        const momentum = lastValues.length > 0 ? 
            lastValues.reduce((sum, val) => sum + val, 0) / lastValues.length : 0;
        
        // 确定状态
        let status = '';
        let statusColor = '';
        if (stock.change_tag === 'LIMIT_FAILED') {
            status = '炸板';
            statusColor = '#ff9900';
        } else if (changePercent >= 9.9) {
            status = '涨停';
            statusColor = '#ff5252';
        } else {
            status = '冲刺';
            statusColor = '#3388ff';
        }
        
        // 根据冲击力度设置颜色
        const momentumColor = momentum > 15 ? '#ff5252' : 
                             momentum > 10 ? '#ff9900' : 
                             momentum > 5 ? '#ffcc00' : '#22e090';
        
        html += `
            <tr style="border-bottom: 1px solid #333;">
                <td style="padding: 8px; text-align: left; font-size: 12px;">
                    <a href="javascript:openStockModal('redball.html##${stockCode}##')" style="color: #fff; text-decoration: none;">
                        ${stock.name}
                    </a>
                    <span style="color: #888; font-size: 10px;">${stockCode}</span>
                </td>
                <td style="padding: 8px; text-align: right; font-size: 12px;">${stock.latest}</td>
                <td style="padding: 8px; text-align: right; font-size: 12px; color: ${changeColor};">+${changePercent.toFixed(2)}%</td>
                <td style="padding: 8px; text-align: right; font-size: 12px; color: ${momentumColor};">
                    <div class="momentum-bar" style="width: 100%; height: 4px; background: #333; border-radius: 2px; overflow: hidden;">
                        <div style="height: 100%; width: ${Math.min(100, momentum * 5)}%; background-color: ${momentumColor};"></div>
                    </div>
                    ${momentum.toFixed(1)}
                </td>
                <td style="padding: 8px; text-align: right; font-size: 12px; color: ${statusColor}; font-weight: bold;">${status}</td>
            </tr>
        `;
    });
    
    $('#limitUpStocksBody').html(html);
}

function updateLimitUpStats(limitUpCount) {
    if (!limitUpCount || !limitUpCount.today) return;
    
    const today = limitUpCount.today;
    
    // 更新今日涨停数
    $('#todayLimitUp').text(today.num || '--');
    
    // 更新封板成功率
    const successRate = today.rate ? (today.rate * 100).toFixed(1) + '%' : '--';
    $('#limitUpRate').text(successRate);
    
    // 更新打开涨停数
    $('#openLimitUp').text(today.open_num || '--');
}

// 初始化表格排序事件
function initStockTableSorting() {
    $('.sortable').click(function() {
        const sortKey = $(this).data('sort');
        const currentIcon = $(this).find('i').attr('class');
        let sortDirection = 'desc'; // 默认降序
        
        // 根据当前图标状态切换排序方向
        if (currentIcon.includes('fa-sort-down')) {
            sortDirection = 'asc'; // 如果当前是降序，切换为升序
        }
        
        // 如果有全局数据，进行排序并重新渲染
        if (window.inflowStocksData) {
            renderInflowStocks(window.inflowStocksData, sortKey, sortDirection);
        }
    });
}
