import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const apiKey = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    try {
        let model = genAI.getGenerativeModel({ model: "imagen-4.0-fast-generate-001" });

        let report = {
            hasGenerateImages: typeof model.generateImages === 'function',
            result: null
        };

        if (typeof model.generateImages === 'function') {
            console.log("Calling generateImages on imagen-4.0-fast-generate-001...");
            const result = await model.generateImages({
                prompt: "A modern futuristic city",
                numberOfImages: 1
            });
            report.result = result;
        } else {
            console.log("generateImages is not a function. Trying REST API...");

            const payload = {
                instances: [{ prompt: "A modern futuristic city" }],
                parameters: { sampleCount: 1 }
            };

            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            report.result = data;
        }

        fs.writeFileSync('out3.json', JSON.stringify(report, null, 2), 'utf-8');
        console.log("Wrote out3.json");
    } catch (e) {
        fs.writeFileSync('out3.json', JSON.stringify({ error: e.message }), 'utf-8');
    }
}

run();
