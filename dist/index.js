"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const translation_manager_1 = require("./services/translation-manager");
const path_1 = __importDefault(require("path"));
async function main() {
    try {
        const translationManager = new translation_manager_1.TranslationManager();
        const outputPath = await translationManager.translateLargeJson({
            inputJsonPath: path_1.default.resolve(__dirname, "../example-input.json"),
            outputDir: path_1.default.resolve(__dirname, "../translations"),
            sourceLanguage: "en",
            targetLanguage: "fa", // Change target language as needed
            chunkSize: 5, // Adjust chunk size to manage API requests
            delayBetweenRequests: 1500, // Add delay between chunks
        });
        console.log("Translation process completed successfully.");
    }
    catch (error) {
        console.error("Translation process failed:", error);
    }
}
// Run the translation
main();
