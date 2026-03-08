const urls = [
    "https://flamercoal.firebasedatabase.app/.json",
    "https://flamercoal-default-rtdb.firebasedatabase.app/.json",
    "https://flamercoal-rtdb.firebasedatabase.app/.json",
    "https://flamercoal-default-rtdb.us-central1.firebasedatabase.app/.json"
];

async function check() {
    for (const url of urls) {
        try {
            const resp = await fetch(url + "?shallow=true", { method: 'GET' });
            console.log(`URL: ${url}`);
            console.log(`STATUS: ${resp.status} ${resp.statusText}`);
            if (resp.status !== 404) {
                console.log(`>>> VALID INSTANCE FOUND: ${url.replace('/.json?shallow=true', '')}`);
            }
        } catch (e) {
            console.log(`URL: ${url}`);
            console.log(`ERROR: ${e.message}`);
        }
        console.log('---');
    }
}

check();
