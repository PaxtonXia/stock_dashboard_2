// 最强风口相关功能
class HotspotManager {
    constructor() {
        this.container = document.getElementById('hotspotContainer');
        // 添加模拟数据用于测试
        this.mockData = [
            {
                name: "光伏设备",
                increase: 5.8,
                amount: 12300000000,
                description: "光伏产业链持续回暖，硅片价格连续上涨，带动设备需求预期改善",
                stocks: [
                    { name: "晶盛机电", code: "300316", change: 6.28, url: "#" },
                    { name: "北方华创", code: "002371", change: 5.16, url: "#" },
                    { name: "京运通", code: "601908", change: 4.89, url: "#" },
                    { name: "捷佳伟创", code: "300724", change: 4.52, url: "#" }
                ]
            },
            {
                name: "新能源车",
                increase: 4.2,
                amount: 15600000000,
                description: "产业链景气度持续提升，销量数据超预期，带动板块整体走强",
                stocks: [
                    { name: "比亚迪", code: "002594", change: 4.75, url: "#" },
                    { name: "宁德时代", code: "300750", change: 3.92, url: "#" },
                    { name: "亿纬锂能", code: "300014", change: 3.68, url: "#" },
                    { name: "德方纳米", code: "300769", change: 3.45, url: "#" }
                ]
            }
            // 可以添加更多模拟数据...
        ];
    }

    // 格式化金额
    formatAmount(amount) {
        if (amount >= 100000000) {
            return (amount / 100000000).toFixed(1) + '亿';
        }
        return (amount / 10000).toFixed(0) + '万';
    }

    // 渲染单个热点项
    renderHotspotItem(item) {
        return `
            <div class="hotspot-item">
                <div class="hotspot-header">
                    <div class="hotspot-name">${item.name}</div>
                    <div class="hotspot-stats">
                        <span class="hotspot-stat">领涨 ${item.increase}%</span>
                        <span class="hotspot-stat">成交额 ${this.formatAmount(item.amount)}</span>
                    </div>
                </div>
                <div class="hotspot-desc">
                    ${item.description}
                </div>
                <div class="stock-list-hotspot">
                    ${item.stocks.map(stock => `
                        <div class="stock-item-hotspot" onclick="openStockModal('${stock.url}')">
                            <span class="stock-name-hotspot">${stock.name}</span>
                            <span class="stock-code-hotspot">${stock.code}</span>
                            <span class="stock-change ${stock.change >= 0 ? 'positive-hotspot' : 'negative-hotspot'}">
                                ${stock.change >= 0 ? '+' : ''}${stock.change}%
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 渲染所有数据
    renderData() {
        this.container.innerHTML = '';
        const hotspotGrid = document.createElement('div');
        hotspotGrid.className = 'hotspot-grid';

        this.mockData.forEach(item => {
            hotspotGrid.innerHTML += this.renderHotspotItem(item);
        });

        this.container.appendChild(hotspotGrid);
    }

    // 初始化
    init() {
        this.renderData();
        // 每60秒更新一次数据
        setInterval(() => this.renderData(), 60000);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    const hotspotManager = new HotspotManager();
    hotspotManager.init();
});