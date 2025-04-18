"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const translation_manager_1 = require("./services/translation-manager");
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
async function main() {
    try {
        console.log("Starting translation process with rate limiting...");
        console.log("Rate limits: 15 requests/minute, 1,000,000 tokens/minute, 1,500 requests/day");
        const translationManager = new translation_manager_1.TranslationManager();
        // Ensure translations directory exists
        const outputDir = path_1.default.resolve(__dirname, "../translations");
        fs_extra_1.default.ensureDirSync(outputDir);
        // Get command line arguments or use defaults
        const inputFile = process.argv[2] || path_1.default.resolve(__dirname, "../example-input.json");
        const targetLang = process.argv[3] || "fa";
        console.log(`Input file: ${inputFile}`);
        console.log(`Target language: ${targetLang}`);
        console.log(`Output directory: ${outputDir}`);
        const startTime = Date.now();
        const outputPath = await translationManager.translateLargeJson({
            inputJsonPath: inputFile,
            outputDir: outputDir,
            sourceLanguage: "en",
            targetLanguage: targetLang,
            chunkSize: 5, // Smaller chunk size to better manage rate limits
            delayBetweenRequests: 1000, // Small delay between chunks
            saveProgressInterval: 5, // Save progress every 5 translations
        });
        const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
        const elapsedMinutes = Math.floor(elapsedSeconds / 60);
        const remainingSeconds = elapsedSeconds % 60;
        console.log(`Translation process completed successfully in ${elapsedMinutes}m ${remainingSeconds}s.`);
        console.log(`Output saved to: ${outputPath}`);
    }
    catch (error) {
        console.error("Translation process failed:", error);
        process.exit(1);
    }
}
// Provide instructions if run with --help
if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(`
Node Translation CLI

Usage:
  node dist/index.js [inputFile] [targetLanguage]

Examples:
  node dist/index.js                                 # Uses example-input.json and 'fa' as target language
  node dist/index.js ./my-file.json es               # Translates my-file.json to Spanish
  node dist/index.js ./data/content.json zh          # Translates content.json to Chinese
  
Options:
  --help, -h   Show this help message
  `);
    process.exit(0);
}
else {
    // Run the translation
    main();
}
