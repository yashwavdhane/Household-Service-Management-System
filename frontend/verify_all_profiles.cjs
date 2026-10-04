const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Test accounts
  const accounts = [
    { role: 'Customer', email: 'testcustomer@hsms.com', password: 'customerpassword123', url: 'http://localhost:5173/customer/profile' },
    { role: 'Provider', email: 'testprovider@hsms.com', password: 'providerpassword123', url: 'http://localhost:5173/provider/profile' },
    { role: 'Admin', email: 'testadmin@hsms.com', password: 'adminpassword123', url: 'http://localhost:5173/admin/settings' } // Admin url is /admin/settings not profile, wait let me check AppRoutes.jsx
  ];

  for (const acc of accounts) {
    console.log(`\n--- Testing ${acc.role} Profile Update ---`);
    try {
      // 1. Log in
      await page.goto('http://localhost:5173/login');
      await page.waitForSelector('input[type="email"]');
      await page.type('input[type="email"]', acc.email);
      await page.type('input[type="password"]', acc.password);
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0' })
      ]);

      // 2. Go to profile page
      console.log(`Navigating to ${acc.url}`);
      await page.goto(acc.url);
      await page.waitForSelector('button[type="submit"]');

      // 3. Update a field (phone number) to trigger a save
      // For simplicity, we just click save without changing, as backend accepts identical saves
      console.log(`Clicking Save Profile`);
      await page.click('button[type="submit"]');

      // 4. Wait for success or error message
      const result = await page.evaluate(async () => {
        return new Promise((resolve) => {
          const interval = setInterval(() => {
            const success = Array.from(document.querySelectorAll('div')).find(el => el.textContent.includes('✅'));
            const error = Array.from(document.querySelectorAll('div')).find(el => el.textContent.includes('⚠️'));
            if (success) {
              clearInterval(interval);
              resolve({ status: 'success', text: success.textContent });
            } else if (error) {
              clearInterval(interval);
              resolve({ status: 'error', text: error.textContent });
            }
          }, 100);
          setTimeout(() => {
            clearInterval(interval);
            resolve({ status: 'timeout', text: 'No success or error message appeared' });
          }, 5000);
        });
      });

      console.log(`Result: [${result.status}] ${result.text}`);

      // 5. Log out for next role
      await page.evaluate(() => {
        localStorage.clear();
      });
      await page.goto('http://localhost:5173/login');

    } catch (e) {
      console.error(`Error testing ${acc.role}:`, e.message);
    }
  }

  await browser.close();
})();
