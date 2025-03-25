#!/usr/bin/env node
import { program } from "commander";
import path from "path";
import { TranslationManager } from "../dist/services/translation-manager";

async function main() {
  program
    .version("1.0.0")
    .description("Translate JSON files using Google Gemini API")
    .option("-i, --input <path>", "Input JSON file path", "input.json")
    .option("-o, --output <dir>", "Output directory", "translations")
    .option("-s, --source <lang>", "Source language", "en")
    .option("-t, --target <lang>", "Target language", "es")
    .option("-c, --chunk-size <number>", "Chunk size for translation", "5")
    .option("-d, --delay <ms>", "Delay between requests", "1500")
    .parse(process.argv);

  const options = program.opts();

  try {
    const translationManager = new TranslationManager();

    const inputPath = path.resolve(process.cwd(), options.input);
    const outputPath = path.resolve(process.cwd(), options.output);

    await translationManager.translateLargeJson({
      inputJsonPath: inputPath,
      outputDir: outputPath,
      sourceLanguage: options.source,
      targetLanguage: options.target,
      chunkSize: parseInt(options.chunkSize, 10),
      delayBetweenRequests: parseInt(options.delay, 10),
    });

    console.log("Translation completed successfully.");
  } catch (error) {
    console.error("Translation failed:", error);
    process.exit(1);
  }
}

main();
