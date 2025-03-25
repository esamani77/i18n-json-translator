import axios, { AxiosInstance } from "axios";
import dotenv from "dotenv";

dotenv.config();

interface TranslationOptions {
  query: string;
  target: string;
  source: string;
}

export class GeminiTranslator {
  private apiKey: string;
  private instance: AxiosInstance;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("Gemini API key is not set in .env file");
    }

    this.instance = axios.create({
      baseURL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  }

  async translate({
    query,
    target,
    source,
  }: TranslationOptions): Promise<string> {
    try {
      const response = await this.instance.post("", {
        contents: [
          {
            parts: [
              {
                text: `Translate this phrase or vocabulary: "${query}" to ${target} from ${source}. 
                Give me only the translation. If there's an equivalent phrase in ${target} language, 
                provide that phrase. Be the best for ux writing and seo writing.`,
              },
            ],
          },
        ],
      });

      const translation =
        response?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!translation) {
        throw new Error("No translation received");
      }

      return translation;
    } catch (error) {
      console.error("Translation error:", error);
      throw error;
    }
  }
}
