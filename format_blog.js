const fs = require('fs');
const path = 'C:\\Users\\VANSH SINGH\\projects\\main website 3\\src\\data\\blogData.js';
let content = fs.readFileSync(path, 'utf8');

// The file is currently very collapsed. 
// We want to ensure that inside content: `...` strings, double newlines exist for paragraphs.
// This is a bit tricky with regex on a large file, but let's try to identify where newlines should be.

// Better approach: Since it's a JS file, let's try to make it readable.
// I'll use a simple search and replace for common markdown patterns that should have newlines.

content = content.replace(/## /g, '\n\n## ');
content = content.replace(/### /g, '\n\n### ');
content = content.replace(/\n\n\n/g, '\n\n');
content = content.replace(/> \*\*Pro Tip:\*\*/g, '\n\n> **Pro Tip:**');
content = content.replace(/---/g, '\n\n---\n\n');
content = content.replace(/\*   \*\*/g, '\n*   **');
content = content.replace(/- \[ \]/g, '\n- [ ]');

fs.writeFileSync(path, content, 'utf8');
console.log('Formatted blogData.js');
