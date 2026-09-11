const { chromium } = require('playwright');

const BASE = process.env.BASE_URL || 'http://localhost:4000';
const SHOT = (file) => `tests/screenshots/${file}`;
let failures = [];

function check(name, cond, extra = '') {
  if (cond) {
    console.log(`  PASS: ${name}`);
  } else {
    failures.push(name);
    console.log(`  FAIL: ${name} ${extra}`);
  }
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  // Keep external integrations offline-deterministic.
  await page.context().route('**//wa.me/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>WhatsApp</body></html>' })
  );
  await page.context().route('**//api.qrserver.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: '<not an image>' })
  );

  const goto = (path, opts = { waitUntil: 'networkidle' }) => page.goto(BASE + path, opts);
  const rowOf = (name) => page.locator('tr', { hasText: name });

  // 1/-2. Login
  await goto('/');
  check('Login page opens', (await page.textContent('.login-title')).toLowerCase().includes('attendo'));
  await page.fill('#login-email', 'admin@attendo.com');
  await page.fill('#login-password', '123456');
  await page.click('button[type="submit"]');
  await page.waitForSelector('.dashboard', { timeout: 5000 });
  check('Admin login opens dashboard', true);

  // 3. Stats
  const stats = await page.$$eval('.stat-label', els => els.map(e => e.textContent));
  const expected = ['Total Employees', 'Currently Working', 'On Break', 'Time Off', 'Pending Biometrics'];
  check('All 5 stat cards present', expected.every(l => stats.includes(l)));
  const totalEmp = await page.$eval('.stat-card', el => parseInt(el.querySelector('.stat-value').textContent) || 0);
  check('Employee count > 0', totalEmp >= 8, String(totalEmp));
  check('Quick Attendance Summary present', (await page.textContent('.dashboard')).includes('Quick Attendance Summary'));
  check('Empty state present initially', (await page.textContent('.dashboard')).includes('No Attendance Data Available'));

  // 4. Employees CRUD
  await page.click('a[href="/employees"]');
  await page.waitForSelector('.page-header h2');
  const before = await page.$$eval('.data-table tbody tr', r => r.length);
  check('Demo employees seeded', before >= 8, String(before));

  // Add
  await page.click('.page-header button:has-text("Add Employee")');
  await page.waitForSelector('.modal');
  await page.locator('.modal input[type="text"]').first().fill('Test User One');
  await page.locator('.modal input[type="email"]').fill('test1@attendo.com');
  await page.locator('.modal input[type="text"]').nth(1).fill('1111111111');
  const popupPromise = page.waitForEvent('popup');
  await page.locator('.modal button[type="submit"]').click();
  await page.waitForSelector('tr:has-text("test1@attendo.com")', { timeout: 5000 });
  check('Add employee works', true);
  const after = await page.$$eval('.data-table tbody tr', r => r.length);
  check('Row count incremented', after === before + 1, `${before}->${after}`);

  // WhatsApp invite auto-sent on add
  const popup = await popupPromise;
  await popup.waitForURL('**wa.me**', { timeout: 5000 });
  const waUrl = popup.url();
  const waMsg = decodeURIComponent(waUrl);
  check('WhatsApp invite opens to registered number', waUrl.includes('wa.me/1111111111'), waUrl);
  check('WhatsApp message has personalized install link', waMsg.includes('/install?employee=') && waMsg.includes('Attendo'), waUrl);
  check('WhatsApp message personalized with employee details', waMsg.includes('Test User One') && waMsg.includes('1111111111'), waUrl);
  await popup.close();

  // Install landing page is public and personalized
  const newEmpId = (await rowOf('test1@attendo.com').locator('td').nth(0).textContent()).trim();
  await goto(`/install?employee=${newEmpId}&name=Test+User+One`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.install-page');
  const installText = await page.textContent('.install-page');
  check('Install page personalized', installText.includes('Test User One') && installText.includes('Attendo'));
  await goto('/employees');
  await page.waitForSelector('.page-header h2');

  // Duplicate email
  await page.click('.page-header button:has-text("Add Employee")');
  await page.waitForSelector('.modal');
  await page.locator('.modal input[type="text"]').first().fill('Test User Two');
  await page.locator('.modal input[type="email"]').fill('test1@attendo.com');
  await page.locator('.modal input[type="text"]').nth(1).fill('2222222222');
  await page.locator('.modal button[type="submit"]').click();
  await page.waitForTimeout(500);
  check('Duplicate email validation shown', (await page.textContent('.modal')).includes('Email already exists'));
  await page.click('.modal-close');
  await page.waitForSelector('.modal', { state: 'detached' });

  // Edit
  await rowOf('Test User One').locator('button[title="Edit"]').click();
  await page.waitForSelector('.modal');
  await page.locator('.modal input[type="text"]').first().fill('Test User One Edited');
  await page.locator('.modal button[type="submit"]').click();
  await page.waitForSelector('tr:has-text("Test User One Edited")', { timeout: 5000 });
  check('Edit employee updates name', true);

  // Search
  await page.fill('.search-input', 'Test User One Edited');
  await page.waitForTimeout(400);
  const searchRows = await page.$$eval('.data-table tbody tr', r => r.length);
  check('Search filters rows', searchRows === 1, String(searchRows));
  await page.fill('.search-input', '');
  await page.waitForTimeout(400);

  // Filter
  await page.selectOption('.filters-bar select >> nth=0', 'Development');
  await page.waitForTimeout(400);
  const filterRows = await page.$$eval('.data-table tbody tr', r => r.length);
  check('Department filter works', filterRows > 0 && filterRows < after, String(filterRows));
  await page.click('.filters-bar button:has-text("Reset")');
  await page.waitForTimeout(400);

  // Delete
  await rowOf('Test User One Edited').locator('button[title="Delete"]').click();
  await page.waitForSelector('.modal');
  check('Delete confirmation shown', (await page.textContent('.modal')).includes('Are you sure you want to delete this employee'));
  await page.locator('.modal button:has-text("Delete")').click();
  await page.waitForTimeout(600);
  check('Employee deleted', !(await page.textContent('.data-table')).includes('Test User One Edited'));

  // 5. Attendance - check in Rahul
  await page.click('a[href="/attendance"]');
  await page.waitForSelector('.page-header h2');
  await page.waitForTimeout(300);
  const rahul = rowOf('Rahul Patel');
  await rahul.waitFor({ timeout: 5000 });
  const checkInBtn = rahul.locator('button:has-text("Check In")');
  // Retry the click until the row transitions out of the Absent state.
  let checkedIn = false;
  for (let attempt = 0; attempt < 5 && !checkedIn; attempt++) {
    if (await checkInBtn.count()) await checkInBtn.click().catch(() => {});
    try {
      await rahul.locator('button:has-text("Check Out")').waitFor({ timeout: 1500 });
      checkedIn = true;
    } catch {
      // not yet, retry
    }
  }
  if (!checkedIn) {
    console.log('  DIAG row:', JSON.stringify((await rahul.textContent()).trim()));
    await page.screenshot({ path: SHOT('test-failure-checkin.png'), fullPage: true });
    console.log('  DIAG console errors so far:', errors.slice(0, 5));
    throw new Error('check-in did not register');
  }
  const afterCheckIn = await rahul.textContent();
  check('Check-in recorded', afterCheckIn.includes('Present') || afterCheckIn.includes('Late'), afterCheckIn);

  // Duplicate check-in blocked (no Check In button anymore)
  check('Check In button removed', await checkInBtn.count() === 0);

  // 6. Dashboard reflects check-in
  await page.click('a[href="/"]');
  await page.waitForSelector('.dashboard');
  const working = await page.$$eval('.stat-card', cards => cards.map(c => c.textContent).find(t => t.includes('Currently Working')));
  check('Currently Working increments', parseInt(working) >= 1, working);

  // 7. Break
  await page.click('a[href="/attendance"]');
  await page.waitForSelector('.page-header h2');
  const brRow = rowOf('Rahul Patel');
  await brRow.locator('button:has-text("Check Out")').waitFor({ timeout: 5000 });
  await brRow.locator('button:has-text("Break")').click();
  await brRow.locator('button:has-text("End Break")').waitFor({ timeout: 5000 });
  check('Break start -> On Break', (await brRow.textContent()).includes('On Break'));
  await brRow.locator('button:has-text("End Break")').click();
  await brRow.locator('button:has-text("Break")').waitFor({ timeout: 5000 });
  check('Break end -> Present', (await brRow.textContent()).includes('Present'));

  // 8. Check out
  await brRow.locator('button:has-text("Check Out")').click();
  await page.waitForTimeout(800);
  const hoursCell = await rowOf('Rahul Patel').locator('td').nth(6).textContent();
  check('Total hours computed', /^\d+(\.\d+)?h$/.test(hoursCell.trim()) && parseFloat(hoursCell) >= 0, hoursCell);

  // 9. Leave request
  await page.click('button:has-text("Request Leave")');
  await page.waitForSelector('.modal');
  await page.selectOption('.modal select >> nth=0', { label: 'Neha Desai' });
  await page.selectOption('.modal select >> nth=1', { label: 'Sick Leave' });
  const dstr = new Date().toISOString().split('T')[0];
  await page.locator('.modal input[type="date"]').nth(0).fill(dstr);
  await page.locator('.modal input[type="date"]').nth(1).fill(dstr);
  await page.fill('.modal textarea', 'Test leave reason');
  await page.locator('.modal button:has-text("Submit Request")').click();
  await page.waitForTimeout(700);
  check('Leave request submitted', true);

  // 10. Approve leave
  await page.click('a[href="/settings"]');
  await page.waitForSelector('.settings-sidebar');
  await page.click('.settings-nav-item:has-text("Leave Requests")');
  await page.waitForSelector('tr:has-text("Neha Desai")', { timeout: 5000 });
  await rowOf('Neha Desai').locator('button:has-text("Approve")').click();
  await page.waitForSelector('.settings-content >> text=No pending leave requests', { timeout: 5000 });
  check('Leave approved by admin', true);

  // 11. Time Off on dashboard
  await page.click('a[href="/"]');
  await page.waitForSelector('.dashboard');
  const timeOff = await page.$$eval('.stat-card', cards => cards.map(c => c.textContent).find(t => t.includes('Time Off')));
  check('Approved leave shows as Time Off', parseInt(timeOff) >= 1, timeOff);

  // 12. Reports
  await page.click('a[href="/reports"]');
  await page.waitForSelector('.report-cards');
  check('Reports show rates', (await page.textContent('.report-cards')).includes('%'));
  check('Reports show check-ins', (await page.textContent('.report-cards')).includes('Total Check-ins'));

  // 13. Export CSV
  const dl = page.waitForEvent('download', { timeout: 5000 });
  await page.click('button:has-text("Export CSV")');
  const download = await dl;
  check('CSV export filename correct', download.suggestedFilename() === 'attendo-attendance-report.csv', download.suggestedFilename());

  // 14. Settings dark mode
  await page.click('a[href="/settings"]');
  await page.waitForSelector('.settings-sidebar');
  const darkToggle = page.locator('.settings-content .toggle-slider').first();
  await darkToggle.waitFor({ timeout: 5000 });
  const darkInput = page.locator('.settings-content .toggle input').first();
  const isLessDarkCheck = await darkInput.isChecked();
  if (!isLessDarkCheck) await darkToggle.click();
  await page.waitForTimeout(400);
  check('Dark mode enabled', await page.evaluate(() => document.documentElement.getAttribute('data-theme')) === 'dark');

  // 15. Refresh persists dark mode
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.sidebar');
  check('Dark mode persists after refresh', await page.evaluate(() => document.documentElement.getAttribute('data-theme')) === 'dark');

  // 16. Logout
  await page.click('.sidebar-logout');
  await page.waitForSelector('.login-page');
  check('Logout returns to login', true);

  // 17. Employee login
  await page.fill('#login-email', 'rahul@attendo.com');
  await page.selectOption('#login-role', 'employee');
  await page.fill('#login-password', '123456');
  await page.click('button[type="submit"]');
  await page.waitForSelector('.dashboard', { timeout: 5000 });
  check('Employee login opens dashboard', true);
  const menuLinks = await page.$$eval('.sidebar-link', els => els.map(e => e.textContent));
  check('Employee cannot see Employees menu', !menuLinks.some(l => l.includes('Employees')));
  check('Employee cannot see Settings menu', !menuLinks.some(l => l.includes('Settings')));

  // Employee sees own attendance only
  await page.click('.sidebar-link[href="/attendance"]');
  await page.waitForSelector('.page-header h2');
  const ownRows = await page.$$eval('.data-table tbody tr', r => r.length);
  check('Employee sees own attendance', ownRows === 1, String(ownRows));

  // 18. Mobile responsive
  await page.setViewportSize({ width: 375, height: 667 });
  await goto('/');
  await page.waitForSelector('.dashboard');
  check('Mobile menu toggle visible', await page.isVisible('.menu-toggle'));
  await page.click('.menu-toggle');
  await page.waitForTimeout(500);
  check('Mobile sidebar opens', await page.isVisible('.sidebar-open'));
  await page.click('.sidebar-overlay', { position: { x: 330, y: 400 } });
  await page.waitForTimeout(400);
  await page.screenshot({ path: SHOT('test-dashboard-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({ path: SHOT('test-dashboard-desktop.png'), fullPage: true });
  console.log('  Screenshots saved');

  // 19. Admin login again - data persists
  await page.click('.sidebar-logout');
  await page.waitForSelector('.login-page');
  await page.fill('#login-email', 'admin@attendo.com');
  await page.fill('#login-password', '123456');
  await page.click('button[type="submit"]');
  await page.waitForSelector('.dashboard', { timeout: 5000 });
  await page.click('a[href="/employees"]');
  await page.waitForSelector('.page-header h2');
  const finalRows = await page.$$eval('.data-table tbody tr', r => r.length);
  check('Data persists after logout/login', finalRows >= 8, String(finalRows));

  // 20. Console errors
  check('No console/page errors', errors.length === 0, errors.slice(0, 5).join(' | '));

  await browser.close();
  console.log('\n========================');
  if (failures.length) {
    console.log(`RESULT: ${failures.length} FAILURES`);
    failures.forEach(f => console.log('  - ' + f));
    process.exit(1);
  } else {
    console.log('RESULT: ALL TESTS PASSED');
  }
})();