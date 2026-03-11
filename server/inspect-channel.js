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
    } catch (e) { return null; }
}

async function test() {
    const apiReq = async (path) => {
        try {
            const res = await fetch(`${baseUrl}${path}`, {
                headers: { 'Authorization': `Bearer ${VS_API_TOKEN}`, 'Accept': 'application/json, text/plain, */*' }
            });
            if (!res.ok) return null;
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const data = await res.json();
                return data.data || data;
            } else {
                const buffer = Buffer.from(await res.arrayBuffer());
                const data = decryptViewStats(buffer);
                return data?.data || data;
            }
        } catch (e) { return null; }
    };

    const channel = await apiReq(`/channels/${handle}`);
    console.log('--- CHANNEL FULL OBJECT ---');
    console.log(JSON.stringify(channel, null, 2));
}

test();
