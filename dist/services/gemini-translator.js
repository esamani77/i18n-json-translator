"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiTranslator = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const rate_limiter_1 = require("./rate-limiter");
dotenv_1.default.config();
class GeminiTranslator {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || "";
        if (!this.apiKey) {
            throw new Error("Gemini API key is not set in .env file");
        }
        this.instance = axios_1.default.create({
            baseURL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });
        this.rateLimiter = new rate_limiter_1.RateLimiter();
    }
    // Helper to estimate token count based on text length
    estimateTokens(text) {
        // Rough estimation: 1 token ≈ 4 characters for English text
        return Math.ceil(text.length / 4);
    }
    async translate({ query, target, source, }) {
        try {
            const prompt = `Translate this phrase or vocabulary: ${query} to ${target} from ${source}. 
Give me only the translation. If there's an equivalent phrase in ${target} language, provide that phrase. 
Be the best for UX writing and SEO writing: keep it short, natural, clear, and human-friendly. Prioritize meaning, 
tone, and context over literal translation.

UX & SEO Writing Guidelines to follow:
1. Use clear, keyword-rich language.
2. Prioritize plain, natural tone—avoid robotic or overly formal phrasing.
3. Keep translations concise; remove unnecessary words.
4. Make content scannable and readable (especially for web/app UI).
5. If applicable, favor phrases that work well in headings or buttons.
6. Use terms that real users would actually search for or click on.
7. Maintain emotional tone and helpful intent (e.g., encouragement, clarity, action).
8. Preserve the tone and style of the original phrase—whether it's friendly, formal, playful, or serious.
9. Keep the **base meaning** of the original phrase intact—do not oversimplify or reinterpret.
`;
            // Estimate tokens for the request (prompt + response)
            const estimatedTokens = this.estimateTokens(prompt) + this.estimateTokens(query) * 2;
            // Wait for rate limit to allow the request
            await this.rateLimiter.waitForRateLimit(estimatedTokens);
            const response = await this.instance.post("", {
                contents: [
                    {
                        parts: [
                            {
                                text: prompt,
                            },
                        ],
                    },
                ],
            });
            // Record the request
            await this.rateLimiter.recordRequest(estimatedTokens);
            const translation = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (!translation) {
                throw new Error("No translation received");
            }
            return translation;
        }
        catch (error) {
            console.error("Translation error:", error);
            throw error;
        }
    }
}
exports.GeminiTranslator = GeminiTranslator;
