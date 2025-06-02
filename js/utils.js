// utils.js - 通用工具函数

// 时间格式化函数
function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

// 只保留到分钟的时间格式化函数，保证和timeAxis一致
function formatTimeHM(timestamp) {
    const date = new Date(timestamp * 1000);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 生成固定的交易时间横坐标
function generateTradingTimeAxis() {
    const times = [];
    // 上午交易时段：9:30-11:30
    for (let h = 9; h <= 11; h++) {
        for (let m = 0; m <= 59; m++) {
            if ((h === 9 && m >= 30) || (h === 10) || (h === 11 && m <= 30)) {
                times.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
            }
        }
    }
    // 下午交易时段：13:00-15:00
    for (let h = 13; h <= 15; h++) {
        for (let m = 0; m <= 59; m++) {
            if (h === 15 && m > 0) break;
            times.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
    }
    return times;
} 