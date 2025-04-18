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
const rate_limiter_1 = require("./rate-limiter");
class TranslationManager {
    constructor() {
        this.translator = new gemini_translator_1.GeminiTranslator();
    }
    async translateLargeJson({ inputJsonPath, outputDir, sourceLanguage, targetLanguage, chunkSize = 5, // Reduced default chunk size to avoid hitting rate limits
    delayBetweenRequests = 1000, saveProgressInterval = 10, }) {
        // Ensure output directory exists
        fs_extra_1.default.ensureDirSync(outputDir);
        // Read input JSON
        const inputJson = file_handler_1.FileHandler.readJsonFile(inputJsonPath);
        // Generate output filename and progress filename
        const outputBasename = path_1.default.basename(inputJsonPath, path_1.default.extname(inputJsonPath));
        const outputFilename = `${outputBasename}-${targetLanguage}-${Date.now()}.json`;
        const outputPath = path_1.default.join(outputDir, outputFilename);
        const progressFilename = `${outputBasename}-${targetLanguage}-progress.json`;
        const progressFilePath = path_1.default.join(outputDir, progressFilename);
        // Translate JSON with chunking and progress tracking
        const translatedJson = await this.translateJsonWithChunking(inputJson, sourceLanguage, targetLanguage, chunkSize, delayBetweenRequests, progressFilePath, saveProgressInterval);
        // Write translated JSON
        file_handler_1.FileHandler.writeJsonFile(outputPath, translatedJson);
        // Clean up progress file if translation completed successfully
        if (fs_extra_1.default.existsSync(progressFilePath)) {
            fs_extra_1.default.removeSync(progressFilePath);
        }
        console.log(`Translation completed. Output saved to: ${outputPath}`);
        return outputPath;
    }
    async translateJsonWithChunking(jsonObject, sourceLanguage, targetLanguage, chunkSize, delayBetweenRequests, progressFilePath, saveProgressInterval) {
        // Flatten the JSON to process in chunks
        const flattenedJson = this.flattenJson(jsonObject);
        const keys = Object.keys(flattenedJson);
        let progress;
        // Check if there's a saved progress
        if (fs_extra_1.default.existsSync(progressFilePath)) {
            try {
                progress = fs_extra_1.default.readJSONSync(progressFilePath);
                console.log(`Resuming translation from saved progress. Completed: ${progress.completedKeys.length}/${progress.totalKeys} keys`);
            }
            catch (error) {
                console.warn("Could not load progress file, starting fresh", error);
                progress = this.initializeProgress(keys);
            }
        }
        else {
            progress = this.initializeProgress(keys);
        }
        // Calculate remaining keys to process
        const remainingKeys = keys.filter((key) => !progress.completedKeys.includes(key));
        // Process remaining keys in chunks
        let processedSinceLastSave = 0;
        let currentChunkSize = this.calculateOptimalChunkSize(chunkSize, remainingKeys.length);
        for (let i = 0; i < remainingKeys.length; i += currentChunkSize) {
            // Recalculate optimal chunk size periodically based on rate limits
            if (i % (currentChunkSize * 5) === 0) {
                currentChunkSize = this.calculateOptimalChunkSize(chunkSize, remainingKeys.length - i);
            }
            const chunk = remainingKeys.slice(i, i + currentChunkSize);
            const estimatedCompletion = this.estimateCompletion(progress.startTime, progress.completedKeys.length, keys.length);
            console.log(`Processing chunk ${Math.floor(i / currentChunkSize) + 1}/${Math.ceil(remainingKeys.length / currentChunkSize)}, Keys: ${progress.completedKeys.length}/${keys.length}, Estimated completion: ${estimatedCompletion}`);
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
            // Update progress
            chunkTranslations.forEach(({ key, translation }) => {
                progress.translatedFlatJson[key] = translation;
                progress.completedKeys.push(key);
            });
            processedSinceLastSave += chunk.length;
            // Save progress periodically
            if (processedSinceLastSave >= saveProgressInterval) {
                await this.saveProgress(progressFilePath, progress);
                processedSinceLastSave = 0;
            }
            // No need for explicit delay as the rate limiter handles it internally,
            // but we can add a small delay between chunks to spread the load
            if (i + currentChunkSize < remainingKeys.length) {
                await new Promise((resolve) => setTimeout(resolve, delayBetweenRequests));
            }
        }
        // Final save of progress
        await this.saveProgress(progressFilePath, progress);
        // Reconstruct the original JSON structure with translated values
        return this.unflattenJson(progress.translatedFlatJson, jsonObject);
    }
    initializeProgress(keys) {
        return {
            completedKeys: [],
            translatedFlatJson: {},
            startTime: Date.now(),
            totalKeys: keys.length,
        };
    }
    async saveProgress(progressFilePath, progress) {
        try {
            await fs_extra_1.default.writeJSON(progressFilePath, progress, { spaces: 2 });
            console.log(`Progress saved. Completed ${progress.completedKeys.length}/${progress.totalKeys} keys.`);
        }
        catch (error) {
            console.error("Failed to save translation progress", error);
        }
    }
    calculateOptimalChunkSize(baseChunkSize, remainingKeys) {
        // Adjust chunk size based on rate limits
        // We want to ensure we don't exceed the RPM limit
        const optimalChunkSize = Math.min(baseChunkSize, Math.floor(rate_limiter_1.RATE_LIMITS.REQUESTS_PER_MINUTE / 2), // Use half the RPM limit to be safe
        Math.floor(rate_limiter_1.RATE_LIMITS.REQUESTS_PER_DAY / 10) // Ensure we don't hit the daily limit too quickly
        );
        // Ensure chunk size is at least 1
        return Math.max(1, Math.min(optimalChunkSize, remainingKeys));
    }
    estimateCompletion(startTime, completedKeys, totalKeys) {
        if (completedKeys === 0) {
            return "Calculating...";
        }
        const elapsedMs = Date.now() - startTime;
        const msPerKey = elapsedMs / completedKeys;
        const remainingKeys = totalKeys - completedKeys;
        const remainingMs = msPerKey * remainingKeys;
        // Format the remaining time
        const remainingMinutes = Math.floor(remainingMs / 60000);
        const remainingHours = Math.floor(remainingMinutes / 60);
        if (remainingHours > 1) {
            return `~${remainingHours} hours ${remainingMinutes % 60} minutes`;
        }
        else if (remainingMinutes > 1) {
            return `~${remainingMinutes} minutes`;
        }
        else {
            return "Less than a minute";
        }
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
