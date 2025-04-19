import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { TranslationManager } from "../services/translation-manager";
import fs from "fs-extra";
import path from "path";
import os from "os";
import dotenv from "dotenv";
import { Server } from "http";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

// Configure middleware
app.use(cors({ origin: "*" })); // Allow all origins
app.use(bodyParser.json({ limit: "50mb" })); // Allow large JSON payloads

// Create temporary directory for storing files
const tempDir = path.join(os.tmpdir(), "node-translation");
fs.ensureDirSync(tempDir);

// Endpoint for translating JSON
app.post("/api/translate", async (req, res) => {
  console.log("Received translation request");
  try {
    const {
      jsonData,
      targetLanguage,
      sourceLanguage = "en",
      apiKey,
    } = req.body;
    console.log("Received translation request", req.body);

    // Validate required fields
    if (!jsonData) return res.status(400).json({ error: "Missing JSON data" });
    if (!targetLanguage)
      return res.status(400).json({ error: "Missing target language" });

    // Set API key if provided
    if (apiKey) {
      process.env.GEMINI_API_KEY = apiKey;
    } else if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ error: "Missing API key" });
    }

    // Create temporary input file
    const timestamp = Date.now();
    const inputFileName = `input-${timestamp}.json`;
    const inputFilePath = path.join(tempDir, inputFileName);
    await fs.writeJSON(inputFilePath, jsonData, { spaces: 2 });

    // Initialize translation manager and translate
    const translationManager = new TranslationManager();
    const outputPath = await translationManager.translateLargeJson({
      inputJsonPath: inputFilePath,
      outputDir: tempDir,
      sourceLanguage,
      targetLanguage,
      chunkSize: 5,
      delayBetweenRequests: 1000,
      saveProgressInterval: 5,
    });

    // Read the output file
    const translatedData = await fs.readJSON(outputPath);

    // Clean up temporary files
    await fs.remove(inputFilePath);
    await fs.remove(outputPath);

    // Return the translated JSON
    res.json({
      success: true,
      translatedData,
      sourceLanguage,
      targetLanguage,
    });
  } catch (error) {
    console.error("Translation API error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

export const startServer = (): Promise<{ server: Server; port: number }> => {
  // Try ports in sequence starting from the configured PORT
  return tryPort(PORT);
};

// Helper function that attempts to start the server on a given port
// and falls back to the next port if it fails
const tryPort = (
  port: number,
  maxAttempts = 10
): Promise<{ server: Server; port: number }> => {
  return new Promise((resolve, reject) => {
    const server = app
      .listen(port)
      .on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          console.log(`Port ${port} is in use, trying ${port + 1}...`);
          if (maxAttempts <= 1) {
            reject(
              new Error(
                "Could not find an available port after maximum attempts"
              )
            );
          } else {
            // Try the next port
            tryPort(port + 1, maxAttempts - 1)
              .then(resolve)
              .catch(reject);
          }
        } else {
          // For other errors, reject with the error
          reject(err);
        }
      })
      .on("listening", () => {
        console.log(`Translation API server running on port ${port}`);
        resolve({ server, port });
      });

    server.timeout = 1000 * 60 * 60 * 24; // 1 day
  });
};

// If this file is run directly
if (require.main === module) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}
