const { chromium } = require('playwright');

const TARGET_URL = 'https://app.9yee.com/next_hotspot.html';

(async () => {
  console.log('Starting Playwright browser...\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 设置视口
  await page.setViewportSize({ width: 1280, height: 900 });

  // 设置 User-Agent
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  console.log('Navigating to:', TARGET_URL);

  try {
    await page.goto(TARGET_URL, {
      waitUntil: 'networkidle',
      timeout: 45000
    });

    console.log('Page loaded, waiting for dynamic content...\n');

    // 等待动态内容加载（关键步骤）
    await page.waitForTimeout(8000);

    // 获取页面标题
    const title = await page.title();
    console.log('=== 页面标题 ===');
    console.log(title);
    console.log('');

    // 提取所有文本内容（包括动态加载的）
    const content = await page.evaluate(() => {
      // 移除不需要的元素
      const removeTags = ['script', 'style', 'noscript'];
      removeTags.forEach(tag => {
        document.querySelectorAll(tag).forEach(el => el.remove());
      });

      // 获取 body 内所有文本
      return document.body.innerText;
    });

    console.log('=== 页面完整内容 ===\n');
    console.log(content);
    console.log('\n=== 内容结束 ===');

    // 尝试获取表格数据
    const tables = await page.evaluate(() => {
      const tableData = [];
      document.querySelectorAll('table').forEach((table, i) => {
        const rows = [];
        table.querySelectorAll('tr').forEach(row => {
          const cells = [];
          row.querySelectorAll('td, th').forEach(cell => {
            cells.push(cell.innerText.trim());
          });
          if (cells.length > 0) rows.push(cells);
        });
        if (rows.length > 0) tableData.push({ index: i, rows });
      });
      return tableData;
    });

    if (tables.length > 0) {
      console.log('\n=== 表格数据 ===');
      tables.forEach(t => {
        console.log(`\n表格 ${t.index + 1}:`);
        t.rows.forEach(row => console.log(row.join(' | ')));
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  }

  await browser.close();
  console.log('\nBrowser closed.');
})();
