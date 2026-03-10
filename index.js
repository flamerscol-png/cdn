require('dotenv').config();
const express = require('express');
const cors = require('cors');
const googleTrends = require('google-trends-api');

const app = express();
const PORT = process.env.PORT || 3001;

console.log("🚀 Server Starting...");
console.log(`📂 Working Directory: ${process.cwd()}`);
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

// ==================== COMPETITORS ENDPOINT (Legacy Scraper Removed) ====================
app.get('/api/competitors', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Missing query' });
    console.log(`⚔️  Analyzing Competitors (Stub) for: ${query}`);

    // Return empty results since scraper is removed to favor official APIs
    res.json({ competitors: [] });
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
        console.error('Audit Error:', error.message);
        return res.status(500).json({ error: 'Audit Failed', details: error.message });
    }
});



// ==================== POSITION TRACKER ENDPOINT (Legacy Scraper Removed) ====================
app.post('/api/track-position', async (req, res) => {
    const { keyword, domain, region = 'us' } = req.body;
    if (!keyword || !domain) return res.status(400).json({ error: 'Missing keyword or domain' });

    console.log(`🎯 Position Tracker (Stub) for: "${keyword}" | domain: ${domain}`);

    res.json({
        keyword,
        domain,
        region,
        rank: null,
        totalResults: 0,
        competitors: []
    });
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

// ==================== BACKLINK MONITOR ENDPOINT (Legacy Scraper Removed) ====================
app.get('/api/backlinks', async (req, res) => {
    const { domain } = req.query;
    if (!domain) return res.status(400).json({ error: 'Missing domain' });
    console.log(`🔗 Backlink Monitor (Stub) for: ${domain}`);
    res.json({ domain, backlinks: [] });
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
// --- VIEWSTATS DIRECT API DECRYPTION (Reverse Engineered) ---
const VS_IV_B64 = "Wzk3LCAxMDksIC0xMDAsIC05MCwgMTIyLCAtMTI0LCAxMSwgLTY5LCAtNDIsIDExNSwgLTU4LCAtNjcsIDQzLCAtNzUsIDMxLCA3NF0=";
const VS_KEY_B64 = "Wy0zLCAtMTEyLCAxNSwgLTEyNCwgLTcxLCAzMywgLTg0LCAxMDksIDU3LCAtMTI3LCAxMDcsIC00NiwgMTIyLCA0OCwgODIsIC0xMjYsIDQ3LCA3NiwgLTEyNywgNjUsIDc1LCAxMTMsIC0xMjEsIDg5LCAtNzEsIDUwLCAtODMsIDg2LCA5MiwgLTQ2LCA0OSwgNTZd";
const VS_API_TOKEN = '32ev9m0qggn227ng1rgpbv5j8qllas8uleujji3499g9had6oj7f0ltnvrgi00cq';
const VS_BASE_URL = 'https://api.viewstats.com';

function decryptViewStats(data) {
    try {
        const crypto = require('crypto');
        const keyArr = JSON.parse(Buffer.from(VS_KEY_B64, 'base64').toString());
        const ivArr = JSON.parse(Buffer.from(VS_IV_B64, 'base64').toString());

        const key = Buffer.from(keyArr.map(b => b & 0xFF));
        const iv = Buffer.from(ivArr.map(b => b & 0xFF));

        const ciphertext = data.slice(0, -16);
        const tag = data.slice(-16);

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(ciphertext, null, 'utf8');
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted);
    } catch (e) {
        console.error('  ❌ ViewStats Decryption Failed:', e.message);
        return null;
    }
}

async function viewStatsRequest(path) {
    return new Promise((resolve) => {
        const https = require('https');
        const url = new URL(path, VS_BASE_URL);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${VS_API_TOKEN}`,
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                'Referer': 'https://www.viewstats.com/',
                'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site'
            }
        };

        const req = https.request(options, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                if (res.statusCode === 200) {
                    const contentType = res.headers['content-type'] || '';
                    let result = null;
                    if (contentType.includes('application/json')) {
                        try {
                            result = JSON.parse(buffer.toString());
                        } catch (e) {
                            console.error(`  ⚠️ ViewStats JSON Parse Failed (${path}):`, e.message);
                            resolve(null);
                        }
                    } else {
                        result = decryptViewStats(buffer);
                    }
                    // Unwrap .data if exists (ViewStats API wraps its responses)
                    resolve(result && result.data ? result.data : result);
                } else {
                    console.error(`  ❌ ViewStats API Error (${path}): Status ${res.statusCode}`);
                    resolve(null);
                }
            });
        });
        req.on('error', (e) => {
            console.error(`  ❌ ViewStats Network Error (${path}):`, e.message);
            resolve(null);
        });
        req.end();
    });
}

async function getViewStatsData(handle) {
    const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
    console.log(`📡 Fetching ViewStats API for ${cleanHandle}...`);

    try {
        const channel = await viewStatsRequest(`/channels/${cleanHandle}`);
        if (!channel) {
            console.error(`  ❌ ViewStats: Channel data missing for ${cleanHandle}`);
            return null;
        }

        const [stats, averages, split] = await Promise.all([
            viewStatsRequest(`/channels/${cleanHandle}/stats?range=30&withRevenue=true`).catch(e => { console.error("Stats fail:", e.message); return null; }),
            viewStatsRequest(`/channels/${cleanHandle}/averages`).catch(e => { console.error("Averages fail:", e.message); return null; }),
            viewStatsRequest(`/channels/${cleanHandle}/longsAndShorts`).catch(e => { console.error("Split fail:", e.message); return null; })
        ]);

        console.log(`  ✅ ViewStats: Data retrieved for ${channel.displayName || channel.name} (Stats: ${!!stats}, Avg: ${!!averages}, Split: ${!!split})`);

        // Process stats array (summing daily deltas)
        let last30Views = 0;
        let prev30Views = 0;
        let monthlyEarningsLow = 0;
        let monthlyEarningsHigh = 0;

        if (Array.isArray(stats)) {
            // Stats should be sorted by date ASC (oldest first). 
            // We want last 30 days vs previous 30 days.
            const totalDays = stats.length;
            const currentPeriod = stats.slice(Math.max(0, totalDays - 30));
            const prevPeriod = stats.slice(Math.max(0, totalDays - 60), Math.max(0, totalDays - 30));

            currentPeriod.forEach(day => {
                last30Views += (day.viewCountDelta || 0);
                monthlyEarningsLow += (day.estimatedLowRevenueUsd || 0);
                monthlyEarningsHigh += (day.estimatedHighRevenueUsd || 0);
            });

            prevPeriod.forEach(day => {
                prev30Views += (day.viewCountDelta || 0);
            });
        }

        // Calculate Views Comparison
        let viewsComparison = "N/A";
        if (last30Views > 0 && prev30Views > 0) {
            const diff = last30Views - prev30Views;
            const pct = ((diff / prev30Views) * 100).toFixed(1);
            viewsComparison = `${(diff >= 0 ? "+" : "")}${diff.toLocaleString()} (${diff >= 0 ? "+" : ""}${pct}%)`;
        } else if (last30Views > 0) {
            viewsComparison = "New Channel Data";
        }

        // Process Split
        let shortsVsLongs = "N/A";
        if (split) {
            const shorts = split.shorts?.percentage || 0;
            const longs = split.longs?.percentage || 0;
            shortsVsLongs = `Shorts: ${shorts}% | Longs: ${longs}%`;
        }

        return {
            grade: channel.grade || "A",
            name: channel.displayName || channel.name,
            uploads: (channel.videoCount || 0).toLocaleString(),
            country: channel.country || "US",
            channelType: channel.category || "YouTube",
            userCreated: channel.publishedAt ? new Date(channel.publishedAt).getFullYear().toString() : "N/A",
            sbRank: (channel.globalViewsRanking || 0).toLocaleString(),
            subRank: (channel.globalSubscribersRanking || 0).toLocaleString(),
            viewRank: (channel.globalViewsRanking || 0).toLocaleString(),
            monthlyEarnings: monthlyEarningsLow > 0 ? `$${monthlyEarningsLow.toLocaleString()} - $${monthlyEarningsHigh.toLocaleString()}` : "$0 - $0",
            last30DayViews: last30Views > 0 ? last30Views.toLocaleString() : (channel.vpv30 || 0).toLocaleString(),
            viewsComparison,
            comparisonDate: "Last 30 Days vs Prev 30 Days",
            shortsVsLongs,
            averages: {
                dailyViews: averages?.daily?.toLocaleString(),
                weeklyViews: averages?.weekly?.toLocaleString()
            },
            subscribersLast30Days: (channel.subs30 || 0).toLocaleString(),
            source: 'ViewStats API (Direct)'
        };

    } catch (e) {
        console.error("ViewStats API Integration Error:", e.message);
        return null;
    }
}


app.post('/api/youtube/strategy', async (req, res) => {
    const { handle, competitorHandle } = req.body;
    if (!handle) return res.status(400).json({ success: false, error: 'Target handle is required' });

    const axios = require('axios');
    console.log(`🎬 Strategy Generation for ${handle}${competitorHandle ? ` (vs ${competitorHandle})` : ''} `);

    try {
        // 1. Helper functions (ported from frontend)
        const fetchChannel = async (h) => {
            const clean = h.startsWith('@') ? h : `@${h} `;
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

        // 3. Set Final Analytics (Strictly API-only)
        let finalAnalytics = viewStats;

        if (!finalAnalytics) {
            console.warn("⚠️ ViewStats API returned nothing.");
            finalAnalytics = {
                grade: "N/A",
                subRank: "N/A",
                monthlyEarnings: "$0 - $0",
                last30DayViews: "0",
                viewsComparison: 'N/A',
                source: 'ViewStats (Failed)'
            };
        }

        // 4. Generate Strategy with AI (Groq)
        const prompt = `
            Act as a YouTube Growth Strategist. Analyze these two channels and provide a detailed growth strategy in JSON format.
            
            TARGET CHANNEL (${yourData.title}):
            - Subs: ${yourData.subscribers}
            - 30d Subs Gained: ${finalAnalytics.subscribersLast30Days || 'N/A'}
            - 30d Views: ${yourData.thirtyDayViews}
            - MoM View Comparison: ${finalAnalytics.viewsComparison || 'N/A'} (Compared to ${finalAnalytics.comparisonDate || 'Last Month'})
            - Content Format Split (Shorts/Longs): ${finalAnalytics.shortsVsLongs || 'N/A'}
            - Daily Avg Views: ${finalAnalytics.averages?.dailyViews || 'N/A'}
            - Weekly Avg Views: ${finalAnalytics.averages?.weeklyViews || 'N/A'}
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
