const axios = require('axios');

async function testApi() {
    try {
        console.log("Testing API fetch via Render...");
        const res = await axios.get("https://flamercoal-backend.onrender.com/api/viewstats/channel?handle=@mrbeast");
        console.log("Status:", res.status);
        if (res.data) {
           console.log("✅ Success! Data returned:", Object.keys(res.data));
           if (res.data.error) console.log("Backend returned an error inside JSON:", res.data.error);
        }
    } catch (e) {
        console.error("❌ Failed!");
        if (e.response) {
            console.error("HTTP Status:", e.response.status);
            console.error("Response Data:", e.response.data);
        } else {
            console.error("Error Message:", e.message);
        }
    }
}

async function getLogs() {
    try {
        console.log("\n--- FETCHING BACKEND LOGS ---");
        const res = await axios.get("https://flamercoal-backend.onrender.com/_debug/logs");
        console.log(res.data);
    } catch(e) {
        console.error("Could not fetch logs:", e.message);
    }
}

async function run() {
    await testApi();
    await getLogs();
}

run();
