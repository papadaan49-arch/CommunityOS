import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Gemini for server-side use
  // The platform provides GEMINI_API_KEY automatically
  const getApiKey = () => {
    const isBad = (k: string | undefined): boolean => 
      !k || k.trim() === "" || k === "undefined" || k === "null" || k === "your_api_key_here" || k.length < 10;
    
    let key = process.env.GEMINI_API_KEY;
    if (!isBad(key)) return key!.trim();
    
    key = process.env.API_KEY;
    if (!isBad(key)) return key!.trim();
    
    key = process.env.GOOGLE_API_KEY;
    if (!isBad(key)) return key!.trim();

    return null;
  };

  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.error("FATAL: No valid Gemini API key found. API_KEY and GEMINI_API_KEY are missing or invalid.");
  } else {
    console.log(`Gemini API Key detected (length: ${apiKey.length}, starts with: ${apiKey.substring(0, 4)}...)`);
  }

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Gemini Proxy Route - Secure server-side handling
  app.post("/api/gemini", async (req, res) => {
    const currentKey = getApiKey();
    if (!currentKey) {
      console.error("Gemini Proxy Error: No API key found.");
      return res.status(500).json({ 
        error: "Sistem AI tidak terhubung. Harap pastikan API Key (GEMINI_API_KEY) sudah terkonfigurasi di panel Secrets AI Studio." 
      });
    }

    try {
      const { model, contents, config } = req.body;
      if (!model || !contents) {
        return res.status(400).json({ error: "Missing model or contents" });
      }

      console.log(`[Gemini Proxy] Model: ${model}, Key length: ${currentKey.length}`);

      // Correct SDK Initialization according to @google/genai skill
      const ai = new GoogleGenAI({ apiKey: currentKey });
      
      // Extract and normalize generation config
      const generationConfig = config?.generationConfig || config || {};
      
      // Use ai.models.generateContent directly as per skill recommendation
      const response = await ai.models.generateContent({
        model: model,
        contents: contents, // Should be string or Content[]
        config: generationConfig
      });

      // .text is a property, not a method
      const text = response.text || "";

      res.json({ text });
    } catch (error: any) {
      console.error("Gemini server proxy error:", error);
      
      // Extract deep error message if available
      const technicalError = error.message || "Unknown error";
      
      // Map raw technical errors to friendly operational messages
      let friendlyMessage = "Maaf, sistem AI sedang mengalami gangguan sinkronisasi.";
      let statusCode = 500;

      if (technicalError.includes("API_KEY_INVALID") || technicalError.includes("403") || technicalError.includes("401")) {
        friendlyMessage = "Validasi API Key gagal. Harap periksa apakah API Key (GEMINI_API_KEY) sudah benar dan aktif di AI Studio Secrets.";
        statusCode = 401;
      } else if (technicalError.includes("INVALID_ARGUMENT") || technicalError.includes("400")) {
        friendlyMessage = "Permintaan AI tidak valid. Mohon coba deskripsi yang berbeda atau periksa parameter model.";
        statusCode = 400;
      } else if (technicalError.includes("SAFETY")) {
        friendlyMessage = "Konten terblokir oleh filter keamanan AI. Harap gunakan bahasa yang lebih umum.";
      } else if (technicalError.includes("quota") || technicalError.includes("429")) {
        friendlyMessage = "Limit penggunaan AI tercapai. Silakan coba lagi beberapa saat lagi.";
        statusCode = 429;
      }

      res.status(statusCode).json({ error: friendlyMessage, technical: technicalError });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
