import axios from 'axios';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const groqClient = axios.create({
    baseURL: GROQ_API_URL,
    headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
    }
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const callGroq = async (systemPrompt, userPrompt, model = 'openai/gpt-oss-120b', maxTokens = 1200) => {
    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_key') {
        console.warn("Groq API Key is missing. Returning placeholder response.");
        return `[Placeholder response for prompt: ${userPrompt.substring(0, 50)}...]`;
    }

    let retries = 0;
    const maxRetries = 3;
    let baseDelay = 30000; // 30 seconds
    let currentModel = model;

    while (retries <= maxRetries) {
        try {
            const response = await groqClient.post('', {
                model: currentModel,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: maxTokens
            });
            return response.data.choices[0].message.content;
        } catch (error) {
            const status = error.response?.status;
            if (status === 404 && currentModel !== 'openai/gpt-oss-120b') {
                console.warn(`Model "${currentModel}" not found (404). Falling back to "openai/gpt-oss-120b"...`);
                currentModel = 'openai/gpt-oss-120b';
                continue;
            }
            if (status === 429 && retries < maxRetries) {
                console.warn(`Groq Rate limit (429) reached. Retrying in ${baseDelay / 1000}s... (Attempt ${retries + 1}/${maxRetries})`);
                await sleep(baseDelay);
                retries++;
                baseDelay *= 2; // Exponential backoff
            } else {
                console.error('Error calling Groq API:', error);
                throw new Error(error.response?.data?.error?.message || 'Failed to call Groq API');
            }
        }
    }
};
