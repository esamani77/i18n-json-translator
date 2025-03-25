import { GeminiTranslator } from "./gemini-translator";
import { FileHandler } from "../utils/file-handler";
import fs from "fs-extra";
import path from "path";

interface TranslationOptions {
  inputJsonPath: string;
  outputDir: string;
  sourceLanguage: string;
  targetLanguage: string;
  chunkSize?: number;
  delayBetweenRequests?: number;
}

export class TranslationManager {
  private translator: GeminiTranslator;

  constructor() {
    this.translator = new GeminiTranslator();
  }

  async translateLargeJson({
    inputJsonPath,
    outputDir,
    sourceLanguage,
    targetLanguage,
    chunkSize = 10,
    delayBetweenRequests = 1000,
  }: TranslationOptions): Promise<string> {
    // Ensure output directory exists
    fs.ensureDirSync(outputDir);

    // Read input JSON
    const inputJson = FileHandler.readJsonFile(inputJsonPath);

    // Generate output filename
    const outputFilename = `translated-${targetLanguage}-${Date.now()}.json`;
    const outputPath = path.join(outputDir, outputFilename);

    // Translate JSON with chunking
    const translatedJson = await this.translateJsonWithChunking(
      inputJson,
      sourceLanguage,
      targetLanguage,
      chunkSize,
      delayBetweenRequests
    );

    // Write translated JSON
    FileHandler.writeJsonFile(outputPath, translatedJson);

    console.log(`Translation completed. Output saved to: ${outputPath}`);
    return outputPath;
  }

  private async translateJsonWithChunking(
    jsonObject: any,
    sourceLanguage: string,
    targetLanguage: string,
    chunkSize: number,
    delayBetweenRequests: number
  ): Promise<any> {
    // Flatten the JSON to process in chunks
    const flattenedJson = this.flattenJson(jsonObject);
    const keys = Object.keys(flattenedJson);
    const translatedFlatJson: Record<string, string> = {};

    // Process in chunks
    for (let i = 0; i < keys.length; i += chunkSize) {
      const chunk = keys.slice(i, i + chunkSize);

      // Translate chunk
      const chunkTranslations = await Promise.all(
        chunk.map(async (key) => {
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
          } catch (error) {
            console.error(`Translation error for key ${key}:`, error);
            return { key, translation: text }; // Fallback to original text
          }
        })
      );

      // Add translations
      chunkTranslations.forEach(({ key, translation }) => {
        translatedFlatJson[key] = translation;
      });

      // Delay between chunks to avoid rate limiting
      if (i + chunkSize < keys.length) {
        await new Promise((resolve) =>
          setTimeout(resolve, delayBetweenRequests)
        );
      }
    }

    // Reconstruct the original JSON structure with translated values
    return this.unflattenJson(translatedFlatJson, jsonObject);
  }

  private flattenJson(
    obj: any,
    prefix: string = "",
    result: Record<string, string> = {}
  ): Record<string, string> {
    if (obj === null || typeof obj !== "object") {
      return result;
    }

    for (const [key, value] of Object.entries(obj)) {
      const newPrefix = prefix ? `${prefix}.${key}` : key;

      if (typeof value === "string") {
        result[newPrefix] = value;
      } else if (typeof value === "object" && value !== null) {
        this.flattenJson(value, newPrefix, result);
      }
    }

    return result;
  }

  private unflattenJson(
    flatJson: Record<string, string>,
    originalStructure: any
  ): any {
    // Create a deep copy of the original structure
    const result = JSON.parse(JSON.stringify(originalStructure));

    // Recursive helper to set nested values
    const setValue = (obj: any, path: string[], value: string): void => {
      const lastKey = path.pop()!;
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
