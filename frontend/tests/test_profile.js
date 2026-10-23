import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:5173/login');
  
  await page.type('#login-email', 'testadmin@hsms.com');
  await page.type('#login-password', 'adminpassword123');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation();
  
  await page.goto('http://localhost:5173/admin/settings');
  
  await new Promise(r => setTimeout(r, 2000));
  
  await page.evaluate(() => {
    document.querySelector('#ad-phone').value = '';
  });
  await page.type('#ad-phone', '1234567890');
  
  // Submit form
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 3000));
  
  const textDisplayed = await page.evaluate(() => {
    const errorDiv = Array.from(document.querySelectorAll('div')).find(div => div.textContent.includes('Failed to update profile'));
    const successDiv = Array.from(document.querySelectorAll('div')).find(div => div.textContent.includes('Profile updated successfully'));
    
    if (errorDiv) return 'ERROR: ' + errorDiv.textContent;
    if (successDiv) return 'SUCCESS: ' + successDiv.textContent;
    return 'No message displayed';
  });
  console.log('Message displayed on screen:', textDisplayed);
  
  await browser.close();
})();
