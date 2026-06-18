import express from "express";
import path from "path";
import fs from "fs";
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Initialize Gemini
  let genAI: GoogleGenAI | null = null;
  const getGenAI = () => {
    if (!genAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("CRITICAL: GEMINI_API_KEY is not set in environment variables.");
      } else {
        console.log(`[AI] GEMINI_API_KEY is present (starts with ${apiKey.substring(0, 4)}...)`);
      }
      genAI = new GoogleGenAI({ 
        apiKey: apiKey || "",
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return genAI;
  };

  // Helper for AI calls with automatic maintenance (retry)
  async function callAIWithRetry(modelName: string, contents: any, config: any, retries = 2) {
    let lastError;
    console.log(`[AI] Request model: ${modelName}`);
    
    for (let i = 0; i < retries + 1; i++) {
      try {
        const ai = getGenAI();
        
        // Ensure contents is array of content objects
        const normalizedContents = Array.isArray(contents) ? contents : [{ role: 'user', parts: [{ text: String(contents) }] }];

        // The SDK prefers 'config' but we sanitize it
        const finalConfig = config || {};

        const response = await ai.models.generateContent({
          model: modelName,
          contents: normalizedContents,
          config: finalConfig
        });
        
        if (!response) {
          throw new Error("AI returned no response.");
        }

        let responseText = "";
        try {
          // In some versions it's a method, in others a property (getter)
          const anyResponse = response as any;
          responseText = typeof anyResponse.text === 'function' ? await anyResponse.text() : anyResponse.text;
        } catch (e) {
          console.warn("[AI] text retrieval failed, checking candidates...");
          const candidates = (response as any).candidates;
          if (candidates && candidates.length > 0 && candidates[0].content) {
            const textPart = candidates[0].content.parts.find((p: any) => p.text);
            if (textPart) responseText = textPart.text;
          }
        }
        
        if (!responseText) {
          throw new Error("AI response has no text content.");
        }
        
        console.log(`[AI] Generation successful on attempt ${i + 1}`);
        return responseText;
      } catch (error: any) {
        lastError = error;
        console.warn(`[AI] Attempt ${i + 1} failed:`, error.message);
        
        // Log detailed error for debugging node logs
        if (error.response) {
          console.error("[AI] Error Response:", JSON.stringify(error.response));
        }

        // Handle specific error strings or status codes
        const status = error.status || error.statusCode || (error.response?.status);
        const errMsg = (error.message || "").toLowerCase();
        let is503 = status === 503 || errMsg.includes("503") || errMsg.includes("unavailable") || errMsg.includes("high demand") || errMsg.includes("overloaded");
        if (!is503) {
          try {
            const errStr = JSON.stringify(error).toLowerCase();
            is503 = errStr.includes("503") || errStr.includes("unavailable") || errStr.includes("high demand");
          } catch (_) {}
        }
        
        if (status === 429 || errMsg.includes("quota") || errMsg.includes("exhausted") || errMsg.includes("429")) {
          console.error("[AI] Quota exceeded, stopping retries.");
          throw new Error("QUOTA_EXCEEDED");
        }
        
        if (status === 401 || status === 403 || errMsg.includes("key") || errMsg.includes("unauthorized")) {
          console.error("[AI] API Key issue, stopping retries.");
          throw new Error("API_KEY_ISSUE");
        }

        if (is503) {
          console.warn(`[AI] Detected 503/UNAVAILABLE/High-Demand for model ${modelName}.`);
          if (modelName === "gemini-3.5-flash") {
            modelName = "gemini-3.1-flash-lite";
            console.log(`[AI] Switching fallback model to ${modelName} for subsequent attempts.`);
          }
        }

        // Wait a bit before retry (exponential backoff)
        if (i < retries) {
          const delay = 1000 * (i + 1);
          console.log(`[AI] Retrying in ${delay}ms with model: ${modelName}...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  }

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      ai_configured: !!process.env.GEMINI_API_KEY,
      env: process.env.NODE_ENV
    });
  });

  app.post("/api/save-og-image", (req, res) => {
    try {
      const { image } = req.body;
      if (!image || !image.startsWith("data:image/png;base64,")) {
        return res.status(400).json({ error: "Format gambar tidak valid." });
      }
      const base64Data = image.replace(/^data:image\/png;base64,/, "");
      const publicPath = path.join(process.cwd(), "public", "og-image.png");
      const distPath = path.join(process.cwd(), "dist", "og-image.png");
      
      // Simpan ke folder public utama
      fs.writeFileSync(publicPath, base64Data, "base64");
      
      // Simpan juga ke dist jika folder bundelan produksi sudah ada agar langsung terbaca di preview
      if (fs.existsSync(path.join(process.cwd(), "dist"))) {
        fs.writeFileSync(distPath, base64Data, "base64");
      }
      
      console.log("[SERVER] Sukses menyimpan og-image.png baru.");
      res.json({ success: true, message: "og-image.png berhasil diperbarui secara otomatis ke folder publik." });
    } catch (error: any) {
      console.error("[SERVER] Gagal menyimpan og-image.png:", error);
      res.status(500).json({ error: "Gagal menyimpan file gambar di server." });
    }
  });

  app.post("/api/ai/generate", async (req, res) => {
    try {
      const { model, contents, config } = req.body;
      console.log(`[AI Proxy] ${new Date().toISOString()} | Model: ${model} | Request received`);
      
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("API_KEY_ISSUE");
      }

      const text = await callAIWithRetry(model, contents, config);
      res.json({ text });
    } catch (error: any) {
      console.error(`[AI Proxy Error] ${new Date().toISOString()}:`, error.message);
      
      let status = 500;
      let message = "Maaf, terjadi gangguan teknis saat menyusun blueprint. CommunityOS sedang melakukan pemeliharaan otomatis, silakan coba lagi.";
      
      if (error.message === "QUOTA_EXCEEDED") {
        status = 429;
        message = "Kapasitas AI sedang penuh (Quota Exceeded). Silakan tunggu 1 menit lalu coba lagi.";
      } else if (error.message === "API_KEY_ISSUE") {
        status = 403;
        message = "Koneksi AI terputus. Silakan periksa konfigurasi API Key di panel Settings > Secrets.";
      }

      res.status(status).json({ 
        error: message,
        technical: error.message,
        timestamp: new Date().toISOString()
      });
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
    
    // Even in dev, we can try to inject OG tags if we handle the response
    // But usually dev server doesn't need social previews.
  }

  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath, { index: false }));
  
  app.get("*", (req, res) => {
    const indexPath = path.join(distPath, "index.html");
    const devIndexPath = path.join(process.cwd(), "index.html");
    const actualPath = fs.existsSync(indexPath) ? indexPath : devIndexPath;

    if (fs.existsSync(actualPath)) {
      let html = fs.readFileSync(actualPath, "utf-8");
      
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const fullSiteUrl = `${protocol}://${host}`;
      const currentUrl = `${fullSiteUrl}${req.originalUrl}`;
      
      // Inject absolute URLs for OG tags
      html = html.replace(/https:\/\/communityos\.id\//g, fullSiteUrl + "/");
      html = html.replace(/property="og:url" content="[^"]*"/g, `property="og:url" content="${currentUrl}"`);
      html = html.replace(/name="twitter:url" content="[^"]*"/g, `name="twitter:url" content="${currentUrl}"`);
      
      // Ensure absolute path for images (social proxies need full URLs)
      html = html.replace(/content="\/og-image\.png"/g, `content="${fullSiteUrl}/og-image.png"`);
      html = html.replace(/content="\/icon\.svg"/g, `content="${fullSiteUrl}/icon.svg"`);
      html = html.replace(/href="\/icon\.svg"/g, `href="${fullSiteUrl}/icon.svg"`);
      
      res.send(html);
    } else {
      res.status(404).send("Application entry point missing.");
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
