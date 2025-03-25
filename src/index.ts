import { TranslationManager } from "./services/translation-manager";
import path from "path";

async function main() {
  try {
    const translationManager = new TranslationManager();

    const outputPath = await translationManager.translateLargeJson({
      inputJsonPath: path.resolve(__dirname, "../example-input.json"),
      outputDir: path.resolve(__dirname, "../translations"),
      sourceLanguage: "en",
      targetLanguage: "fa", // Change target language as needed
      chunkSize: 5, // Adjust chunk size to manage API requests
      delayBetweenRequests: 1500, // Add delay between chunks
    });

    console.log("Translation process completed successfully.");
  } catch (error) {
    console.error("Translation process failed:", error);
  }
}

// Run the translation
main();
