const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://flamercoal-backend.onrender.com';

export const fetchFromApi = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });

    if (!response.ok) {
        const text = await response.text();
        console.error('API Error Response:', text);
        console.error('API Error Status:', response.status);
        throw new Error(text || `API Error: ${response.status}`);
    }

    return response.json();
};

export default API_BASE_URL;
