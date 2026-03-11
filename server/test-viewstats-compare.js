const { connect } = require('puppeteer-real-browser');

async function testScraper(handle) {
    console.log(`Testing ViewStats for: ${handle}`);
    let browser;
    try {
        const { browser: b, page } = await connect({
            headless: true,
            turnstile: true,
            disableXvfb: false,
        });
        browser = b;

        await page.goto(`https://www.viewstats.com/@${handle}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 6000));

        const cards = await page.evaluate(() => {
            const result = {};
            const allText = document.body.innerText.split('\n').map(t => t.trim()).filter(t => t);

            // let's grab the array
            result.allText = allText;
            return result;
        });

        const fs = require('fs');
        fs.writeFileSync('viewstats_text.json', JSON.stringify(cards, null, 2));
        console.log("Saved text to viewstats_text.json");

        await browser.close();
    } catch (e) {
        console.error(e);
        if (browser) await browser.close();
    }
}

testScraper('mrbeast');
