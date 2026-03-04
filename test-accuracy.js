const axios = require('axios');

async function testRankAccuracy(keyword, domain, region) {
    console.log(`\n🚀 Testing accuracy for "${keyword}" | ${domain} | region: ${region}`);
    try {
        const response = await axios.post('http://localhost:3001/api/track-position', {
            keyword, domain, region
        });

        const data = response.data;
        console.log(`✅ Success! Rank: ${data.rank || 'Not Found'}`);
        console.log(`📊 Scraped ${data.totalResults} results.`);
        if (data.competitors && data.competitors.length > 0) {
            console.log(`🏢 Top Competitor: ${data.competitors[0].domain}`);
        }
    } catch (err) {
        if (err.response) {
            console.error(`❌ Error: ${err.response.data.error} | Details: ${err.response.data.details}`);
        } else {
            console.error(`❌ Failed: ${err.message}`);
        }
    }
}

// Running localized tests
(async () => {
    // Test with the user's domain
    await testRankAccuracy('editorvault', 'editorvault.web.app', 'us');
    await testRankAccuracy('editorvault', 'editorvault.web.app', 'in'); // Many users in India
})();
