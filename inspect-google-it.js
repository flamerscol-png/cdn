const puppeteer = require('puppeteer');

async function testDDG(keyword, targetDomain) {
    console.log(`\n--- TESTING DUCKDUCKGO FOR: "${keyword}" ---`);
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

    try {
        await page.goto(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(keyword)}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000));

        const results = await page.evaluate(() => {
            const items = [];
            document.querySelectorAll('.result').forEach(el => {
                const linkEl = el.querySelector('a.result__a');
                if (linkEl && linkEl.href) {
                    let href = linkEl.href;
                    try {
                        const url = new URL(href);
                        const uddg = url.searchParams.get('uddg');
                        if (uddg) href = decodeURIComponent(uddg);
                    } catch (e) { }

                    let dom = '';
                    try { dom = new URL(href).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { }

                    if (dom && dom.includes('.') && !dom.includes('duckduckgo.com')) {
                        items.push({ url: href, domain: dom, title: linkEl.textContent.trim() });
                    }
                }
            });
            return items;
        });

        console.log(`Found ${results.length} results:`);
        results.forEach((r, i) => {
            console.log(`[${i + 1}] ${r.domain} | ${r.title}`);
        });

        const cleanDomain = targetDomain.replace(/^www\./, '').toLowerCase();
        let rank = null;
        for (let i = 0; i < results.length; i++) {
            const resultDomain = results[i].domain;
            // Existing logic
            const currentMatch = resultDomain.includes(cleanDomain) || cleanDomain.includes(resultDomain);

            // Proposed logic
            const proposedMatch = resultDomain === cleanDomain ||
                resultDomain.endsWith('.' + cleanDomain) ||
                cleanDomain.endsWith('.' + resultDomain);

            if (currentMatch) {
                console.log(`\nMATCH FOUND AT RANK ${i + 1} (Current Logic): ${resultDomain}`);
            }
            if (proposedMatch) {
                console.log(`MATCH FOUND AT RANK ${i + 1} (Proposed Logic): ${resultDomain}`);
            }

            if (currentMatch && !rank) rank = i + 1;
        }

        if (!rank) console.log('\nNO MATCH FOUND');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await browser.close();
    }
}

testDDG('editorvault', 'editorvault.web.app').then(() => {
    return testDDG('pizza', 'dominos.com');
});
