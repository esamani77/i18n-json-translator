"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationManager = void 0;
const gemini_translator_1 = require("./gemini-translator");
const file_handler_1 = require("../utils/file-handler");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
class TranslationManager {
    constructor() {
        this.translator = new gemini_translator_1.GeminiTranslator();
    }
    async translateLargeJson({ inputJsonPath, outputDir, sourceLanguage, targetLanguage, chunkSize = 10, delayBetweenRequests = 1000, }) {
        // Ensure output directory exists
        fs_extra_1.default.ensureDirSync(outputDir);
        // Read input JSON
        const inputJson = file_handler_1.FileHandler.readJsonFile(inputJsonPath);
        // Generate output filename
        const outputFilename = `translated-${targetLanguage}-${Date.now()}.json`;
        const outputPath = path_1.default.join(outputDir, outputFilename);
        // Translate JSON with chunking
        const translatedJson = await this.translateJsonWithChunking(inputJson, sourceLanguage, targetLanguage, chunkSize, delayBetweenRequests);
        // Write translated JSON
        file_handler_1.FileHandler.writeJsonFile(outputPath, translatedJson);
        console.log(`Translation completed. Output saved to: ${outputPath}`);
        return outputPath;
    }
    async translateJsonWithChunking(jsonObject, sourceLanguage, targetLanguage, chunkSize, delayBetweenRequests) {
        // Flatten the JSON to process in chunks
        const flattenedJson = this.flattenJson(jsonObject);
        const keys = Object.keys(flattenedJson);
        const translatedFlatJson = {};
        // Process in chunks
        for (let i = 0; i < keys.length; i += chunkSize) {
            const chunk = keys.slice(i, i + chunkSize);
            // Translate chunk
            const chunkTranslations = await Promise.all(chunk.map(async (key) => {
                const text = flattenedJson[key];
                // Skip if not a string or empty
                if (typeof text !== "string" || !text.trim()) {
                    return { key, translation: text };
                }
                try {
                    const translation = await this.translator.translate({
                        query: text,
                        source: sourceLanguage,
                        target: targetLanguage,
                    });
                    return { key, translation };
                }
                catch (error) {
                    console.error(`Translation error for key ${key}:`, error);
                    return { key, translation: text }; // Fallback to original text
                }
            }));
            // Add translations
            chunkTranslations.forEach(({ key, translation }) => {
                translatedFlatJson[key] = translation;
            });
            // Delay between chunks to avoid rate limiting
            if (i + chunkSize < keys.length) {
                await new Promise((resolve) => setTimeout(resolve, delayBetweenRequests));
            }
        }
        // Reconstruct the original JSON structure with translated values
        return this.unflattenJson(translatedFlatJson, jsonObject);
    }
    flattenJson(obj, prefix = "", result = {}) {
        if (obj === null || typeof obj !== "object") {
            return result;
        }
        for (const [key, value] of Object.entries(obj)) {
            const newPrefix = prefix ? `${prefix}.${key}` : key;
            if (typeof value === "string") {
                result[newPrefix] = value;
            }
            else if (typeof value === "object" && value !== null) {
                this.flattenJson(value, newPrefix, result);
            }
        }
        return result;
    }
    unflattenJson(flatJson, originalStructure) {
        // Create a deep copy of the original structure
        const result = JSON.parse(JSON.stringify(originalStructure));
        // Recursive helper to set nested values
        const setValue = (obj, path, value) => {
            const lastKey = path.pop();
            const target = path.reduce((acc, key) => acc[key], obj);
            target[lastKey] = value;
        };
        // Iterate through flattened keys
        for (const [flatKey, translation] of Object.entries(flatJson)) {
            const path = flatKey.split(".");
            setValue(result, path, translation);
        }
        return result;
    }
}
exports.TranslationManager = TranslationManager;
