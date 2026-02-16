
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log("🚀 Starting IBM job scraper...");
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

        // Use a search URL directly to get relevant results
        const url = 'https://www.ibm.com/careers/us-en/search?field_keyword_08=Software%20Engineer';
        console.log(`Navigating to ${url}...`);

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait for results to load - key selector seems to be related to 'bx--card' or 'ibm--card' based on inspection
        // If those don't work, we'll try to find any link with /careers/ in it that looks like a job
        try {
            await page.waitForSelector('.bx--card, a[href*="/careers/"]', { timeout: 15000 });
            console.log("Results container loaded or links found.");
        } catch (e) {
            console.log("Timeout waiting for specific selectors, proceeding to scrape anyway...");
        }

        // Scroll to load lazy content
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 100;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if (totalHeight >= scrollHeight - window.innerHeight || totalHeight > 5000) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });

        // Extract jobs
        const jobs = await page.evaluate(() => {
            const jobList = [];

            // Strategy 1: Look for specific card elements (based on earlier grep hints)
            const cards = document.querySelectorAll('.bx--card, .ibm--card');
            if (cards.length > 0) {
                cards.forEach(card => {
                    const title = card.querySelector('h3, .bx--card__heading, .ibm--card__title')?.innerText?.trim();
                    const link = card.querySelector('a')?.href;
                    const location = card.querySelector('.bx--card__copy, .ibm--card__copy')?.innerText?.trim(); // Guessing class names

                    if (title && link) {
                        jobList.push({ title, link, location, source: 'IBM' });
                    }
                });
            }

            // Strategy 2: Fallback to all links if specific cards aren't found
            if (jobList.length === 0) {
                const links = document.querySelectorAll('a[href*="/careers/"]');
                links.forEach(a => {
                    const title = a.innerText.trim();
                    const link = a.href;

                    // Filter out non-job links (navigation, etc.)
                    if (link.includes('/search') || link.includes('/job/') || (title.length > 10 && !title.includes('Search') && !title.includes('Careers'))) {
                        // Simple heuristic: if it has a substantial title and points to a career page, take it
                        // Ideally we'd refine this, but for now this catches potential jobs
                        if (!jobList.some(j => j.link === link)) {
                            jobList.push({ title, link, source: 'IBM', note: 'Fallback extraction' });
                        }
                    }
                });
            }

            return jobList;
        });

        console.log(`Found ${jobs.length} potential jobs.`);

        // Save to JSON file
        fs.writeFileSync('ibm_jobs.json', JSON.stringify(jobs, null, 2));
        console.log("💾 Saved jobs to ibm_jobs.json");

    } catch (error) {
        console.error("Error during scraping:", error);
    } finally {
        await browser.close();
    }
})();