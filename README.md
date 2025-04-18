# Node Translation Tool

A powerful Node.js tool for translating JSON files using Google's Gemini API while respecting rate limits.

## Features

- ✅ Translate entire JSON files while preserving structure
- ✅ Built-in rate limiting (15 RPM, 1M TPM, 1.5K RPD)
- ✅ Progress tracking with auto-resume capability
- ✅ Chunked processing for large files
- ✅ Command-line interface
- ✅ RESTful API with CORS support
- ✅ Token usage estimation
- ✅ Detailed progress reporting

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with your Google Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
4. Build the project:
   ```
   npm run build
   ```

## Usage

### Command Line

The basic syntax is:

```
node dist/index.js [inputFile] [targetLanguage]
```

Examples:

```bash
# Translate example-input.json to Farsi (default)
node dist/index.js

# Translate a specific file to Spanish
node dist/index.js ./path/to/file.json es

# Translate to German and show help
node dist/index.js ./content.json de
node dist/index.js --help
```

### API Server

You can also run the tool as an API server that accepts translation requests:

```bash
# Start the API server
npm run api

# Start the API server in development mode
npm run api:dev
```

For detailed API documentation, see [API.md](API.md).

### NPM Scripts

You can also use the following npm scripts:

```bash
# Translate with default settings
npm start

# Translate with custom file and language
npm start -- ./my-file.json fr
```

## Supported Languages

The tool supports all languages available in the Google Gemini API. Use standard language codes (e.g., 'en', 'es', 'fr', 'zh', etc.).

## Input Format

The tool expects a JSON file as input. The JSON structure will be preserved, with all string values being translated.

Example input:

```json
{
  "page": {
    "title": "Welcome to our website",
    "subtitle": "Learn more about our services",
    "navigation": {
      "home": "Home",
      "about": "About Us"
    }
  }
}
```

## Output

The translated JSON will be saved in the specified output directory (default: `./translations`) with a filename that includes the target language and timestamp.

## Rate Limiting

The tool automatically handles rate limiting for the Google Gemini API:

- 15 requests per minute (RPM)
- 1,000,000 tokens per minute (TPM)
- 1,500 requests per day (RPD)

If rate limits are reached, the tool will automatically wait and resume when possible.

## Progress Tracking

Translation progress is saved periodically and can be resumed if the process is interrupted. Progress files are stored in the output directory with the naming pattern `[filename]-[language]-progress.json`.

## Advanced Configuration

When using programmatically, you can configure:

- `chunkSize`: Number of keys to translate per batch (default: 5)
- `delayBetweenRequests`: Delay in milliseconds between chunk requests (default: 1000)
- `saveProgressInterval`: Number of translations before saving progress (default: 5)

## For Developers

See [DEVELOP.md](DEVELOP.md) for detailed development documentation.

## License

MIT
