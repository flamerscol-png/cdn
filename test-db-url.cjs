
const projectIds = ['flamercoal', 'flamercoal-default-rtdb'];
const suffixes = [
    'firebaseio.com',
    'asia-southeast1.firebasedatabase.app',
    'europe-west1.firebasedatabase.app',
    'us-central1.firebasedatabase.app',
    'firebasedatabase.app'
];

async function checkUrls() {
    for (const id of projectIds) {
        for (const suffix of suffixes) {
            const url = `https://${id}.${suffix}/.json?shallow=true`;
            try {
                const response = await fetch(url, { method: 'GET' });
                console.log(`URL: ${url} | STATUS: ${response.status} ${response.statusText}`);
                if (response.status !== 404 && response.status !== 401 && response.status !== 403) {
                    console.log(`>>> POTENTIAL VALID INSTANCE: ${url}`);
                }
            } catch (err) {
                console.log(`URL: ${url} | ERROR: ${err.message}`);
            }
        }
    }
}

checkUrls();
