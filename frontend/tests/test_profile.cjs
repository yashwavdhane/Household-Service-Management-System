const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:5173/login');
  
  await page.type('#email', 'admin@hsms.com');
  await page.type('#password', 'adminpassword123');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation();
  
  await page.goto('http://localhost:5173/admin/profile');
  
  await page.waitForSelector('#ad-phone');
  
  await page.type('#ad-phone', '1');
  
  // Submit form
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 2000));
  
  // print the error message text if it exists
  const errorText = await page.evaluate(() => {
    const errorDiv = Array.from(document.querySelectorAll('div')).find(div => div.textContent.includes('Failed to update profile'));
    return errorDiv ? errorDiv.textContent : 'No error displayed';
  });
  console.log('Error displayed on screen:', errorText);
  
  await browser.close();
})();
