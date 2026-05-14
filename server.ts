import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Gemini for server-side use
  // Priority: API_KEY (selected paid key) > GEMINI_API_KEY (platform free key)
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("FATAL: No Gemini API key found (GEMINI_API_KEY or API_KEY). Please configure secrets in AI Studio.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey || "" });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Gemini Proxy Route - Secure server-side handling
  app.post("/api/gemini", async (req, res) => {
    if (!apiKey) {
      return res.status(500).json({ 
        error: "Sistem AI tidak terhubung. Harap pastikan API Key sudah terkonfigurasi di panel Secrets." 
      });
    }

    try {
      const { model, contents, config } = req.body;
      if (!model || !contents) {
        return res.status(400).json({ error: "Missing model or contents" });
      }

      // Handle nested config if sent from frontend incorrectly
      const generationConfig = config?.generationConfig || config;

      const response = await ai.models.generateContent({
        model,
        contents,
        config: generationConfig
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini server proxy error:", error);
      
      // Map raw technical errors to friendly operational messages as requested
      let friendlyMessage = "Maaf, sistem AI sedang mengalami gangguan sinkronisasi.";
      if (error.message?.includes("API_KEY_INVALID")) {
        friendlyMessage = "Validasi API Key gagal. Harap periksa konfigurasi Secrets di AI Studio.";
      } else if (error.message?.includes("INVALID_ARGUMENT")) {
        friendlyMessage = "Terjadi kesalahan argumen pada permintaan AI. Tim operasional sedang meninjau.";
      }

      res.status(500).json({ error: friendlyMessage, technical: error.message });
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
