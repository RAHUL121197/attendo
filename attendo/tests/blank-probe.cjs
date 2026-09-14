const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  const consoleMessages = [];
  page.on('console', (m) => consoleMessages.push('[' + m.type() + '] ' + m.text()));
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

  await page.goto('http://localhost:4000/', { waitUntil: 'networkidle', timeout: 15000 });
  const rootHTML = await page.evaluate(() => {
    const root = document.getElementById('root');
    return root ? root.innerHTML.slice(0, 3000) : '(NO ROOT)';
  });
  console.log('=== ROOT HTML (first 3000 chars) ===');
  console.log(rootHTML);
  console.log('=== PAGE ERRORS ===');
  errors.forEach(e => console.log(e));
  console.log('=== CONSOLE ===');
  consoleMessages.forEach(m => console.log(m));
  await browser.close();
})();
