const crypto = require('crypto');

const VS_API_TOKEN = '32ev9m0qggn227ng1rgpbv5j8qllas8uleujji3499g9had6oj7f0ltnvrgi00cq';
const VS_IV_B64 = "Wzk3LCAxMDksIC0xMDAsIC05MCwgMTIyLCAtMTI0LCAxMSwgLTY5LCAtNDIsIDExNSwgLTU4LCAtNjcsIDQzLCAtNzUsIDMxLCA3NF0=";
const VS_KEY_B64 = "Wy0zLCAtMTEyLCAxNSwgLTEyNCwgLTcxLCAzMywgLTg0LCAxMDksIDU3LCAtMTI3LCAxMDcsIC00NiwgMTIyLCA0OCwgODIsIC0xMjYsIDQ3LCA3NiwgLTEyNywgNjUsIDc1LCAxMTMsIC0xMjEsIDg5LCAtNzEsIDUwLCAtODMsIDg2LCA5MiwgLTQ2LCA0OSwgNTZd";

const handle = '@technogamerzofficial';
const baseUrl = 'https://api.viewstats.com';

function decryptViewStats(encrypted) {
    try {
        const keyArr = JSON.parse(Buffer.from(VS_KEY_B64, 'base64').toString());
        const ivArr = JSON.parse(Buffer.from(VS_IV_B64, 'base64').toString());

        const key = Buffer.from(keyArr.map(b => b & 0xFF));
        const iv = Buffer.from(ivArr.map(b => b & 0xFF));

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        const tag = encrypted.slice(encrypted.length - 16);
        const data = encrypted.slice(0, encrypted.length - 16);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(data, 'binary', 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
    } catch (e) {
        console.error("Decryption failed:", e.message);
        return null;
    }
}

async function test() {
    const apiReq = async (path) => {
        console.log(`\nFetching: ${path}...`);
        try {
            const res = await fetch(`${baseUrl}${path}`, {
                headers: {
                    'Authorization': `Bearer ${VS_API_TOKEN}`,
                    'Accept': 'application/json, text/plain, */*'
                }
            });
            console.log(`Status: ${res.status}`);
            if (!res.ok) return null;

            const contentType = res.headers.get('content-type') || '';
            console.log(`Content-Type: ${contentType}`);

            if (contentType.includes('application/json')) {
                const data = await res.json();
                return data.data || data;
            } else {
                const buffer = Buffer.from(await res.arrayBuffer());
                const data = decryptViewStats(buffer);
                return data?.data || data;
            }
        } catch (e) {
            console.error(`Error:`, e.message);
            return null;
        }
    };

    const channel = await apiReq(`/channels/${handle}`);
    console.log('Channel Name:', channel?.displayName);
    console.log('Channel Grade:', channel?.grade);
    console.log('Channel Category:', channel?.category);

    const stats = await apiReq(`/channels/${handle}/stats?range=30&withRevenue=true`);
    console.log('Stats Length:', Array.isArray(stats) ? stats.length : 'Not an array');
    if (Array.isArray(stats) && stats.length > 0) {
        console.log('Daily Views Sum:', stats.reduce((sum, d) => sum + (d.viewCountDelta || 0), 0));
        console.log('Sample Stat:', JSON.stringify(stats[0], null, 2));
    }

    const averages = await apiReq(`/channels/${handle}/averages`);
    console.log('Averages:', JSON.stringify(averages, null, 2));
}

test();
