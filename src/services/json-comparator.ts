import { GeminiTranslator } from "./gemini-translator";

interface JsonComparisonOptions {
  baseJson: Record<string, any>;
  targetJson: Record<string, any>;
  sourceLanguage: string;
  targetLanguage: string;
}

interface ComparisonResult {
  updatedJson: Record<string, any>;
  updatedKeys: string[];
  statistics: {
    totalKeys: number;
    updatedKeys: number;
    unchangedKeys: number;
  };
}

/**
 * Service to compare two JSON objects and improve target language translation
 * based on specific rules
 */
export class JsonComparator {
  private translator: GeminiTranslator;

  constructor() {
    this.translator = new GeminiTranslator();
  }

  /**
   * Compare base and target JSON objects and improve translations where needed
   * Rule: If the target value is longer than the base value, retranslate it
   */
  async compareAndImprove({
    baseJson,
    targetJson,
    sourceLanguage,
    targetLanguage,
  }: JsonComparisonOptions): Promise<ComparisonResult> {
    // Flatten both JSON objects for easier comparison
    const flatBaseJson = this.flattenJson(baseJson);
    const flatTargetJson = this.flattenJson(targetJson);

    // Statistics tracking
    const statistics = {
      totalKeys: Object.keys(flatBaseJson).length,
      updatedKeys: 0,
      unchangedKeys: 0,
    };

    // Keep track of updated keys
    const updatedKeys: string[] = [];

    // Create a copy of the target JSON for updates
    const updatedFlatJson = { ...flatTargetJson };

    // Compare each key
    for (const [key, baseValue] of Object.entries(flatBaseJson)) {
      const targetValue = flatTargetJson[key];

      // Skip if:
      // - Key doesn't exist in target
      // - Value isn't a string in either object
      // - Base value is empty
      if (
        targetValue === undefined ||
        typeof baseValue !== "string" ||
        typeof targetValue !== "string" ||
        !baseValue.trim()
      ) {
        continue;
      }

      // Apply the rule: If target value is longer than base value, retranslate
      if (targetValue.length > baseValue.length) {
        try {
          const improvedTranslation = await this.translator.translate({
            query: baseValue,
            source: sourceLanguage,
            target: targetLanguage,
          });

          // Update the target JSON with improved translation
          updatedFlatJson[key] = improvedTranslation;
          updatedKeys.push(key);
          statistics.updatedKeys++;
        } catch (error) {
          console.error(`Error improving translation for key ${key}:`, error);
          // Keep original translation on error
          statistics.unchangedKeys++;
        }
      } else {
        statistics.unchangedKeys++;
      }
    }

    // Reconstruct the original structure with updated values
    const updatedJson = this.unflattenJson(updatedFlatJson);

    return {
      updatedJson,
      updatedKeys,
      statistics,
    };
  }

  /**
   * Flattens a nested JSON object into a single-level object with dot-notation keys
   */
  private flattenJson(
    obj: any,
    prefix: string = "",
    result: Record<string, any> = {}
  ): Record<string, any> {
    // Handle primitive values (strings, numbers, booleans, null)
    if (obj === null || typeof obj !== "object") {
      result[prefix] = obj;
      return result;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        this.flattenJson(item, `${prefix}[${index}]`, result);
      });
      return result;
    }

    // Handle objects
    Object.entries(obj).forEach(([key, value]) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      this.flattenJson(value, newKey, result);
    });

    return result;
  }

  /**
   * Unflatten a dot-notation object back into a nested structure
   */
  private unflattenJson(flatJson: Record<string, any>): any {
    const result: any = {};

    // Helper function to set a value at a path in the result object
    const setValue = (obj: any, path: string[], value: any): void => {
      const key = path[0];

      // Check if this is an array index
      const arrayMatch = key.match(/^(.*)\[(\d+)\]$/);

      if (path.length === 1) {
        // Base case: set the value
        if (arrayMatch) {
          // This is an array index
          const arrayKey = arrayMatch[1];
          const index = parseInt(arrayMatch[2], 10);

          if (!obj[arrayKey]) obj[arrayKey] = [];
          obj[arrayKey][index] = value;
        } else {
          // Regular object property
          obj[key] = value;
        }
      } else {
        // Recursive case: navigate deeper
        if (arrayMatch) {
          // This is an array index
          const arrayKey = arrayMatch[1];
          const index = parseInt(arrayMatch[2], 10);

          if (!obj[arrayKey]) obj[arrayKey] = [];
          if (!obj[arrayKey][index]) obj[arrayKey][index] = {};

          setValue(obj[arrayKey][index], path.slice(1), value);
        } else {
          // Regular object property
          if (!obj[key]) obj[key] = {};
          setValue(obj[key], path.slice(1), value);
        }
      }
    };

    // Process each flattened key
    for (const [key, value] of Object.entries(flatJson)) {
      const path = key.split(".");
      setValue(result, path, value);
    }

    return result;
  }
}
