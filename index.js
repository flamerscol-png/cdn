require('dotenv').config();
const express = require('express');
const cors = require('cors');
const googleTrends = require('google-trends-api');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3001;

console.log("🚀 Server Starting...");
console.log(`📂 Working Directory: ${process.cwd()}`);
console.log(`🔧 Puppeteer Executable Path (ENV): ${process.env.PUPPETEER_EXECUTABLE_PATH || 'Not Set'}`);
console.log(`🔧 Node Version: ${process.version}`);

// Initialize Firebase Admin (Optional: Required for auto-credits)
let admin, db;
try {
    admin = require("firebase-admin");
    let serviceAccount;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
        try {
            serviceAccount = require("./serviceAccountKey.json");
        } catch (fileErr) {
            console.warn("⚠️ serviceAccountKey.json not found, checking environment...");
        }
    }

    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://flamercoal-default-rtdb.firebaseio.com"
        });
        db = admin.database();
        console.log("✅ Firebase Admin Initialized");
    } else {
        throw new Error("No service account credentials found");
    }
} catch (e) {
    console.warn("⚠️ Firebase Admin NOT initialized. Auto-credits disabled. Reason:", e.message);
}
const allowedOrigins = [
    'https://flamercoal.web.app',
    'https://flamercoal.firebaseapp.com',
    'http://localhost:5173',
    'http://localhost:3000'
];

app.use(cors());
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

function extractDomain(urlStr) {
    try { return new URL(urlStr).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { return null; }
}

// ==================== KEYWORDS ENDPOINT ====================
app.get('/api/keywords', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Missing query' });
    console.log(`🔍 Searching for: ${query}`);

    try {
        let keywordList = [query];
        try {
            const suggUrl = `http://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
            const suggResp = await fetch(suggUrl);
            const suggData = await suggResp.json();
            const suggestions = suggData[1] || [];
            if (suggestions.length > 0) keywordList = suggestions.slice(0, 20);
        } catch (suggErr) {
            console.error('Suggest API Warning:', suggErr.message);
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
            console.error('Trends API Warning:', trendErr.message);
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
        console.error('Server Error:', error);
        res.status(500).json({ error: 'Failed to fetch data', details: error.message });
    }
});

// ==================== COMPETITORS ENDPOINT (Puppeteer) ====================
app.get('/api/competitors', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Missing query' });
    console.log(`⚔️  Analyzing Competitors for: ${query}`);

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

        const launchOptions = {
            headless: 'new',
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        };

        browser = await puppeteer.launch(launchOptions);

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1280, height: 800 });

        try {
            console.log('  🌐 Bing Search...');
            await page.goto(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, {
                waitUntil: 'domcontentloaded',
                timeout: 15000
            });
            await page.waitForSelector('li.b_algo', { timeout: 8000 }).catch(() => { });

            const bingDomains = await page.evaluate(() => {
                const domains = [];
                document.querySelectorAll('li.b_algo').forEach(el => {
                    const cite = el.querySelector('cite');
                    if (cite) {
                        const text = cite.textContent.trim().replace(/^https?:\/\//, '').split(/[\s\/›>]/)[0];
                        if (text && text.includes('.')) domains.push(text);
                    }
                    const link = el.querySelector('h2 a');
                    if (link && link.href) {
                        try { domains.push(new URL(link.href).hostname); } catch (e) { }
                    }
                });
                return domains;
            });
            bingDomains.forEach(d => addDomain(d));
            console.log(`  ✅ Bing: ${bingDomains.length} links → ${Object.keys(domainStats).length} unique domains`);
        } catch (err) { console.warn('  ❌ Bing:', err.message); }

        if (Object.keys(domainStats).length < 5) {
            try {
                console.log('  🌐 DuckDuckGo Search...');
                await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
                    waitUntil: 'networkidle2',
                    timeout: 15000
                });
                await new Promise(r => setTimeout(r, 2000));

                const ddgDomains = await page.evaluate(() => {
                    const domains = [];
                    const links = document.querySelectorAll('a[data-testid="result-title-a"], .result__a, article a[href]');
                    links.forEach(el => {
                        if (el.href && el.href.startsWith('http') && !el.href.includes('duckduckgo')) {
                            try { domains.push(new URL(el.href).hostname); } catch (e) { }
                        }
                    });
                    return domains;
                });
                ddgDomains.forEach(d => addDomain(d));
                console.log(`  ✅ DDG: ${ddgDomains.length} links → total ${Object.keys(domainStats).length} unique domains`);
            } catch (err) { console.warn('  ❌ DDG:', err.message); }
        }

        await browser.close();
        browser = null;

        const sortedResults = Object.entries(domainStats)
            .map(([domain, stats]) => ({ domain, ...stats }))
            .sort((a, b) => {
                if (b.count !== a.count) return b.count - a.count;
                return a.firstRank - b.firstRank;
            })
            .slice(0, 5)
            .map(item => ({ domain: item.domain, count: item.count }));

        console.log('✅ Top Competitors:', sortedResults.map(d => d.domain));
        res.json({ competitors: sortedResults });

    } catch (error) {
        console.error('Competitor Error:', error.message);
        if (browser) await browser.close().catch(() => { });
        res.json({ competitors: [] });
    }
});

// ==================== SITE AUDIT ENDPOINT (Cheerio + Axios) ====================
app.get('/api/audit', async (req, res) => {
    const { url, keyword } = req.query;
    if (!url) return res.status(400).json({ error: 'Missing url' });
    const targetKeyword = keyword ? keyword.toLowerCase() : null;

    console.log(`🛡️  Auditing Site: ${url} | Keyword: ${targetKeyword || '(none)'}`);

    try {
        const axios = require('axios');
        const cheerio = require('cheerio');

        const startTime = Date.now();
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 30000, // 30 seconds
            validateStatus: () => true // Resolve all HTTP statuses
        });

        const loadTime = Date.now() - startTime;
        const httpStatus = response.status;
        const html = response.data;
        const $ = cheerio.load(html);

        const getMeta = (name) => $(`meta[name="${name}"]`).attr('content') || '';
        const getOG = (prop) => $(`meta[property="og:${prop}"]`).attr('content') || '';

        // Text
        const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
        const paragraphs = $('p').map((i, el) => $(el).text().trim()).get().filter(Boolean);
        const firstPara = paragraphs[0] || '';

        // Headings
        const h1s = $('h1').map((i, el) => $(el).text().trim()).get().filter(Boolean);
        const h2s = $('h2').map((i, el) => $(el).text().trim()).get().filter(Boolean);
        const h3s = $('h3').map((i, el) => $(el).text().trim()).get().filter(Boolean);

        // Images
        const allImages = $('img').map((i, el) => ({
            src: $(el).attr('src') || '',
            alt: $(el).attr('alt') ? $(el).attr('alt').trim() : '',
            lazy: $(el).attr('loading') === 'lazy'
        })).get();

        const imagesWithoutAlt = allImages.filter(img => !img.alt).length;
        const lazyImages = allImages.filter(img => img.lazy).length;

        // Links
        let hostname = '';
        try { hostname = new URL(url).hostname; } catch (e) { }

        const links = $('a').map((i, el) => $(el).attr('href')).get().filter(Boolean);
        const internal = links.filter(l => l.includes(hostname) || l.startsWith('/')).length;
        const external = links.filter(l => l.startsWith('http') && !l.includes(hostname)).length;

        // Schema
        const schemaTypes = [];
        let hasSchema = false;
        $('script[type="application/ld+json"]').each((i, el) => {
            try {
                const s = JSON.parse($(el).html());
                hasSchema = true;
                if (s['@graph']) {
                    s['@graph'].forEach(item => { if (item['@type']) schemaTypes.push(item['@type']); });
                } else if (s['@type']) {
                    schemaTypes.push(s['@type']);
                }
            } catch (e) { }
        });

        // Responsive viewport
        const responsiveMetaTag = !!$('meta[name="viewport"]').length;

        // ── TECHNICAL SIGNALS ──
        const ogTitle = getOG('title');
        const ogDescription = getOG('description');
        const ogImage = getOG('image');
        const twitterCard = getMeta('twitter:card');
        const htmlLang = $('html').attr('lang') || '';
        const hasFavicon = !!(
            $('link[rel="icon"]').length ||
            $('link[rel="shortcut icon"]').length ||
            $('link[rel="apple-touch-icon"]').length
        );

        const robotsMeta = getMeta('robots');
        const isNoIndex = robotsMeta.toLowerCase().includes('noindex');
        const hasSitemapLink = !!$('link[rel="sitemap"]').length;

        const data = {
            title: $('title').text(),
            metaDesc: getMeta('description'),
            canonical: $('link[rel="canonical"]').attr('href') || '',
            bodyText,
            firstPara,
            h1s, h2s, h3s,
            allImages,
            imagesWithoutAlt,
            lazyImages,
            internal,
            external,
            schemaTypes: [...new Set(schemaTypes.flat())],
            hasSchema,
            htmlSize: Buffer.byteLength(html, 'utf8'),
            responsiveMetaTag,
            ogTitle, ogDescription, ogImage,
            twitterCard,
            htmlLang,
            hasFavicon,
            isNoIndex,
            hasSitemapLink
        };

        // ─────────────── ANALYSIS ───────────────
        const content = data.bodyText;
        const wordCount = content.split(/\s+/).filter(Boolean).length;
        const issues = [];

        const pageSizeKB = Math.round(data.htmlSize / 1024);
        const loadTimeSec = (loadTime / 1000).toFixed(2);

        // ── 1. PERFORMANCE SCORE (0-100) ──
        let performanceScore = 100;
        if (loadTime > 5000) { performanceScore -= 40; issues.push({ type: 'error', msg: `Slow page load: ${loadTimeSec}s (target < 2.5s)` }); }
        else if (loadTime > 2500) { performanceScore -= 20; issues.push({ type: 'warning', msg: `Page load time is ${loadTimeSec}s (target < 2.5s)` }); }
        else if (loadTime > 1500) { performanceScore -= 5; }
        if (pageSizeKB > 500) { performanceScore -= 20; issues.push({ type: 'warning', msg: `Page HTML size is large: ${pageSizeKB} KB. Minify and compress.` }); }
        else if (pageSizeKB > 200) { performanceScore -= 10; }
        if (!data.responsiveMetaTag) { performanceScore -= 15; issues.push({ type: 'error', msg: 'No viewport meta tag found — page may not be mobile-friendly.' }); }
        performanceScore = Math.max(0, performanceScore);

        // ── 2. CONTENT SCORE (0-100) ──
        let contentScore = 100;

        // Readability (Flesch-Kincaid)
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 5).length || 1;
        const syllables = content.split(/[aeiouy]+/i).length;
        const fkScore = 206.835 - (1.015 * (wordCount / sentences)) - (84.6 * (syllables / wordCount));
        const readability = fkScore > 60 ? 'Good' : fkScore > 30 ? 'Moderate' : 'Poor';
        if (readability === 'Poor') { contentScore -= 20; issues.push({ type: 'warning', msg: 'Content readability is Poor (low Flesch-Kincaid score). Simplify sentences.' }); }
        else if (readability === 'Moderate') { contentScore -= 5; issues.push({ type: 'info', msg: 'Content readability is Moderate. Aim for shorter sentences.' }); }

        // Word count / topic coverage
        if (wordCount < 300) { contentScore -= 30; issues.push({ type: 'error', msg: `Very thin content (${wordCount} words). Minimum 600 words recommended.` }); }
        else if (wordCount < 600) { contentScore -= 15; issues.push({ type: 'warning', msg: `Content is thin (${wordCount} words). Aim for 600+ words for topic coverage.` }); }

        // Passive voice
        const passiveMatches = (content.match(/\b(is|are|was|were|be|been|being)\s\w+ed\b/gi) || []).length;
        const passiveRatio = passiveMatches / sentences;
        if (passiveRatio > 0.4) { contentScore -= 15; issues.push({ type: 'warning', msg: `High passive voice usage (${(passiveRatio * 100).toFixed(0)}%). Use active voice.` }); }

        // User-first language
        const youCount = (content.match(/\byou\b/gi) || []).length;
        if (youCount < 3 && wordCount > 300) { contentScore -= 5; issues.push({ type: 'info', msg: 'Low "you" usage — consider more user-focused language.' }); }

        contentScore = Math.max(0, contentScore);

        // ── 3. ON-PAGE SEO SCORE (0-100) ──
        let seoScore = 100;

        // Title checks
        const titleLen = data.title.length;
        if (!data.title) { seoScore -= 20; issues.push({ type: 'error', msg: 'Page has no title tag.' }); }
        else if (titleLen < 30) { seoScore -= 10; issues.push({ type: 'warning', msg: `Title tag is too short (${titleLen} chars). Aim for 50–60 chars.` }); }
        else if (titleLen > 60) { seoScore -= 5; issues.push({ type: 'info', msg: `Title tag is long (${titleLen} chars). Keep it under 60 chars to avoid truncation.` }); }

        // Meta description
        const metaLen = data.metaDesc.length;
        if (!data.metaDesc) { seoScore -= 15; issues.push({ type: 'error', msg: 'No meta description found. Write a compelling 120–160 char description.' }); }
        else if (metaLen < 50) { seoScore -= 10; issues.push({ type: 'warning', msg: `Meta description too short (${metaLen} chars). Aim for 120–160 chars.` }); }
        else if (metaLen > 160) { seoScore -= 5; issues.push({ type: 'info', msg: `Meta description too long (${metaLen} chars). May be truncated in search results.` }); }

        // H1 checks
        if (data.h1s.length === 0) { seoScore -= 15; issues.push({ type: 'error', msg: 'No H1 heading found. Every page needs exactly one H1.' }); }
        else if (data.h1s.length > 1) { seoScore -= 10; issues.push({ type: 'warning', msg: `Multiple H1 tags found (${data.h1s.length}). Use only one H1 per page.` }); }

        // H2 checks
        if (data.h2s.length === 0) { seoScore -= 5; issues.push({ type: 'warning', msg: 'No H2 headings found. Add H2s to structure your content.' }); }

        // Canonical intentionally not checked (no duplicate content on this site)

        // Images alt
        if (data.imagesWithoutAlt > 0) {
            seoScore -= Math.min(10, data.imagesWithoutAlt * 2);
            issues.push({ type: 'warning', msg: `${data.imagesWithoutAlt} image(s) are missing alt text — important for accessibility & image SEO.` });
        }

        // Keyword-specific checks
        const kwCheck = { title: false, h1: false, firstPara: false, h2: false, alt: false, density: 0 };
        if (targetKeyword) {
            kwCheck.title = data.title.toLowerCase().includes(targetKeyword);
            if (!kwCheck.title) { seoScore -= 10; issues.push({ type: 'error', msg: `Keyword "${targetKeyword}" not found in Title tag.` }); }

            kwCheck.h1 = data.h1s.some(h => h.toLowerCase().includes(targetKeyword));
            if (!kwCheck.h1) { seoScore -= 5; issues.push({ type: 'warning', msg: `Keyword "${targetKeyword}" not found in H1.` }); }

            kwCheck.firstPara = data.firstPara.toLowerCase().includes(targetKeyword);
            if (!kwCheck.firstPara) { seoScore -= 5; issues.push({ type: 'warning', msg: `Keyword "${targetKeyword}" not found in first paragraph.` }); }

            kwCheck.h2 = data.h2s.some(h => h.toLowerCase().includes(targetKeyword));
            if (!kwCheck.h2) { seoScore -= 3; issues.push({ type: 'info', msg: `Keyword "${targetKeyword}" not found in any H2 heading.` }); }

            kwCheck.alt = data.allImages.some(img => img.alt.toLowerCase().includes(targetKeyword));
            if (!kwCheck.alt && data.allImages.length > 0) { seoScore -= 3; issues.push({ type: 'info', msg: `Keyword "${targetKeyword}" not found in any image alt text.` }); }

            const kwCount = (content.toLowerCase().match(new RegExp(targetKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
            kwCheck.density = wordCount > 0 ? (kwCount / wordCount) * 100 : 0;
            if (kwCheck.density < 0.5) { seoScore -= 5; issues.push({ type: 'warning', msg: `Keyword density is low (${kwCheck.density.toFixed(2)}%). Aim for 1–2%.` }); }
            if (kwCheck.density > 3.5) { seoScore -= 5; issues.push({ type: 'warning', msg: `Keyword density is high (${kwCheck.density.toFixed(2)}%). Risk of keyword stuffing.` }); }
        } else {
            issues.push({ type: 'info', msg: 'No target keyword provided — keyword placement checks skipped.' });
        }

        seoScore = Math.max(0, seoScore);

        // ── 4. TECHNICAL SCORE (0-100) ──
        let technicalScore = 100;
        const isHTTPS = url.startsWith('https://');
        if (!isHTTPS) { technicalScore -= 10; issues.push({ type: 'error', msg: 'Site is not using HTTPS. This harms rankings and trust.' }); }
        if (!data.hasSchema) { technicalScore -= 20; issues.push({ type: 'error', msg: 'No Schema.org JSON-LD found. Add structured data for rich results.' }); }
        if (data.internal === 0) { technicalScore -= 8; issues.push({ type: 'error', msg: 'No internal links found. Internal linking distributes PageRank and aids crawlability.' }); }
        else if (data.internal < 3) { technicalScore -= 4; issues.push({ type: 'warning', msg: `Only ${data.internal} internal link(s) found. Aim for at least 3-5 per page.` }); }
        if (data.external === 0) { technicalScore -= 5; issues.push({ type: 'warning', msg: 'No external links. Citing authoritative sources improves trust signals.' }); }
        if (httpStatus !== 200) { technicalScore -= 10; issues.push({ type: 'error', msg: `Page returned HTTP ${httpStatus}. Expected 200 OK.` }); }

        // OG/Twitter
        let ogDeduct = 0;
        if (!data.ogTitle) ogDeduct += 4;
        if (!data.ogDescription) ogDeduct += 3;
        if (!data.ogImage) ogDeduct += 3;
        if (ogDeduct > 0) {
            technicalScore -= ogDeduct;
            issues.push({ type: 'warning', msg: `Missing some Open Graph tags. Required for social sharing previews.` });
        }
        if (!data.twitterCard) { technicalScore -= 5; issues.push({ type: 'warning', msg: 'No Twitter Card meta tag found.' }); }
        if (!data.htmlLang) { technicalScore -= 5; issues.push({ type: 'warning', msg: 'Missing lang attribute on <html> tag.' }); }
        if (!data.hasFavicon) { technicalScore -= 5; issues.push({ type: 'warning', msg: 'No favicon found.' }); }
        if (data.isNoIndex) { technicalScore -= 20; issues.push({ type: 'error', msg: 'Page has "noindex" — blocked from Google!' }); }

        technicalScore = Math.max(0, technicalScore);


        // ── 6. DUPLICATE CONTENT CHECK ──
        const contentToCodeRatio = (data.bodyText.length / data.htmlSize) * 100;
        let duplicateSignal = false;
        if (contentToCodeRatio < 10 && wordCount < 200) {
            duplicateSignal = true;
            issues.push({ type: 'warning', msg: 'High risk of duplicate/thin content signal (low text-to-code ratio).' });
        }

        // ── OVERALL SCORE (weighted average) ──
        const overallScore = Math.round(
            (performanceScore * 0.2) +
            (contentScore * 0.2) +
            (seoScore * 0.35) +
            (technicalScore * 0.25)
        );

        const technicalDetails = {
            isHTTPS,
            ogTitle: !!data.ogTitle,
            ogDescription: !!data.ogDescription,
            ogImage: !!data.ogImage,
            twitterCard: !!data.twitterCard,
            htmlLang: data.htmlLang || null,
            hasFavicon: data.hasFavicon,
            isNoIndex: data.isNoIndex,
            lazyImages: data.lazyImages,
            totalImages: data.allImages.length,
            hasSitemapLink: data.hasSitemapLink
        };

        res.json({
            url,
            keyword: targetKeyword,
            httpStatus,
            score: overallScore,
            metrics: {
                performance: performanceScore,
                seo: seoScore,
                content: contentScore,
                technical: technicalScore
            },
            details: {
                title: data.title,
                titleLength: data.title.length,
                metaDescription: data.metaDesc,
                metaLength: data.metaDesc.length,
                canonical: data.canonical,
                wordCount,
                readability,
                passiveVoiceRatio: `${(passiveRatio * 100).toFixed(1)}%`,
                loadTime: `${loadTimeSec}s`,
                loadTimeMs: loadTime,
                pageSize: `${pageSizeKB} KB`,
                pageSizeKB,
                internalLinks: data.internal,
                externalLinks: data.external,
                totalImages: data.allImages.length,
                imagesWithoutAlt: data.imagesWithoutAlt,
                schemaTypes: data.schemaTypes,
                hasSchema: data.hasSchema,
                responsiveMetaTag: data.responsiveMetaTag,
                h1s: data.h1s,
                h2s: data.h2s,
                h3s: data.h3s,
                keywordStats: kwCheck,
                technicalDetails,
                duplicateRisk: duplicateSignal
            },
            issues
        });

    } catch (error) {
        try { if (browser) await browser.close(); } catch (_) { }
        console.error('Audit Error:', error.message);
        return res.status(500).json({ error: 'Audit Failed', details: error.message });
    }
});



// ==================== POSITION TRACKER ENDPOINT (Puppeteer Stealth + Google) ====================
app.post('/api/track-position', async (req, res) => {
    const { keyword, domain, region = 'us' } = req.body;
    if (!keyword || !domain) return res.status(400).json({ error: 'Missing keyword or domain' });

    console.log(`🎯 Tracking position for "${keyword}" | domain: ${domain} | region: ${region}`);

    const cleanDomain = domain.replace(/^www\./, '').toLowerCase();

    // Region to Google TLD and parameters
    const regionConfig = {
        'us': { tld: 'com', gl: 'us', hl: 'en' },
        'in': { tld: 'co.in', gl: 'in', hl: 'en' },
        'uk': { tld: 'co.uk', gl: 'uk', hl: 'en' },
        'ca': { tld: 'ca', gl: 'ca', hl: 'en' },
        'au': { tld: 'com.au', gl: 'au', hl: 'en' }
    };

    const config = regionConfig[region] || regionConfig['us'];
    let allResults = [];

    const isDomainMatch = (target, result) => {
        if (!target || !result) return false;
        const t = target.toLowerCase().replace(/^www\./, '');
        const r = result.toLowerCase().replace(/^www\./, '');
        // Exact match or subdomain match
        return r === t || r.endsWith('.' + t) || t.endsWith('.' + r);
    };

    try {
        // STRATEGY 1: Puppeteer Stealth (Headless)
        console.log(`  🔍 Searching Google ${config.tld.toUpperCase()} (Headless Stealth)...`);
        const puppeteerExtra = require('puppeteer-extra');
        const StealthPlugin = require('puppeteer-extra-plugin-stealth');
        puppeteerExtra.use(StealthPlugin());

        const launchOptions = {
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        };

        const browser = await puppeteerExtra.launch(launchOptions);

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

        try {
            // Use localized Google URL
            const googleUrl = `https://www.google.${config.tld}/search?q=${encodeURIComponent(keyword)}&gl=${config.gl}&hl=${config.hl}&num=50`;
            await page.goto(googleUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, 3000));

            const googleResults = await page.evaluate(() => {
                const items = [];
                document.querySelectorAll('div.g, div[data-sokoban-container]').forEach(el => {
                    const linkEl = el.querySelector('a[href^="http"]');
                    if (!linkEl) return;

                    const href = linkEl.href;
                    let dom = '';
                    try { dom = new URL(href).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { }

                    if (dom && dom.includes('.') && (!dom.includes('google.') || dom.includes('sites.google'))) {
                        const titleEl = el.querySelector('h3');
                        items.push({
                            url: href,
                            domain: dom,
                            title: titleEl ? titleEl.textContent.trim() : linkEl.textContent.trim()
                        });
                    }
                });
                return items;
            });

            if (googleResults.length > 0) {
                allResults = googleResults;
                console.log(`  ✅ Google returned ${allResults.length} results.`);
            }
        } catch (e) {
            console.warn(`  ⚠️ Google scraper failed: ${e.message}`);
        } finally {
            await browser.close();
        }

        // STRATEGY 2: DuckDuckGo Fallback (if Google fails)
        if (allResults.length === 0) {
            console.log(`  ⚠️ Google failed or blocked. Trying DuckDuckGo...`);
            const browser = await puppeteerExtra.launch({ headless: true, args: ['--no-sandbox'] });
            const page = await browser.newPage();
            try {
                await page.goto(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(keyword)}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
                allResults = await page.evaluate(() => {
                    const items = [];
                    document.querySelectorAll('.result').forEach(el => {
                        const linkEl = el.querySelector('a.result__a');
                        if (linkEl && linkEl.href) {
                            let href = linkEl.href;
                            try { const uddg = new URL(href).searchParams.get('uddg'); if (uddg) href = decodeURIComponent(uddg); } catch (e) { }
                            let dom = '';
                            try { dom = new URL(href).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { }
                            if (dom && dom.includes('.') && !dom.includes('duckduckgo.com')) {
                                items.push({ url: href, domain: dom, title: linkEl.textContent.trim() });
                            }
                        }
                    });
                    return items;
                });
                console.log(`  ✅ DuckDuckGo returned ${allResults.length} results.`);
            } catch (err) {
                console.warn(`  ❌ DuckDuckGo also failed.`);
            } finally {
                await browser.close();
            }
        }

        if (allResults.length === 0) {
            throw new Error('All search engines failed. Please try again in a few minutes.');
        }

        // Remove duplicates
        const seen = new Set();
        allResults = allResults.filter(r => {
            if (seen.has(r.domain)) return false;
            seen.add(r.domain);
            return true;
        });

        // Find the ranking with TIGHT MATCHING
        let rank = null;
        for (let i = 0; i < allResults.length; i++) {
            if (isDomainMatch(cleanDomain, allResults[i].domain)) {
                rank = i + 1;
                break;
            }
        }

        const competitors = allResults
            .filter(r => !isDomainMatch(cleanDomain, r.domain))
            .slice(0, 10)
            .map(r => ({ domain: r.domain, url: r.url, title: r.title }));

        console.log(`  🏆 Final Rank: ${rank || 'Not Found'}`);

        res.json({
            keyword,
            domain: cleanDomain,
            region,
            rank,
            totalResults: allResults.length,
            competitors
        });
    } catch (error) {
        console.error('Position Tracker Error:', error.message);
        res.status(500).json({ error: 'Position tracking failed', details: error.message });
    }
});

// ==================== AUTHORITY CHECKER ENDPOINT (Mock + Signals) ====================
app.get('/api/authority', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'Missing url' });

    try {
        const host = extractDomain(url);
        const isCommon = host.endsWith('.com') || host.endsWith('.org') || host.endsWith('.net');
        const dr = Math.min(94, Math.floor((100 / host.length) * (isCommon ? 1.4 : 1.1) + Math.random() * 20));

        res.json({
            url,
            domainRating: dr,
            pageAuthority: Math.max(10, dr - Math.floor(Math.random() * 8)),
            spamScore: `${Math.floor(Math.random() * 6)}%`,
            backlinksCount: Math.floor(dr * Math.random() * 100),
            referringDomains: Math.floor(dr * Math.random() * 20)
        });
    } catch (error) {
        res.status(500).json({ error: 'Authority check failed' });
    }
});

// ==================== BACKLINK MONITOR ENDPOINT (Search-based discovery) ====================
app.get('/api/backlinks', async (req, res) => {
    const { domain } = req.query;
    if (!domain) return res.status(400).json({ error: 'Missing domain' });

    console.log(`🔗 Monitoring Backlinks for: ${domain}`);

    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();

        // Strategy: Search for the domain as a string to find mentions/links
        const searchUrl = `https://www.bing.com/search?q=%22${encodeURIComponent(domain)}%22+-site%3A${encodeURIComponent(domain)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

        const mentions = await page.evaluate((targetDomain) => {
            const results = [];
            document.querySelectorAll('li.b_algo h2 a').forEach(el => {
                try {
                    const url = new URL(el.href);
                    if (!url.hostname.includes(targetDomain)) {
                        results.push({
                            source: url.hostname,
                            targetUrl: el.href,
                            title: el.innerText.trim(),
                            type: Math.random() > 0.5 ? 'Content' : 'Directory',
                            status: 'New'
                        });
                    }
                } catch (e) { }
            });
            return results;
        }, domain);

        await browser.close();
        res.json({ domain, backlinks: mentions.slice(0, 15) });
    } catch (error) {
        if (browser) await browser.close();
        res.status(500).json({ error: 'Backlink scan failed' });
    }
});

// ==================== VIEWSTATS SCRAPER ENDPOINT (Real Browser - Cloudflare Bypass) ====================
// ==================== YOUTUBE STRATEGY ENGINE ====================
const YOUTUBE_API_KEY = (process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_DATA_API_KEY || process.env.YOUTUBE_DATA_API_KEY || "").trim();
const GROQ_API_KEY = (process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || "").trim();

console.log("🛠️  Backend API Key Check:");
console.log(`  - YouTube Key: ${YOUTUBE_API_KEY ? "Present (Starts with: " + YOUTUBE_API_KEY.substring(0, 5) + "...)" : "MISSING"}`);
console.log(`  - Groq Key: ${GROQ_API_KEY ? "Present (Starts with: " + GROQ_API_KEY.substring(0, 5) + "...)" : "MISSING"}`);

if (!YOUTUBE_API_KEY) console.error("⚠️ WARNING: Missing YouTube API Key in server environment!");
if (!GROQ_API_KEY) console.error("⚠️ WARNING: Missing Groq API Key in server environment!");
// --- KEEP ALIVE ENDPOINT ---
// Used to prevent Render free tier from sleeping
app.get('/api/keep-alive', (req, res) => {
    console.log("🟢 Keep-alive ping received");
    res.status(200).send('Backend is awake and ready');
});

// ─── ROBUST VIEWSTATS SCRAPER ───
async function getViewStatsData(handle) {
    const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
    const { connect } = require('puppeteer-real-browser');
    let browser = null;
    let retries = 2;

    while (retries >= 0) {
        try {
            console.log(`  🚀 Scraper: Launching Real Browser for ${handle} (ViewStats)...`);
            const puppeteer = require('puppeteer');
            const defaultExePath = puppeteer.executablePath();
            const exePath = process.env.PUPPETEER_EXECUTABLE_PATH || defaultExePath;
            console.log(`  🔍 Scraper Info: Default Exe: ${defaultExePath} | Using Exe: ${exePath}`);

            const connectOptions = {
                headless: 'auto',
                turnstile: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
                customConfig: {},
                connectOption: {
                    defaultViewport: null,
                    executablePath: exePath
                },
            };

            let response;
            try {
                response = await connect(connectOptions);
            } catch (launchError) {
                console.error("  ❌ Real Browser Launch Failed:", launchError.message);
                const puppeteerExtra = require('puppeteer-extra');
                const StealthPlugin = require('puppeteer-extra-plugin-stealth');
                if (!puppeteerExtra.getPlugins().some(p => p.name === 'stealth')) puppeteerExtra.use(StealthPlugin());

                const browserInstance = await puppeteerExtra.launch({
                    headless: true,
                    executablePath: exePath,
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
                });
                const pageInstance = await browserInstance.newPage();
                response = { browser: browserInstance, page: pageInstance };
            }

            browser = response.browser;
            const page = response.page;
            const vsUrl = `https://www.viewstats.com/channels/${cleanHandle}`;

            console.log(`  🌐 Scraper: Navigating to ${vsUrl}`);
            await page.goto(vsUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
            await new Promise(r => setTimeout(r, 12000));

            const pageData = await page.evaluate(() => {
                const title = document.title;
                const text = document.body.innerText;

                // Helper to find stats in the grid
                const findStat = (label) => {
                    const divs = Array.from(document.querySelectorAll('div'));
                    const target = divs.find(d => d.innerText.trim() === label);
                    if (target && target.nextElementSibling) return target.nextElementSibling.innerText.trim();
                    if (target && target.parentElement) {
                        const siblings = Array.from(target.parentElement.children);
                        const idx = siblings.indexOf(target);
                        return siblings[idx + 1]?.innerText.trim() || null;
                    }
                    return null;
                };

                return {
                    title,
                    subs28d: findStat('Subscribers') || findStat('Subs Change'),
                    views28d: findStat('Views (Last 28 Days)') || findStat('Views Change'),
                    earningsMonthly: findStat('Estimated Earnings') || findStat('Monthly Estimated Earnings'),
                    uploads: findStat('Uploads'),
                    country: findStat('Country'),
                    channelType: findStat('Category') || findStat('Channel Type'),
                    created: findStat('User Created'),
                    subRank: findStat('Subscriber Rank'),
                    viewRank: findStat('Video Views Rank')
                };
            });

            await browser.close();
            browser = null;

            if (pageData.title.includes('Just a moment') || pageData.title.includes('Cloudflare')) {
                console.log("  ❌ Scraper: Blocked by Cloudflare");
                retries--;
                continue;
            }

            const result = {
                grade: "A", // ViewStats doesn't show a large letter grade like SB
                uploads: pageData.uploads,
                country: pageData.country,
                channelType: pageData.channelType,
                userCreated: pageData.created,
                sbRank: pageData.viewRank, // Mapping ViewStats rank to our existing field
                subRank: pageData.subRank,
                monthlyEarnings: pageData.earningsMonthly,
                last30DayViews: pageData.views28d,
                source: 'ViewStats'
            };

            if (!result.monthlyEarnings && !result.last30DayViews) {
                console.log("  ⚠️ Scraper: Content parsing failed. Retrying...");
                retries--;
                continue;
            }

            console.log(`  ✅ Scraper: Success (Source: ViewStats)`);
            return result;

        } catch (e) {
            console.error("  ❌ Scraper Error:", e.message);
            if (browser) await browser.close().catch(() => { });
            browser = null;
            retries--;
        }
    }
    return null;
}

// ─── ROBUST SOCIAL BLADE SCRAPER ───
async function getSocialBladeData(handle) {
    const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
    const { connect } = require('puppeteer-real-browser');
    let browser = null;
    let retries = 2; // Try up to 3 times total

    while (retries >= 0) {
        try {
            console.log(`  🚀 Scraper: Launching Real Browser for ${handle} (Retries left: ${retries})...`);

            const puppeteer = require('puppeteer');
            const defaultExePath = puppeteer.executablePath();
            const exePath = process.env.PUPPETEER_EXECUTABLE_PATH || defaultExePath;
            console.log(`  🔍 Scraper Info: Default Exe: ${defaultExePath} | Using Exe: ${exePath}`);

            const connectOptions = {
                headless: 'auto',
                turnstile: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
                customConfig: {},
                connectOption: {
                    defaultViewport: null,
                    executablePath: exePath
                },
            };

            let response;
            try {
                response = await connect(connectOptions);
            } catch (launchError) {
                console.error("  ❌ Real Browser Launch Failed:", launchError.message);

                // Secondary Fallback: Standard Puppeteer Stealth (Render Compatible)
                console.log("  🔄 Attempting Standard Puppeteer Stealth Fallback...");
                const puppeteerExtra = require('puppeteer-extra');
                const StealthPlugin = require('puppeteer-extra-plugin-stealth');
                if (!puppeteerExtra.getPlugins().some(p => p.name === 'stealth')) {
                    puppeteerExtra.use(StealthPlugin());
                }

                const browserInstance = await puppeteerExtra.launch({
                    headless: true,
                    executablePath: exePath,
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
                });

                const pageInstance = await browserInstance.newPage();
                response = { browser: browserInstance, page: pageInstance };
            }

            browser = response.browser;
            const page = response.page;
            const sbUrl = `https://socialblade.com/youtube/${cleanHandle}`;

            console.log(`  🌐 Scraper: Navigating to ${sbUrl}`);
            await page.goto(sbUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });

            // Wait for potential Cloudflare challenge
            await new Promise(r => setTimeout(r, 12000));

            // Human-like interaction: mouse move
            try {
                await page.mouse.move(Math.random() * 500, Math.random() * 500);
            } catch (e) { }

            const pageData = await page.evaluate(() => {
                const title = document.title;
                const bodyText = document.body.innerText;
                const html = document.body.innerHTML;

                // Function to find value near label using XPath-like matching in JS
                const getStat = (label) => {
                    const ps = Array.from(document.querySelectorAll('p, span, div, h3'));
                    const target = ps.find(p => p.innerText.trim().includes(label));
                    if (!target) return null;

                    // Social Blade often puts stats in following-sibling or child
                    if (target.nextElementSibling) return target.nextElementSibling.innerText.trim();
                    if (target.parentElement && target.parentElement.innerText.includes('\n')) {
                        const parts = target.parentElement.innerText.split('\n');
                        const idx = parts.findIndex(p => p.includes(label));
                        return parts[idx + 1] || parts[idx - 1] || null;
                    }
                    return null;
                };

                // Specialized for Ranks (which have values BEFORE labels sometimes)
                const getRank = (label) => {
                    const ps = Array.from(document.querySelectorAll('p, span'));
                    const target = ps.find(p => p.innerText.trim().includes(label));
                    if (!target) return null;
                    if (target.previousElementSibling) return target.previousElementSibling.innerText.trim();
                    return null;
                };

                // Money Extraction (H2s near H3s)
                const getEarnings = (label) => {
                    const h3s = Array.from(document.querySelectorAll('h3'));
                    const target = h3s.find(h => h.innerText.trim().includes(label));
                    if (!target) return null;
                    if (target.previousElementSibling) return target.previousElementSibling.innerText.trim();
                    return null;
                };

                return {
                    title,
                    bodyText,
                    uploads: getStat('Uploads'),
                    subscribers: getStat('Subscribers'),
                    videoViews: getStat('Video Views'),
                    country: getStat('Country'),
                    channelType: getStat('Channel Type'),
                    userCreated: getStat('User Created'),
                    sbRank: getRank('SB Rank'),
                    subRank: getRank('Subscribers Rank'),
                    viewRank: getRank('Video Views Rank'),
                    monthlyEarnings: getEarnings('Monthly Estimated Earnings'),
                    yearlyEarnings: getEarnings('Yearly Estimated Earnings'),
                    last30DayViews: getStat('Video Views for the last 30 days') || getStat('Views for the last 30 days')
                };
            });

            await browser.close();
            browser = null;

            if (pageData.title.includes('Just a moment') || pageData.title.includes('Cloudflare')) {
                console.log("  ❌ Scraper: Blocked by Cloudflare challenge");
                retries--;
                continue;
            }

            // Cleanup results
            const result = {
                grade: (pageData.bodyText.match(/Grade\s+([A-F][+-]{0,2})/i) || [, "C"])[1],
                uploads: pageData.uploads,
                country: pageData.country,
                channelType: pageData.channelType,
                userCreated: pageData.userCreated,
                sbRank: pageData.sbRank,
                subRank: pageData.subRank,
                viewRank: pageData.viewRank,
                monthlyEarnings: pageData.monthlyEarnings,
                yearlyEarnings: pageData.yearlyEarnings,
                last30DayViews: pageData.last30DayViews,
                source: 'Social Blade (Real Browser)'
            };

            if (!result.sbRank && !result.monthlyEarnings) {
                console.log("  ⚠️ Scraper: Found page but content parsing failed. Retrying...");
                retries--;
                continue;
            }

            console.log(`  ✅ Scraper: Success (Monthly: ${result.monthlyEarnings})`);
            return result;

        } catch (e) {
            console.error("  ❌ Scraper Error:", e.message);
            if (browser) await browser.close().catch(() => { });
            browser = null;
            retries--;
        }
    }
    return null;
}

app.post('/api/youtube/strategy', async (req, res) => {
    const { handle, competitorHandle } = req.body;
    if (!handle) return res.status(400).json({ success: false, error: 'Target handle is required' });

    const axios = require('axios');
    console.log(`🎬 Strategy Generation for ${handle}${competitorHandle ? ` (vs ${competitorHandle})` : ''}`);

    try {
        // 1. Helper functions (ported from frontend)
        const fetchChannel = async (h) => {
            const clean = h.startsWith('@') ? h : `@${h}`;
            const url = `https://youtube.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${clean}&key=${YOUTUBE_API_KEY}`;
            const { data } = await axios.get(url);
            if (!data.items?.length) return null;
            const ch = data.items[0];

            // Get recent videos
            const uploadsId = ch.contentDetails.relatedPlaylists.uploads;
            const { data: vData } = await axios.get(`https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=20&key=${YOUTUBE_API_KEY}`);

            const recentTitles = vData.items?.map(v => v.snippet.title) || [];
            const recentIds = vData.items?.map(v => v.snippet.resourceId.videoId) || [];

            let recentViews = 0;
            if (recentIds.length > 0) {
                const { data: statsData } = await axios.get(`https://youtube.googleapis.com/youtube/v3/videos?part=statistics&id=${recentIds.join(',')}&key=${YOUTUBE_API_KEY}`);
                recentViews = statsData.items?.reduce((sum, v) => sum + parseInt(v.statistics.viewCount || 0), 0) || 0;
            }

            return {
                title: ch.snippet.title,
                description: ch.snippet.description,
                country: ch.snippet.country || "Unknown",
                subscribers: parseInt(ch.statistics.subscriberCount || 0).toLocaleString(),
                totalViews: parseInt(ch.statistics.viewCount || 0).toLocaleString(),
                thirtyDayViews: recentViews,
                recentVideoTitles: recentTitles
            };
        };

        // 2. Fetch Data
        const [yourData, competitorAnalytics, viewStats] = await Promise.all([
            fetchChannel(handle),
            competitorHandle ? fetchChannel(competitorHandle) : Promise.resolve(null),
            getViewStatsData(handle)
        ]);

        if (!yourData) throw new Error(`Channel ${handle} not found`);

        // 3. Fallback Algorithm if Scraper fails
        let finalAnalytics = viewStats;
        if (!finalAnalytics || !finalAnalytics.monthlyEarnings) {
            console.log("⚠️ Scraper failed or returned nothing, using backend fallback algorithm");
            const views = yourData.thirtyDayViews || 0;
            const subs = parseInt(yourData.subscribers.replace(/,/g, '')) || 0;

            const getGrade = (v) => v > 5000000 ? "A" : v > 1000000 ? "B+" : v > 500000 ? "B" : v > 100000 ? "B-" : "C";
            const getRank = (s) => s > 1000000 ? "15,000th" : s > 100000 ? "100,000th" : "500,000th+";
            const getEarnings = (v) => {
                const low = Math.round((v / 1000) * 1.5);
                const high = Math.round((v / 1000) * 4.0);
                return `$${low.toLocaleString()} - $${high.toLocaleString()}`;
            };

            finalAnalytics = {
                grade: getGrade(views),
                subRank: getRank(subs),
                monthlyEarnings: getEarnings(views),
                last30DayViews: views.toLocaleString(),
                source: 'Backend Fallback'
            };
        }

        // 4. Generate Strategy with AI (Groq)
        const prompt = `
            Act as a YouTube Growth Strategist. Analyze these two channels and provide a detailed growth strategy in JSON format.
            
            TARGET CHANNEL (${yourData.title}):
            - Subs: ${yourData.subscribers}
            - 30d Views: ${yourData.thirtyDayViews}
            - Analytics Source: ${finalAnalytics.source}
            - Estimated Monthly Earnings: ${finalAnalytics.monthlyEarnings}
            - Channel Type: ${finalAnalytics.channelType || 'YouTube'}
            - Recent Content: ${yourData.recentVideoTitles.join(', ')}
            
            ${competitorAnalytics ? `COMPETITOR CHANNEL (${competitorAnalytics.title}):
            - Subs: ${competitorAnalytics.subscribers}
            - 30d Views: ${competitorAnalytics.thirtyDayViews}
            - Recent Content: ${competitorAnalytics.recentVideoTitles.join(', ')}` : ''}

            Output ONLY this JSON structure:
            {
                "monthlyPerformance": { "performanceVerdict": "..." },
                "contentStrategy": { 
                    "optimalTimeLimit": "...", 
                    "remixedIdeas": [{ "title": "...", "concept": "...", "thumbnailHook": "...", "hookLogic": "..." }] 
                },
                "marketAnalysis": { "competitionLevel": "...", "marketGap": "..." },
                "audienceDemand": { "topSearchTerms": ["..."], "currentTrend": "..." }
            }
        `;

        if (!GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY");

        const groqResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: 'You are a YouTube viral strategist. Output ONLY strict JSON.' },
                { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" }
        }, {
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` }
        });

        const strategyRes = groqResponse.data.choices[0].message.content;
        const parsedStrategy = JSON.parse(strategyRes);

        res.json({
            success: true,
            channelData: yourData,
            competitorData: competitorAnalytics,
            socialBlade: finalAnalytics,
            strategy: parsedStrategy
        });

    } catch (err) {
        const errorMsg = err.response?.data?.error?.message || err.message;
        console.error("YouTube Strategy Error:", errorMsg);
        if (err.response?.data) console.error("Details:", JSON.stringify(err.response.data));

        res.status(500).json({
            success: false,
            error: errorMsg,
            details: err.response?.data || null,
            _debug: {
                ytKeySet: !!YOUTUBE_API_KEY,
                ytKeyStart: YOUTUBE_API_KEY ? YOUTUBE_API_KEY.substring(0, 5) : "NONE",
                groqKeySet: !!GROQ_API_KEY,
                groqKeyStart: GROQ_API_KEY ? GROQ_API_KEY.substring(0, 5) : "NONE"
            }
        });
    }
});



// ==================== NOWPAYMENTS INTEGRATION ====================
app.post('/api/payments/create-invoice', async (req, res) => {
    const { amount, currency, description, userId } = req.body;

    if (!amount || !userId) {
        return res.status(400).json({ error: 'Amount and userId are required' });
    }

    try {
        const formattedOrderId = `COAL_${amount}_order_${userId}_${Date.now()}`;

        const payload = {
            price_amount: parseFloat(amount),
            price_currency: currency || 'usd',
            order_id: formattedOrderId,
            order_description: description || `Flamercoal: ${amount} Pack`,
            ipn_callback_url: 'https://flamercoal-backend.onrender.com/api/payments/callback',
            success_url: 'https://flamercoal.web.app/success',
            cancel_url: 'https://flamercoal.web.app/pricing'
        };

        const apiKey = process.env.NOWPAYMENTS_API_KEY;

        if (!apiKey) {
            console.error('❌ Missing NOWPAYMENTS_API_KEY in environment');
            return res.status(500).json({ error: 'Payment gateway configuration missing' });
        }

        const axios = require('axios');
        console.log(`💳 Creating NOWPayments Invoice for ${amount} (Order: ${formattedOrderId})...`);

        const responseData = await axios.post('https://api.nowpayments.io/v1/invoice', payload, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        const nowResp = responseData.data;

        if (nowResp.invoice_url) {
            console.log(`✅ NOWPayments Invoice Created: ${nowResp.id}`);
            res.json({
                success: true,
                payUrl: nowResp.invoice_url,
                trackId: nowResp.id
            });
        } else {
            console.error('❌ NOWPayments API Error:', nowResp);
            res.status(500).json({ error: 'Failed to create payment invoice' });
        }
    } catch (error) {
        console.error('❌ Payment Server Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Internal server error during payment creation' });
    }
});

// NOWPayments IPN Webhook
app.post('/api/payments/callback', async (req, res) => {
    const body = req.body;
    const hmacHeader = req.headers['x-nowpayments-sig'];
    console.log('🔔 Received NOWPayments Webhook for Order:', body.order_id);

    try {
        // Verification logic (Optional but recommended: use ipn_secret)
        // For simplicity during initial setup, we'll check the status first
        const { order_id, payment_status, payment_id, pay_amount, pay_currency } = body;

        if (payment_status === 'finished' || payment_status === 'confirmed') {
            console.log(`💰 NOWPayments Payment CONFIRMED for ${order_id} (ID: ${payment_id})`);

            const parts = order_id.split('_');
            if (parts[0] === 'COAL' && parts[2] === 'order') {
                const coalAmount = parseInt(parts[1], 10);
                const userId = parts[3];

                if (db && userId && !isNaN(coalAmount)) {
                    let reward = 0;
                    if (coalAmount === 3) reward = 1000;
                    else if (coalAmount === 10) reward = 5000;
                    else if (coalAmount === 25) reward = 15000;
                    else reward = coalAmount * 333;

                    if (reward > 0) {
                        const userRef = db.ref(`users/${userId}`);
                        const snapshot = await userRef.once('value');
                        const currentBalance = snapshot.val()?.coalBalance || 0;
                        const newBalance = currentBalance + reward;

                        await userRef.update({ coalBalance: newBalance });

                        await db.ref(`transactions/${payment_id}`).set({
                            userId,
                            amount: coalAmount,
                            coalReward: reward,
                            currency: pay_currency,
                            orderId: order_id,
                            timestamp: Date.now(),
                            gateway: 'nowpayments'
                        });

                        console.log(`🔥 CREDITED ${reward} Coal to User ${userId}!`);
                    }
                }
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Webhook Error:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// --- DEBUG LOGS ENDPOINT ---
let serverLogs = [];
const originalLog = console.log;
const originalError = console.error;
console.log = (...args) => { serverLogs.push(`[LOG] ${args.join(' ')}`); if (serverLogs.length > 100) serverLogs.shift(); originalLog(...args); };
console.error = (...args) => { serverLogs.push(`[ERR] ${args.join(' ')}`); if (serverLogs.length > 100) serverLogs.shift(); originalError(...args); };

app.get('/_debug/logs', (req, res) => {
    res.type('text/plain').send(serverLogs.join('\n'));
});

app.listen(PORT, () => {
    console.log(`✅ Keyword Server running on port ${PORT}`);
});
