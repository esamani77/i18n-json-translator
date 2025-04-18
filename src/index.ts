import { TranslationManager } from "./services/translation-manager";
import path from "path";
import fs from "fs-extra";
import { startServer } from "./api/server";

async function main(): Promise<void> {
  // Check if API mode is requested
  if (process.argv.includes("--api")) {
    try {
      const { port } = await startServer();
      console.log(`API server is running on port ${port}`);
    } catch (error) {
      console.error("Failed to start API server:", error);
      process.exit(1);
    }
    return;
  }

  try {
    console.log("Starting translation process with rate limiting...");
    console.log(
      "Rate limits: 15 requests/minute, 1,000,000 tokens/minute, 1,500 requests/day"
    );

    const translationManager = new TranslationManager();

    // Ensure translations directory exists
    const outputDir = path.resolve(__dirname, "../translations");
    fs.ensureDirSync(outputDir);

    // Get command line arguments or use defaults
    const inputFile =
      process.argv[2] || path.resolve(__dirname, "../example-input.json");
    const targetLang = "fa";

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

    console.log(
      `Translation process completed successfully in ${elapsedMinutes}m ${remainingSeconds}s.`
    );
    console.log(`Output saved to: ${outputPath}`);
  } catch (error) {
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
  node dist/index.js --api                        # Start the API server

Examples:
  node dist/index.js                             # Uses example-input.json and 'fa' as target language
  node dist/index.js ./my-file.json es           # Translates my-file.json to Spanish
  node dist/index.js ./data/content.json zh      # Translates content.json to Chinese
  
Options:
  --help, -h   Show this help message
  --api        Start the API server
  `);
  process.exit(0);
} else {
  // Run the translation
  main();
}
