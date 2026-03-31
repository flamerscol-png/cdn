/**
 * Centralized AI Service for FlamerCoal
 * Handles AI generation via backend proxy to avoid CORS and secure API keys.
 */

import API_BASE_URL from './api';

/**
 * Calls Backend AI Proxy to generate content.
 * @param {string} systemMsg - The system instructions for the AI.
 * @param {string} userMsg - The user's prompt.
 * @param {boolean} isJson - Whether to expect and parse a JSON response.
 * @returns {Promise<any>} - The generated string or parsed JSON object.
 */
export const callGemini = async (systemMsg, userMsg, isJson = true, model = null) => {
    // Keep function name as 'callGemini' for compatibility with existing tools.
    
    const endpoint = `${API_BASE_URL}/api/ai/generate`;

    const config = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            systemMsg,
            userMsg,
            isJson,
            model
        })
    };

    try {
        const response = await fetch(endpoint, config);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `AI Proxy Error: ${response.status}`);
        }

        const data = await response.json();
        
        // If it was a text-only call, the backend returns { content: "..." }
        if (!isJson && data.content) {
            return data.content;
        }

        return data;
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
