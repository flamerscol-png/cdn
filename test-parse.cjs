const fs = require('fs');

const data = JSON.parse(fs.readFileSync('server/viewstats_text.json', 'utf8'));
const lines = data.allText;

const getMomData = () => {
    const momIdx = lines.findIndex(l => l.toUpperCase() === 'MONTH TO MONTH');
    if (momIdx >= 0) {
        let viewsMOM = null;
        let comparisonDate = null;

        for (let i = momIdx; i < momIdx + 15; i++) {
            if (!lines[i]) continue;
            if (lines[i].includes('(') && lines[i].includes('%')) {
                viewsMOM = lines[i];
                if (lines[i + 1]) {
                    comparisonDate = lines[i + 1];
                }
                break;
            }
        }

        return { viewsMOM, comparisonDate };
    }
    return null;
};

console.log("MoM Data:", getMomData());
