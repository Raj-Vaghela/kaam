import { CONFIG } from '../data/config';

const GEMINI_SYSTEM_PROMPT = `You are DesiHelp, the AI assistant for DesiMart.
- You assist with website navigation and product queries.
- If a user has a complex issue (returns, damaged goods), suggest "Escalating to a Human Agent" which will create a ticket in our Odoo CRM.
- Be polite, British English, concise.`;

export const GeminiService = {
    generateContent: async (userPrompt, systemInstruction = GEMINI_SYSTEM_PROMPT) => {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${CONFIG.GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: userPrompt }] }],
                        systemInstruction: { parts: [{ text: systemInstruction }] }
                    })
                }
            );
            if (!response.ok) throw new Error('AI Service Busy');
            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble connecting. Please try again.";
        } catch (error) {
            console.error("Gemini API Error:", error);
            return "Network error. Please check your connection.";
        }
    }
};
