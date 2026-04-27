// utils.js - 通用工具函数

// ==================== 时间格式化 ====================

function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function formatTimeHM(timestamp) {
    const date = new Date(timestamp * 1000);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 生成固定的交易时间横坐标
function generateTradingTimeAxis() {
    const times = [];
    for (let h = 9; h <= 11; h++) {
        for (let m = 0; m <= 59; m++) {
            if ((h === 9 && m >= 30) || (h === 10) || (h === 11 && m <= 30)) {
                times.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
            }
        }
    }
    for (let h = 13; h <= 15; h++) {
        for (let m = 0; m <= 59; m++) {
            if (h === 15 && m > 0) break;
            times.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
    }
    return times;
}

// ==================== 时钟 & 市场状态 ====================

function updateCurrentTime(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const isTradingDay = now.getDay() >= 1 && now.getDay() <= 5;
    const hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const isTrading = isTradingDay && ((hm >= '09:30' && hm <= '11:30') || (hm >= '13:00' && hm <= '15:00'));
    const status = !isTradingDay ? ' 休市中' : isTrading ? ' 交易中' : ' 非交易时间';
    el.textContent = `${dateStr} ${timeStr}${status}`;
}

// ==================== Modal ====================

function openStockModal(url) {
    document.getElementById('stockModalFrame').src = url;
    document.getElementById('stockModal').style.display = 'block';
}

function closeStockModal() {
    document.getElementById('stockModal').style.display = 'none';
    document.getElementById('stockModalFrame').src = '';
}

function initModal() {
    const closeBtn = document.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeStockModal);
    const modal = document.getElementById('stockModal');
    if (modal) modal.addEventListener('click', function(e) {
        if (e.target === this) closeStockModal();
    });
}

// ==================== Toast 通知 ====================

function showToast(message, type) {
    const bgColor = type === 'success' ? 'var(--c-fall, #2fb344)' : 'var(--c-rise-bright, #ef4444)';
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background: ${bgColor}; color: white;
        padding: 12px 20px; border-radius: var(--r-sm, 4px);
        box-shadow: var(--shadow-float, 0 4px 16px rgba(0,0,0,0.35));
        z-index: 10000; font-size: 14px;
        animation: toastSlideIn 0.3s ease-out;
    `;
    if (!document.getElementById('toast-animations')) {
        const style = document.createElement('style');
        style.id = 'toast-animations';
        style.textContent = `
            @keyframes toastSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes toastSlideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
        `;
        document.head.appendChild(style);
    }
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s ease-out';
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
    }, 3000);
}

function showCopySuccess(name, code) { showToast(`已复制 ${name} (${code})`, 'success'); }
function showCopyError(msg) { showToast(msg || '复制失败，请手动复制', 'error'); }

// ==================== 剪贴板 ====================

async function copyToClipboard(text) {
    if (navigator.clipboard) {
        try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fallback */ }
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        return ok;
    } catch (e) {
        document.body.removeChild(textarea);
        return false;
    }
}

function copyStockCode(code, name) {
    event.stopPropagation();
    copyToClipboard(code).then(ok => {
        if (ok) showCopySuccess(name, code); else showCopyError();
    });
}

function copyStocks(plateId, plateName) {
    event.stopPropagation();
    const checkbox = document.querySelector(`[data-plate-id="${plateId}"] .filter-checkbox`);
    const isFilterLimitUp = checkbox ? checkbox.checked : false;
    const stockItems = document.querySelectorAll(`[data-plate-id="${plateId}"] .plate-stock-item`);
    const stockCodes = [];
    stockItems.forEach(item => {
        const isLimitUp = item.getAttribute('data-is-limit-up') === 'true';
        if (isFilterLimitUp && isLimitUp) return;
        const codeElement = item.querySelector('.plate-stock-code');
        if (codeElement) stockCodes.push(codeElement.textContent.trim());
    });
    if (stockCodes.length === 0) {
        showCopyError(isFilterLimitUp ? '没有找到未涨停的股票' : '没有找到相关股票');
        return;
    }
    const msg = isFilterLimitUp ? `${stockCodes.length}只未涨停股票` : `${stockCodes.length}只股票`;
    copyToClipboard(stockCodes.join(',')).then(ok => {
        if (ok) showCopySuccess(plateName, msg); else showCopyError();
    });
}

// ==================== Tooltip ====================

function showStockTooltip(stockInfo, event) {
    hideStockTooltip();
    const tooltipText = stockInfo.getAttribute('data-tooltip');
    if (!tooltipText || tooltipText === '暂无说明') return;
    const tooltip = document.createElement('div');
    tooltip.id = 'stock-tooltip';
    tooltip.className = 'stock-tooltip';
    tooltip.textContent = tooltipText;
    const rect = stockInfo.getBoundingClientRect();
    const tooltipWidth = 280;
    const tooltipHeight = 80;
    let left = rect.right + 12;
    let top = rect.bottom - tooltipHeight / 2;
    if (left + tooltipWidth > window.innerWidth - 10) left = window.innerWidth - tooltipWidth - 10;
    if (top < 10) top = 10;
    else if (top + tooltipHeight > window.innerHeight - 10) top = window.innerHeight - 10;
    tooltip.style.cssText = `
        position: fixed; left: ${left}px; top: ${top}px;
        background: var(--c-bg-surface, #1a2332); color: var(--c-text-primary, #e5e7eb);
        padding: 12px 16px; border-radius: var(--r-xl, 12px);
        font-size: var(--fs-xs, 11px); line-height: 1.6;
        max-width: 300px; min-width: 180px; z-index: 9999;
        box-shadow: var(--shadow-modal, 0 8px 32px rgba(0,0,0,0.5)), 0 0 0 1px var(--c-border, #2e3c51);
        border: 1px solid var(--c-border-light, #3a4d66);
        word-wrap: break-word;
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        pointer-events: none;
    `;
    const arrow = document.createElement('div');
    arrow.id = 'stock-tooltip-arrow';
    arrow.style.cssText = `
        position: fixed; left: ${left - 13}px; top: ${rect.top + (rect.height / 2) - 6}px;
        width: 0; height: 0;
        border: 6px solid transparent;
        border-right-color: var(--c-bg-surface, #1a2332);
        filter: drop-shadow(2px 0 2px rgba(0,0,0,0.3));
        z-index: 10001; pointer-events: none;
    `;
    document.body.appendChild(tooltip);
    document.body.appendChild(arrow);
}

function hideStockTooltip() {
    const tooltip = document.getElementById('stock-tooltip');
    const arrow = document.getElementById('stock-tooltip-arrow');
    if (tooltip) tooltip.remove();
    if (arrow) arrow.remove();
}

function initTooltips() {
    if (!document.getElementById('tooltip-animations')) {
        const style = document.createElement('style');
        style.id = 'tooltip-animations';
        style.textContent = `
            .stock-tooltip { animation: tooltipFadeIn 0.2s ease-out; }
            @keyframes tooltipFadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        `;
        document.head.appendChild(style);
    }
    document.addEventListener('mouseenter', function(e) {
        const stockInfo = e.target.closest('.plate-stock-info[data-tooltip]');
        if (stockInfo && stockInfo.getAttribute('data-tooltip')) showStockTooltip(stockInfo, e);
    }, true);
    document.addEventListener('mouseleave', function(e) {
        const stockInfo = e.target.closest('.plate-stock-info[data-tooltip]');
        if (stockInfo) hideStockTooltip();
    }, true);
}