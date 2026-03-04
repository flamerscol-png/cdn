const fs = require('fs');
const h = fs.readFileSync('bing-dump.html', 'utf-8');

console.log("Total HTML length:", h.length);
console.log("Contains 'b_algo':", h.includes('b_algo'));
console.log("Contains 'b_results':", h.includes('b_results'));
console.log("Contains 'consent':", h.includes('bnp_cookie') || h.includes('bnp_consent'));
console.log("Contains 'captcha':", h.includes('captcha'));

// Find all unique class names that contain 'algo' or 'result'
const classMatches = h.match(/class="[^"]+"/g) || [];
const algoClasses = classMatches.filter(c => c.toLowerCase().includes('algo'));
const resultClasses = classMatches.filter(c => c.toLowerCase().includes('result'));

console.log("\nClasses with 'algo':", algoClasses.length ? algoClasses.slice(0, 10) : 'NONE');
console.log("\nClasses with 'result':", resultClasses.length ? resultClasses.slice(0, 10) : 'NONE');

// Find all h2 elements context
const h2Matches = h.match(/<h2[^>]*>[\s\S]{0,300}/g) || [];
console.log("\nFirst 3 <h2> elements:");
h2Matches.slice(0, 3).forEach((m, i) => console.log(`  [${i}]: ${m.substring(0, 200)}`));

// Find all <a> with href that starts with http
const linkMatches = h.match(/<a[^>]*href="https?:\/\/(?!www\.bing|www\.microsoft)[^"]+"/g) || [];
console.log(`\nExternal links found: ${linkMatches.length}`);
linkMatches.slice(0, 5).forEach((m, i) => console.log(`  [${i}]: ${m.substring(0, 150)}`));

// Check for Bing's cookie consent overlay
if (h.includes('bnp_cookie') || h.includes('id="bnp_ttc_close"') || h.includes('cookie banner')) {
    console.log("\n⚠️ COOKIE CONSENT BANNER DETECTED! This may be blocking results.");
}
