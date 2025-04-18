# Node Translation Tool - Developer Documentation

This project is a Node.js-based translation tool that leverages the Google Gemini API to translate JSON files while respecting API rate limits. It's designed to handle large JSON structures efficiently, with built-in rate limiting, progress tracking, and resumable translations.

## Architecture

The project follows a modular architecture with the following components:

### Core Components

1. **TranslationManager (`src/services/translation-manager.ts`)**

   - Main service that orchestrates the translation process
   - Handles JSON flattening/unflattening for efficient translation
   - Implements chunking and progress tracking
   - Manages the translation workflow

2. **GeminiTranslator (`src/services/gemini-translator.ts`)**

   - Service responsible for interacting with the Gemini API
   - Implements token estimation for rate limiting
   - Makes the actual API calls for translation

3. **RateLimiter (`src/services/rate-limiter.ts`)**

   - Handles API rate limit tracking and enforcement
   - Implements three levels of rate limiting:
     - 15 requests per minute (RPM)
     - 1,000,000 tokens per minute (TPM)
     - 1,500 requests per day (RPD)
   - Persists rate limit state between runs

4. **FileHandler (`src/utils/file-handler.ts`)**

   - Utility class for file operations
   - Handles reading and writing JSON files

5. **CLI Interface (`src/index.ts`)**
   - Entry point for the application
   - Handles command-line arguments
   - Provides user feedback and progress information

## Rate Limiting Implementation

The rate limiting system is designed to respect the Google Gemini API limits:

- **15 RPM (Requests Per Minute)**: Ensures we don't exceed 15 API calls per minute
- **1,000,000 TPM (Tokens Per Minute)**: Tracks estimated token usage to stay under the token limit
- **1,500 RPD (Requests Per Day)**: Ensures we don't exceed the daily request limit

The implementation involves:

1. **Token Estimation**: Each request's token usage is estimated based on input length
2. **State Persistence**: Rate limit state is saved to a JSON file to track usage across runs
3. **Adaptive Chunking**: The chunk size is dynamically adjusted based on rate limits
4. **Wait Mechanism**: The system automatically waits when limits are approached
5. **Time-based Resets**: Counters automatically reset after the relevant time periods

## Progress Tracking and Resumability

To handle large JSON files and potential interruptions, the system includes:

1. **Translation Progress Tracking**: Records which keys have been translated
2. **Regular Progress Saving**: Saves progress at configurable intervals
3. **Resumable Translations**: Can resume from where it left off if interrupted
4. **Estimated Completion Time**: Provides real-time estimates of remaining time

## Getting Started with Development

### Prerequisites

- Node.js 16+ installed
- Google Gemini API key

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

### Building

Build the TypeScript code:

```
npm run build
```

This will compile TypeScript into the `dist` directory.

### Running Tests

```
npm test
```

## Usage Examples

### Basic Usage

```bash
# Translate example-input.json to Farsi
npm start

# Translate a specific file to Spanish
npm start -- ./path/to/file.json es

# Show help
npm start -- --help
```

### Programmatic Usage

```typescript
import { TranslationManager } from "./services/translation-manager";

async function translateMyFile() {
  const translator = new TranslationManager();
  const result = await translator.translateLargeJson({
    inputJsonPath: "./my-file.json",
    outputDir: "./output",
    sourceLanguage: "en",
    targetLanguage: "ar",
    chunkSize: 5,
    saveProgressInterval: 10,
  });

  console.log(`Translation saved to: ${result}`);
}
```

## Performance Considerations

- **Chunking Size**: Smaller chunks reduce the chance of hitting rate limits but increase overall translation time
- **Memory Usage**: Very large JSON files are processed in chunks to minimize memory usage
- **Token Estimation**: Token estimation is approximate and may not exactly match Gemini's counting method
- **API Availability**: The system handles API errors gracefully and will retry translations

## Extending the Project

### Adding New Translation Providers

To add a new translation service:

1. Create a new translator class in `src/services/`
2. Implement the same interface as GeminiTranslator
3. Update TranslationManager to use your new translator or allow provider selection

### Customizing Rate Limits

Rate limits can be adjusted in `src/services/rate-limiter.ts`:

```typescript
export const RATE_LIMITS = {
  REQUESTS_PER_MINUTE: 15, // Change as needed
  TOKENS_PER_MINUTE: 1_000_000,
  REQUESTS_PER_DAY: 1_500,
};
```

## Troubleshooting

### Rate Limit Errors

If you're still seeing rate limit errors:

1. Reduce the `chunkSize` parameter
2. Increase `delayBetweenRequests`
3. Check if other applications are using the same API key

### Progress File Issues

If progress files aren't being created or read correctly:

1. Ensure the output directory is writable
2. Check for JSON syntax errors in existing progress files
3. Delete corrupt progress files to start fresh

## License

This project is licensed under the MIT License - see the LICENSE file for details.
