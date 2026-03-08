const apiKey = "AIzaSyAPeTDN8uR49coikYuJ2zfSXyTsuSbVAqY";

async function testKey() {
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=minecraft&maxResults=1&key=${apiKey}`);
        const data = await response.json();
        if (data.error) {
            console.error("Error:", data.error.message);
        } else {
            console.log("Success! Found:", data.pageInfo.totalResults, "results");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testKey();
