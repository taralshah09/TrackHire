
const cheerio = require('cheerio');
const fs = require('fs');

const html = fs.readFileSync('ibm_page.html', 'utf8');
const $ = cheerio.load(html);

console.log("Found hits container:", $('.ibm--hits').length);

$('.ibm--hits .bx--card, .ibm--card').each((i, el) => {
    const title = $(el).find('h3, .ibm--card__title').text().trim();
    const link = $(el).find('a').attr('href');
    console.log(`Job ${i}:`, title, link);
});

// Try to find any job blocks if the above fails
if ($('.ibm--hits .bx--card').length === 0) {
    console.log("Trying alternative selectors...");
    $('a[href*="/careers/"]').each((i, el) => {
        const text = $(el).text().trim();
        const href = $(el).attr('href');
        if (text.length > 10 && href.includes('search')) {
            console.log(`Link ${i}:`, text, href);
        }
    });
}
