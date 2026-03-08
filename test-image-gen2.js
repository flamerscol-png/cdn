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
        let model = genAI.getGenerativeModel({ model: "imagen-3.0-generate-001" });

        let report = {
            keys: Object.keys(model),
            methods: Object.getOwnPropertyNames(Object.getPrototypeOf(model)),
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
            console.log("Trying generateContent with imagen-3.0-generate-001...");
            const result = await model.generateContent("A modern futuristic city");
            report.result = result;
        }

        fs.writeFileSync('out2.json', JSON.stringify(report, null, 2), 'utf-8');
        console.log("Wrote out2.json");
    } catch (e) {
        fs.writeFileSync('out2.json', JSON.stringify({ error: e.message }), 'utf-8');
    }
}

run();
