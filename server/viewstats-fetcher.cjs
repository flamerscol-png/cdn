const https = require('https');
const crypto = require('crypto');

// --- ViewStats Direct API Constants (Verified from GitHub source) ---
const VS_IV_B64 = "Wzk3LCAxMDksIC0xMDAsIC05MCwgMTIyLCAtMTI0LCAxMSwgLTY5LCAtNDIsIDExNSwgLTU4LCAtNjcsIDQzLCAtNzUsIDMxLCA3NF0=";
const VS_KEY_B64 = "Wy0zLCAtMTEyLCAxNSwgLTEyNCwgLTcxLCAzMywgLTg0LCAxMDksIDU3LCAtMTI3LCAxMDcsIC00NiwgMTIyLCA0OCwgODIsIC0xMjYsIDQ3LCA3NiwgLTEyNywgNjUsIDc1LCAxMTMsIC0xMjEsIDg5LCAtNzEsIDUwLCAtODMsIDg2LCA5MiwgLTQ2LCA0OSwgNTZd";
const VS_API_TOKEN = '32ev9m0qggn227ng1rgpbv5j8qllas8uleujji3499g9had6oj7f0ltnvrgi00cq';
const VS_BASE_URL = 'https://api.viewstats.com';

function decrypt(data) {
    try {
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
        return null;
    }
}

function apiReq(path) {
    return new Promise((resolve) => {
        const url = new URL(path, VS_BASE_URL);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${VS_API_TOKEN}`,
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                'Referer': 'https://www.viewstats.com/',
                'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"'
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
                        try { result = JSON.parse(buffer.toString()); } catch (e) { result = null; }
                    } else {
                        result = decrypt(buffer);
                    }
                    // Unwrap .data if exists
                    resolve(result && result.data ? result.data : result);
                } else {
                    resolve(null);
                }
            });
        });
        req.on('error', () => resolve(null));
        req.end();
    });
}

async function start(handle) {
    const clean = handle.startsWith('@') ? handle : `@${handle}`;
    console.log(`\n🔍 Fetching ViewStats data for ${clean}...\n`);

    const [channel, stats, split] = await Promise.all([
        apiReq(`/channels/${clean}`),
        apiReq(`/channels/${clean}/stats?range=30&withRevenue=true`),
        apiReq(`/channels/${clean}/longsAndShorts`)
    ]);

    if (!channel) {
        console.error("❌ Channel not found or API error.");
        return;
    }

    // Process stats array
    let last30Views = channel.vpv30 || 0;
    let earnedLow = 0;
    let earnedHigh = 0;

    if (Array.isArray(stats)) {
        last30Views = stats.reduce((acc, day) => acc + (day.viewCountDelta || 0), 0);
        earnedLow = stats.reduce((acc, day) => acc + (day.estimatedLowRevenueUsd || 0), 0);
        earnedHigh = stats.reduce((acc, day) => acc + (day.estimatedHighRevenueUsd || 0), 0);
    }

    const data = {
        name: channel.displayName || channel.name || "Unknown",
        handle: channel.handle || "N/A",
        subscribers: (channel.subscriberCount || 0).toLocaleString(),
        totalViews: (channel.viewCount || 0).toLocaleString(),
        uploads: (channel.videoCount || 0).toLocaleString(),
        grade: channel.grade || "N/A",
        country: channel.country || "N/A",
        category: channel.category || "N/A",
        last30DayViews: last30Views.toLocaleString(),
        estimatedMonthlyEarnings: earnedLow > 0 ?
            `$${earnedLow.toLocaleString()} - $${earnedHigh.toLocaleString()}` : "N/A",
        shortsPercentage: split?.shorts?.percentage || "N/A",
        longsPercentage: split?.longs?.percentage || "N/A"
    };

    console.log("==========================================");
    console.log(`📺 CHANNEL: ${data.name} (@${data.handle})`);
    console.log("==========================================");
    console.log(`📈 Grade: ${data.grade}`);
    console.log(`👥 Subscribers: ${data.subscribers}`);
    console.log(`🎥 Total Views: ${data.totalViews}`);
    console.log(`📤 Uploads: ${data.uploads}`);
    console.log(`🌍 Country: ${data.country} | Category: ${data.category}`);
    console.log("------------------------------------------");
    console.log(`🚀 Last 30 Day Views: ${data.last30DayViews}`);
    console.log(`💰 Est. Monthly Earnings: ${data.estimatedMonthlyEarnings}`);
    console.log(`🎞️ Format Split: Shorts ${data.shortsPercentage}% | Longs ${data.longsPercentage}%`);
    console.log("==========================================\n");
}

const handle = process.argv[2];
if (!handle) {
    console.log("Usage: node server/viewstats-fetcher.cjs <handle>");
    process.exit(1);
}

start(handle);
