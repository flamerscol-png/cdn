const https = require('https');
const crypto = require('crypto');

const API_TOKEN = '32ev9m0qggn227ng1rgpbv5j8qllas8uleujji3499g9had6oj7f0ltnvrgi00cq';
const BASE_URL = 'https://api.viewstats.com';

// Extracted from PHP wrapper
const iv_b64 = "Wzk3LCAxMDksIC0xMDAsIC05MCwgMTIyLCAtMTI0LCAxMSwgLTY5LCAtNDIsIDExNSwgLTU4LCAtNjcsIDQzLCAtNzUsIDMxLCA3NF0=";
const key_b64 = "Wy0zLCAtMTEyLCAxNSwgLTEyNCwgLTcxLCAzMywgLTg0LCAxMDksIDU3LCAtMTI3LCAxMDcsIC00NiwgMTIyLCA0OCwgODIsIC0xMjYsIDQ3LCA3NiwgLTEyNywgNjUsIDc1LCAxMTMsIC0xMjEsIDg5LCAtNzEsIDUwLCAtODMsIDg2LCA5MiwgLTQ2LCA0OSwgNTZd";

function decrypt(data) {
    try {
        const keyArr = JSON.parse(Buffer.from(key_b64, 'base64').toString());
        const ivArr = JSON.parse(Buffer.from(iv_b64, 'base64').toString());

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
        console.error('Decryption failed:', e.message);
        return null;
    }
}

function apiGet(path) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
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
                console.log(`Status: ${res.statusCode} for ${path}`);
                if (res.statusCode === 200) {
                    const contentType = res.headers['content-type'] || '';
                    if (contentType.includes('application/json')) {
                        try {
                            resolve(JSON.parse(buffer.toString()));
                        } catch (e) {
                            resolve(buffer.toString());
                        }
                    } else {
                        resolve(decrypt(buffer));
                    }
                } else {
                    resolve(null);
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function test() {
    console.log('=== Testing ViewStats API with Decryption ===\n');

    console.log('fetching /channels/@mrbeast ...');
    const channelInfo = await apiGet('/channels/@mrbeast');
    if (channelInfo) console.log('Parsed Data:', JSON.stringify(channelInfo, null, 2).substring(0, 1000));
}

test().catch(console.error);
