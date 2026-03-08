const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const express = require('express');
const cors = require('cors');
const googleTrends = require('google-trends-api');
const puppeteer = require('puppeteer');
const axios = require('axios');

admin.initializeApp();
const db = admin.database();

const app = express();

const allowedOrigins = [
    'https://flamercoal.web.app',
    'https://flamercoal.firebaseapp.com',
    'http://localhost:5173',
    'http://localhost:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

const cyrb53 = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

function formatVolume(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return num.toString();
}

// ==================== KEYWORDS ENDPOINT ====================
app.get('/api/keywords', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Missing query' });

    try {
        let keywordList = [query];
        try {
            const suggUrl = `http://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
            const suggResp = await axios.get(suggUrl);
            const suggData = suggResp.data;
            const suggestions = suggData[1] || [];
            if (suggestions.length > 0) keywordList = suggestions.slice(0, 20);
        } catch (suggErr) {
            logger.warn('Suggest API Warning:', suggErr.message);
        }

        let trendPoints = [];
        let avgInterest = 50;
        try {
            const trendResults = await googleTrends.interestOverTime({ keyword: query });
            const parsedTrends = JSON.parse(trendResults);
            if (parsedTrends.default && parsedTrends.default.timelineData) {
                trendPoints = parsedTrends.default.timelineData.map(t => t.value[0]);
                avgInterest = trendPoints.reduce((a, b) => a + b, 0) / (trendPoints.length || 1);
            }
        } catch (trendErr) {
            logger.warn('Trends API Warning:', trendErr.message);
            trendPoints = Array(12).fill(50);
        }

        const results = keywordList.map((term, index) => {
            const seed = cyrb53(term);
            const rand = (seed % 1000) / 1000;
            let interestBaseline = Math.max(1000, Math.pow(avgInterest, 3) * 2);
            let estimatedVol = Math.floor(interestBaseline * (1 / (index + 1)) * (10 / Math.max(term.length, 5)) * (0.8 + rand * 0.4));
            if (term.toLowerCase() === query.toLowerCase()) estimatedVol = Math.max(estimatedVol, interestBaseline);
            estimatedVol = Math.max(10, estimatedVol > 1000 ? Math.floor(estimatedVol / 100) * 100 : estimatedVol);
            let kd = Math.min(95, Math.max(5, Math.floor(Math.log10(estimatedVol) * 18) - rand * 15));
            const isCommercial = ['buy', 'price', 'cost', 'hire', 'service', 'best', 'software', 'course'].some(w => term.includes(w));
            let cpc = (kd / 25) * (isCommercial ? 2.5 : 0.8) * (0.8 + rand);
            let termTrend = index > 0 ? trendPoints.map(v => Math.max(0, Math.min(100, Math.floor(v * (0.8 + 0.4 * rand))))) : trendPoints;
            return { term, volume: formatVolume(estimatedVol), rawVolume: estimatedVol, kd: Math.floor(kd), cpc: `$${cpc.toFixed(2)}`, trend: termTrend.slice(-7) };
        });

        const totalVolume = results.reduce((acc, r) => acc + r.rawVolume, 0);
        const avgKD = Math.floor(results.reduce((acc, r) => acc + r.kd, 0) / results.length) || 0;
        res.json({
            overview: { volume: formatVolume(totalVolume), difficulty: `${avgKD}/100`, cpc: `$${(avgKD * 0.05).toFixed(2)}`, paidDifficulty: avgKD > 70 ? 'High' : avgKD > 40 ? 'Medium' : 'Low' },
            keywords: results
        });
    } catch (error) {
        logger.error('Server Error:', error);
        res.status(500).json({ error: 'Failed to fetch data', details: error.message });
    }
});

// ==================== COMPETITORS ENDPOINT (Puppeteer) ====================
app.get('/api/competitors', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Missing query' });

    let browser = null;
    try {
        const domainStats = {};
        let rankCounter = 0;
        const blacklist = ['google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com', 'microsoft.com', 'w3.org', 'schema.org'];

        const addDomain = (d) => {
            if (!d) return;
            const clean = d.replace(/^www\./, '').toLowerCase();
            if (clean && clean.includes('.') && !blacklist.some(b => clean === b || clean.endsWith('.' + b))) {
                if (!domainStats[clean]) {
                    domainStats[clean] = { count: 1, firstRank: rankCounter++ };
                } else {
                    domainStats[clean].count++;
                }
            }
        };

        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Bing Search
        await page.goto(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const bingDomains = await page.evaluate(() => {
            const domains = [];
            document.querySelectorAll('li.b_algo').forEach(el => {
                const cite = el.querySelector('cite');
                if (cite) {
                    const text = cite.textContent.trim().replace(/^https?:\/\//, '').split(/[\s\/›>]/)[0];
                    if (text && text.includes('.')) domains.push(text);
                }
                const link = el.querySelector('h2 a');
                if (link && link.href) { try { domains.push(new URL(link.href).hostname); } catch (e) { } }
            });
            return domains;
        });
        bingDomains.forEach(d => addDomain(d));

        await browser.close();
        browser = null;

        const sortedResults = Object.entries(domainStats)
            .map(([domain, stats]) => ({ domain, ...stats }))
            .sort((a, b) => b.count !== a.count ? b.count - a.count : a.firstRank - b.firstRank)
            .slice(0, 5)
            .map(item => ({ domain: item.domain, count: item.count }));

        res.json({ competitors: sortedResults });
    } catch (error) {
        if (browser) await browser.close().catch(() => { });
        res.json({ competitors: [] });
    }
});

// ==================== SITE AUDIT ENDPOINT (Puppeteer) ====================
app.get('/api/audit', async (req, res) => {
    const { url, keyword } = req.query;
    if (!url) return res.status(400).json({ error: 'Missing url' });
    const targetKeyword = keyword ? keyword.toLowerCase() : null;

    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const startTime = Date.now();
        const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
        const loadTime = Date.now() - startTime;
        const httpStatus = response.status();

        const data = await page.evaluate(() => {
            const getMeta = (name) => document.querySelector(`meta[name="${name}"]`)?.content || '';
            const getOG = (prop) => document.querySelector(`meta[property="og:${prop}"]`)?.content || '';
            const bodyText = document.body.innerText;
            const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.innerText.trim()).filter(Boolean);
            const h2s = Array.from(document.querySelectorAll('h2')).map(h => h.innerText.trim()).filter(Boolean);
            const h3s = Array.from(document.querySelectorAll('h3')).map(h => h.innerText.trim()).filter(Boolean);
            const allImages = Array.from(document.querySelectorAll('img')).map(img => ({ alt: img.alt || '', lazy: img.loading === 'lazy' }));
            const hostname = window.location.hostname;
            const links = Array.from(document.querySelectorAll('a')).map(a => a.href);
            const internal = links.filter(l => l.includes(hostname) || l.startsWith('/')).length;
            const external = links.filter(l => l.startsWith('http') && !l.includes(hostname)).length;
            const hasSchema = !!document.querySelector('script[type="application/ld+json"]');

            return {
                title: document.title,
                metaDesc: getMeta('description'),
                bodyText,
                h1s, h2s, h3s,
                imagesWithoutAlt: allImages.filter(img => !img.alt).length,
                internal, external,
                hasSchema,
                htmlSize: document.documentElement.outerHTML.length,
                responsiveMetaTag: !!document.querySelector('meta[name="viewport"]'),
                ogTitle: getOG('title'),
                isNoIndex: (getMeta('robots') || '').toLowerCase().includes('noindex')
            };
        });

        await browser.close();
        browser = null;

        const wordCount = data.bodyText.split(/\s+/).filter(Boolean).length;
        const seoScore = 85; // Simple mock score for now consistent with original

        res.json({
            url,
            score: seoScore,
            details: {
                title: data.title,
                wordCount,
                loadTime: `${(loadTime / 1000).toFixed(2)}s`,
                internalLinks: data.internal,
                externalLinks: data.external,
                hasSchema: data.hasSchema,
                h1s: data.h1s
            }
        });
    } catch (error) {
        if (browser) await browser.close().catch(() => { });
        res.status(500).json({ error: 'Audit Failed', details: error.message });
    }
});

// ==================== POSITION TRACKER ENDPOINT (Puppeteer) ====================
app.post('/api/track-position', async (req, res) => {
    const { keyword, domain, region = 'us' } = req.body;
    if (!keyword || !domain) return res.status(400).json({ error: 'Missing keyword or domain' });

    const cleanDomain = domain.replace(/^www\./, '').toLowerCase();

    let browser = null;
    try {
        const puppeteerExtra = require('puppeteer-extra');
        const StealthPlugin = require('puppeteer-extra-plugin-stealth');
        puppeteerExtra.use(StealthPlugin());

        browser = await puppeteerExtra.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const page = await browser.newPage();
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&num=50`;
        await page.goto(googleUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const googleResults = await page.evaluate(() => {
            const items = [];
            document.querySelectorAll('div.g').forEach(el => {
                const linkEl = el.querySelector('a[href^="http"]');
                if (linkEl) {
                    try { items.push(new URL(linkEl.href).hostname.replace(/^www\./, '').toLowerCase()); } catch (e) { }
                }
            });
            return items;
        });

        let rank = null;
        for (let i = 0; i < googleResults.length; i++) {
            if (googleResults[i].includes(cleanDomain)) {
                rank = i + 1;
                break;
            }
        }

        await browser.close();
        res.json({ keyword, domain, rank });
    } catch (error) {
        if (browser) await browser.close().catch(() => { });
        res.status(500).json({ error: 'Tracking failed', details: error.message });
    }
});

// ==================== OXAPAY PAYMENT INTEGRATION ====================
app.post('/api/payments/create-invoice', async (req, res) => {
    const { amount, currency, description, orderId, email } = req.body;
    if (!amount || !currency) return res.status(400).json({ error: 'Amount and currency are required' });

    try {
        const payload = {
            amount: amount,
            currency: currency || 'USD',
            lifetime: 60,
            callback_url: 'https://flamercoal.web.app/api/payments/callback', // Point to hosting rewrite
            return_url: 'https://flamercoal.web.app/success',
            description: description || 'Flamercoal Pack',
            order_id: `COAL_${amount}_${orderId}`,
            email: email || ''
        };

        const responseData = await axios.post('https://api.oxapay.com/v1/payment/invoice', payload, {
            headers: {
                'Content-Type': 'application/json',
                'merchant_api_key': process.env.OXAPAY_MERCHANT_KEY
            }
        });

        if (responseData.data.status === 200) {
            res.json({ success: true, payUrl: responseData.data.payUrl });
        } else {
            res.status(500).json({ error: 'Oxapay error', details: responseData.data.message });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/payments/callback', async (req, res) => {
    const data = req.body;
    try {
        if (data.status === 'paid' || data.status === 'confirmed') {
            const parts = data.orderId.split('_');
            if (parts[0] === 'COAL') {
                const coalAmount = parseInt(parts[1]);
                const userId = parts[3];
                if (userId && coalAmount) {
                    const userRef = db.ref(`users/${userId}/powers`);
                    await userRef.transaction((current) => (current || 0) + coalAmount);
                    await db.ref(`transactions/${data.trackId}`).set({
                        userId, amount: coalAmount, timestamp: Date.now()
                    });
                }
            }
        }
    } catch (error) {
        logger.error('IPN Error:', error);
    }
    res.sendStatus(200);
});

// Export the Express app as a Cloud Function
exports.api = onRequest({
    memory: "2GiB",
    timeoutSeconds: 300,
    secrets: ["OXAPAY_MERCHANT_KEY"]
}, app);
