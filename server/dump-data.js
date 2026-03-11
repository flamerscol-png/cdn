const https = require('https');
const crypto = require('crypto');

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
                    resolve(result);
                } else {
                    resolve({ error: 'Status ' + res.statusCode });
                }
            });
        });
        req.on('error', (e) => resolve({ error: e.message }));
        req.end();
    });
}

async function test() {
    const channel = await apiReq('/channels/@mrbeast');
    const stats = await apiReq('/channels/@mrbeast/stats?range=28&withRevenue=true');
    const fs = require('fs');
    fs.writeFileSync('full-channel.json', JSON.stringify(channel, null, 2));
    fs.writeFileSync('full-stats.json', JSON.stringify(stats, null, 2));
    console.log('Files written.');
}

test();
