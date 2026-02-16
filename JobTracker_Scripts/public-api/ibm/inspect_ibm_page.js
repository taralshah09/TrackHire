
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    try {
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        console.log("Navigating to IBM Careers...");
        await page.goto('https://www.ibm.com/careers/us-en/search/', { waitUntil: 'networkidle2', timeout: 60000 });

        console.log("Page loaded. Saving content...");
        const content = await page.content();
        fs.writeFileSync('ibm_page.html', content);
        console.log("Saved to ibm_page.html");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await browser.close();
    }
})();
