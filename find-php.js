const https = require('https');

https.get('https://windows.php.net/downloads/releases/', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const matches = data.match(/href="([^"]+-nts-Win32-[^"]+-x64\.zip)"/g);
        if (matches && matches.length > 0) {
            console.log("Found links:", matches.slice(-5));
        } else {
            console.log("No matching PHP zips found on the page.");
        }
    });
}).on('error', (e) => {
    console.error(e);
});
