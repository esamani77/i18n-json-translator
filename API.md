# Translation API Documentation

This project provides a REST API for translating JSON objects to different languages using Google's Gemini AI model.

## Starting the API Server

```bash
# Install dependencies
npm install

# Start the API server in production
npm run api

# OR start the API server in development mode
npm run api:dev
```

By default, the server will try to run on port 3000. If this port is already in use, the server will automatically try to use the next available port (3001, 3002, etc.).

## Using Docker

You can also run the API server using Docker:

```bash
# Build and start the Docker container
docker build -t node-translation .
docker run -p 3000:3000 -p 3001:3001 -p 3002:3002 -p 3003:3003 --env-file .env node-translation
```

Or with Docker Compose:

```bash
docker-compose up
```

## API Endpoints

### Translate JSON

**URL**: `/api/translate`

**Method**: `POST`

**Request Body**:

```json
{
  "jsonData": {
    "greeting": "Hello",
    "welcome": "Welcome to our application",
    "nested": {
      "item1": "First item",
      "item2": "Second item"
    }
  },
  "targetLanguage": "es",
  "sourceLanguage": "en",
  "apiKey": "YOUR_GEMINI_API_KEY"
}
```

- `jsonData` (required): The JSON object to translate
- `targetLanguage` (required): The ISO code of the target language (e.g., "es" for Spanish)
- `sourceLanguage` (optional): The ISO code of the source language (defaults to "en")
- `apiKey` (optional if set in .env): Your Gemini API key

**Response**:

```json
{
  "success": true,
  "translatedData": {
    "greeting": "Hola",
    "welcome": "Bienvenido a nuestra aplicación",
    "nested": {
      "item1": "Primer elemento",
      "item2": "Segundo elemento"
    }
  },
  "sourceLanguage": "en",
  "targetLanguage": "es"
}
```

### Health Check

**URL**: `/api/health`

**Method**: `GET`

**Response**:

```json
{
  "status": "ok"
}
```

## Example Usage with cURL

```bash
curl -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{
    "jsonData": {
      "greeting": "Hello",
      "welcome": "Welcome to our application"
    },
    "targetLanguage": "fr",
    "apiKey": "YOUR_GEMINI_API_KEY"
  }'
```

## Example Usage with JavaScript Fetch

```javascript
const response = await fetch("http://localhost:3000/api/translate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonData: {
      greeting: "Hello",
      welcome: "Welcome to our application",
    },
    targetLanguage: "de",
    apiKey: "YOUR_GEMINI_API_KEY",
  }),
});

const result = await response.json();
console.log(result.translatedData);
```

## Notes

- The API supports CORS and will accept requests from any origin.
- Large JSON objects might take longer to translate due to rate limiting.
- Progress tracking is automatically handled on the server side.
- Temporary files are created during translation and automatically cleaned up afterward.
- If port 3000 is already in use, the server will automatically try ports 3001, 3002, etc.
