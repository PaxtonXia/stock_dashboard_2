// main.js - 主程序入口，负责初始化和调度

// 全局变量
let stockData = [];

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化所有图表
    initMarketSentimentCharts();
    drawIndexTrendChart('mainIndexLineChart');
    
    // 注册全局Chart.js插件
    Chart.plugins.register(ChartDataLabels);

    // 加载市场情绪数据
    fetchMarketSentiment();
    setInterval(fetchMarketSentiment, 30000); // 每30秒更新一次

    // 加载资金流向数据
    loadFundFlowCharts();
    setInterval(loadFundFlowCharts, 60000); // 每60秒更新一次

    // 加载大盘指数数据
    fetchMainIndexTrend();
    setInterval(fetchMainIndexTrend, 30000); // 每30秒更新一次

    // 加载股票数据
    fetchInflowStocks();
    setInterval(fetchInflowStocks, 60000); // 每60秒更新一次

    fetchLimitUpStocks();
    setInterval(fetchLimitUpStocks, 60000); // 每60秒更新一次

    // 初始化表格排序事件
    initStockTableSorting();

    // 加载新闻和板块数据
    fetchNews();
    setInterval(fetchNews, 10000); // 每10秒更新一次

    fetchPlates();
    setInterval(fetchPlates, 10000); // 每10秒更新一次

    fetchHotspotData();
    setInterval(fetchHotspotData, 30000); // 每30秒更新一次
});
