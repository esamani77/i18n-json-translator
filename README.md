# I18n JSON Translator

## Overview

A powerful Node.js application for translating JSON files across multiple languages using the Google Gemini API. This tool is designed to simplify internationalization (i18n) workflows by automatically translating nested JSON structures.

## Features

- 🌐 Supports complex, nested JSON translations
- 🚀 Chunk-based translation to handle large files
- 🛡️ Robust error handling
- 📦 Preserves original JSON structure
- 🔧 Configurable translation parameters

## Prerequisites

- Node.js (v16+ recommended)
- Google Gemini API Key

## Installation

1. Clone the repository:

```bash
git clone https://github.com/esamani77/i18n-json-translator.git
cd i18n-json-translator
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root:

```
GEMINI_API_KEY=your_google_gemini_api_key_here
```

## Configuration

Edit `src/index.ts` to customize translation settings:

```typescript
await translationManager.translateLargeJson({
  inputJsonPath: "./input.json", // Path to input JSON
  outputDir: "./translations", // Output directory
  sourceLanguage: "en", // Source language code
  targetLanguage: "es", // Target language code
  chunkSize: 5, // Translation chunk size
  delayBetweenRequests: 1500, // Delay between API calls
});
```

## Usage

### Running the Translator

```bash
npm start
```

### Translation Parameters

- `inputJsonPath`: Path to the JSON file you want to translate
- `outputDir`: Directory where translated files will be saved
- `sourceLanguage`: Original language of the JSON (e.g., 'en')
- `targetLanguage`: Target language for translation (e.g., 'es', 'fr')
- `chunkSize`: Number of items to translate in each API request
- `delayBetweenRequests`: Milliseconds between chunk translations

## Example Input JSON

```json
{
  "page": {
    "langs": {
      "en-uk": "English (UK)",
      "en-us": "English (US)"
    },
    "navigation": {
      "home": "Home",
      "about": "About"
    }
  }
}
```

## Supported Languages

The translator supports most languages recognized by the Google Gemini API, including:

- English
- Spanish
- French
- German
- Arabic
- Chinese
- Russian
- And many more!

## Troubleshooting

- Ensure your Gemini API key is valid
- Check internet connectivity
- Verify input JSON structure
- Monitor console for detailed error messages

## Rate Limiting

To prevent API rate limits:

- Adjust `chunkSize` and `delayBetweenRequests`
- Use smaller chunk sizes for large files
- Implement exponential backoff if needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[MIT License]

## Disclaimer

This tool uses the Google Gemini API. Ensure compliance with Google's terms of service and API usage guidelines.

## Support

For issues or questions, please open a GitHub issue or contact the maintainer.
