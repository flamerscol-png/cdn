/**
 * Centralized AI Service for FlamerCoal
 * Handles Cerebras API calls for text and JSON generation.
 * (Switched from Groq -> Gemini -> Cerebras)
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = "llama-3.1-8b-instant"; // Fast and capable Llama 3.1 model

/**
 * Calls Cerebras API to generate content.
 * @param {string} systemMsg - The system instructions for the AI.
 * @param {string} userMsg - The user's prompt.
 * @param {boolean} isJson - Whether to expect and parse a JSON response.
 * @returns {Promise<any>} - The generated string or parsed JSON object.
 */
export const callGemini = async (systemMsg, userMsg, isJson = true) => {
    // Keep function name as 'callGemini' so we don't need to refactor all 6 tool files again,
    // but under the hood it uses the lightning-fast Cerebras API!
    
    if (!GROQ_API_KEY) {
        throw new Error("Missing VITE_GROQ_API_KEY. Please check your .env file.");
    }

    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

    const bodyPayload = {
        model: GROQ_MODEL,
        messages: [
            { role: 'system', content: systemMsg },
            { role: 'user', content: userMsg || "Please respond." }
        ],
        temperature: 0.7,
        max_completion_tokens: 8192
    };

    if (isJson) {
        bodyPayload.response_format = { type: "json_object" };
    }

    const config = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyPayload)
    };

    try {
        const response = await fetch(endpoint, config);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `Groq API Error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        if (isJson) {
            try {
                // Parse the clean JSON object returned by the model
                return JSON.parse(content);
            } catch (e) {
                console.error("JSON Parsing Error from Groq:", content);
                throw new Error("Failed to parse AI response as JSON.");
            }
        }

        return content;
    } catch (error) {
        console.error("AiService Error:", error);
        throw error;
    }
};

/**
 * Shorthand for text-only calls.
 */
export const callGeminiText = (systemMsg, userMsg) => callGemini(systemMsg, userMsg, false);

export default {
    generate: callGemini,
    generateText: callGeminiText
};
