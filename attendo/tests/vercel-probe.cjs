const { chromium, webkit, firefox } = require('playwright');

const URL = 'https://attendo-qnq7.vercel.app';

async function run(browserType, name) {
  const browser = await browserType.launch();
  const page = await browser.newPage();
  const errors = [];
  const consoleMessages = [];
  const failed = [];
  page.on('console', (m) => consoleMessages.push('[' + m.type() + '] ' + m.text()));
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('requestfailed', (r) => failed.push('REQFAIL: ' + r.url() + ' -> ' + (r.failure() ? r.failure().errorText : '?')));

  const rootSummary = () => page.evaluate(() => {
    const root = document.getElementById('root');
    if (!root) return '(NO ROOT!)';
    const cls = [...root.children].map((c) => c.className || c.tagName).join(', ');
    return 'children=' + root.children.length + ' [' + cls + ']';
  });

  console.log('\n========== ' + name + ' ==========');
  await page.goto(URL + '/', { waitUntil: 'load', timeout: 30000 }).catch((e) => errors.push('GOTO /: ' + e.message));
  await page.waitForTimeout(1500);
  console.log('/ ->', await rootSummary());

  // Admin login
  await page.fill('#login-email', 'admin@attendo.com');
  await page.fill('#login-password', '123456');
  await page.click('.login-form button[type="submit"]');
  await page.waitForTimeout(2500);
  console.log('after login ->', page.url(), '|', await rootSummary());

  // Explore routes
  for (const path of ['/dashboard', '/employees', '/reports', '/ai-report', '/settings', '/employee-login']) {
    await page.goto(URL + path, { waitUntil: 'load', timeout: 30000 }).catch((e) => errors.push('GOTO ' + path + ': ' + e.message));
    await page.waitForTimeout(1200);
    console.log(path + ' ->', await rootSummary());
  }

  console.log('PAGE ERRORS:', errors.length ? errors : 'none');
  console.log('CONSOLE:', consoleMessages.length ? consoleMessages.slice(0, 20) : 'none');
  console.log('FAILED REQS:', failed.length ? failed.slice(0, 20) : 'none');
  await browser.close();
}

(async () => {
  await run(chromium, 'chromium');
  await run(webkit, 'webkit');
  await run(firefox, 'firefox');
})();