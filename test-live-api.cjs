const axios = require('axios');

async function testLiveAPI() {
    console.log("Testing live /api/youtube/strategy endpoint...");
    try {
        const res = await axios.post('https://flamercoal-backend.onrender.com/api/youtube/strategy', {
            handle: 'mrbeast'
        }, { timeout: 120000 });

        console.log("Keys in response:", Object.keys(res.data));
        console.log("Raw Response Data:", JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error("API Error:", e.message);
    }
}

testLiveAPI();
