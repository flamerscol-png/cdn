import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const apiKey = process.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
    console.error("No API key found in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    try {
        let model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        let report = {
            keys: Object.keys(model),
            hasGenerateImages: typeof model.generateImages === 'function',
            result: null
        };

        if (typeof model.generateImages === 'function') {
            const result = await model.generateImages({
                prompt: "A modern futuristic city",
                numberOfImages: 1
            });
            report.result = result;
        } else {
            console.log("Trying generateContent...");
            const result = await model.generateContent("Generate an image of a red square. Return ONLY a base64 encoded string if possible.");
            report.result = result.response.text();
        }

        fs.writeFileSync('out.json', JSON.stringify(report, null, 2), 'utf-8');
        console.log("Wrote out.json");
    } catch (e) {
        fs.writeFileSync('out.json', JSON.stringify({ error: e.message }), 'utf-8');
    }
}

run();
