// 股票池操作工具
const STOCK_POOL_KEY = 'stock_pool';

// 读取股票池
function getStockPool() {
  const match = document.cookie.match(new RegExp('(^| )' + STOCK_POOL_KEY + '=([^;]+)'));
  if (match) {
    try {
      return JSON.parse(decodeURIComponent(match[2]));
    } catch (e) {}
  }
  return [];
}

// 保存股票池
function setStockPool(pool) {
  const value = encodeURIComponent(JSON.stringify(pool));
  document.cookie = `${STOCK_POOL_KEY}=${value};path=/;max-age=${60*60*24*365}`;
}

// 添加股票
function addToStockPool(code, name) {
  const pool = getStockPool();
  if (!pool.find(item => item.code === code)) {
    pool.push({ code, name, date: new Date().toISOString().slice(0,10) });
    setStockPool(pool);
  }
}

// 移除股票
function removeFromStockPool(code) {
  let pool = getStockPool();
  pool = pool.filter(item => item.code !== code);
  setStockPool(pool);
}

// 判断是否已收藏
function isInStockPool(code) {
  return getStockPool().some(item => item.code === code);
}