import { Blueprint, EventData } from "../types";
import { GoogleGenAI } from "@google/genai";

// Model options
export const MODELS = {
  DEFAULT: "gemini-3-flash-preview",
  ADVANCED: "gemini-3-flash-preview" // Standardizing on Flash for stability as per "simple stable beta" goal
};

// Initialize Gemini directly in the frontend
// Standardizing on process.env.GEMINI_API_KEY
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is missing. AI features will fail.");
    }
    aiClient = new GoogleGenAI({ apiKey: key || "" });
  }
  return aiClient;
}

async function callGemini(model: string, contents: any, config?: any) {
  try {
    const ai = getGeminiClient();
    const generationConfig = config?.generationConfig || config || {};
    
    // Correct @google/genai v1 calling pattern
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: generationConfig
    });

    return { text: response.text || "" };
  } catch (error: any) {
    const technicalError = error.message || "Unknown error";
    console.error("Gemini call failed:", technicalError);
    
    // Provide more specific feedback if possible, but keep it human-centered
    if (technicalError.includes("429") || technicalError.includes("quota")) {
      throw new Error("Kapasitas AI sedang penuh (Quota Exceeded). Silakan tunggu 1 menit lalu coba lagi.");
    }
    
    if (technicalError.includes("API_KEY_INVALID") || technicalError.includes("403")) {
      throw new Error("Koneksi AI terputus. Silakan periksa konfigurasi API Key di panel Settings.");
    }

    throw new Error("Maaf, terjadi gangguan teknis saat menyusun blueprint. Silakan coba lagi dalam beberapa saat.");
  }
}

function extractJSON(text: string): string {
  try {
    const firstOpen = text.indexOf('{');
    if (firstOpen === -1) return text;

    let braceCount = 0;
    let firstBraceIndex = -1;
    let inString = false;
    let escape = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (char === '"' && !escape) {
        inString = !inString;
      }

      if (inString) {
        if (char === '\\') {
          escape = !escape;
        } else {
          escape = false;
        }
        continue;
      }

      if (char === '{') {
        if (braceCount === 0) firstBraceIndex = i;
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0 && firstBraceIndex !== -1) {
          return text.substring(firstBraceIndex, i + 1);
        }
      }
    }
  } catch (e) {
    console.error("Failed to extract JSON from text:", e);
  }
  return text;
}

export async function validateInputWithAI(data: EventData): Promise<{ isValid: boolean; message?: string }> {
  try {
    const prompt = `
      System: CommunityOS (Critical & Analytical Mentor).
      Input: Event "${data.name}", Goal "${data.goal}".
      
      Task: Analyze logic & substance.
      - If simple (e.g., "Gathering"): set isValid=true but provide tactical mentoring in 'message'.
      - Only set isValid=false if content is spam, nonsensical, or unethical.
      
      Output JSON: { "isValid": boolean, "message": "Strategic insight" }
    `;

    const result = await callGemini(MODELS.DEFAULT, prompt, {
      responseMimeType: "application/json",
    });

    let rawText = result.text || "{}";
    rawText = extractJSON(rawText);
    
    const parsed = JSON.parse(rawText);
    return {
      isValid: parsed.isValid ?? true,
      message: parsed.message
    };
  } catch (error) {
    // If AI fails, we allow local basic validation as fallback
    if (data.name.length < 3 || data.goal.length < 5) {
      return { 
        isValid: false, 
        message: "Input kegiatan masih terlalu singkat untuk dianalisis secara realistis. Tambahkan detail agar CommunityOS bisa memberikan blueprint yang lebih akurat." 
      };
    }
    return { isValid: true };
  }
}

export async function generateBlueprint(data: EventData & { mode?: 'quick' | 'strategic' }): Promise<Blueprint> {
  try {
    const isStrategic = data.mode === 'strategic';
    const modeInstruction = isStrategic 
      ? 'Mode: Strategis. Berikan perencanaan operasional yang mendalam dan komprehensif, analisis risiko yang detail, dan strategi kemitraan yang kuat. Pikirkan pertumbuhan komunitas jangka panjang.'
      : 'Mode: Quick (Gerilya). Fokus pada kecepatan taktis, kreativitas sumber daya, dan eksekusi manual berdampak tinggi dengan kerumitan minimal.';

    const prompt = `
      Anda adalah CommunityOS Intelligence, sebuah sistem yang berpikir berdasarkan data perkembangan, pengalaman lapangan, dan pola pertumbuhan komunitas di Indonesia. Tugas Anda adalah melampaui logika generik AI untuk memberikan blueprint yang kritis dan operasional.

      ${modeInstruction}
      
      ANALISIS DATA & PENGALAMAN (Data Speaking):
      - Organisasi: ${data.organization}
      - Lokasi & Realitas Lapangan: ${data.location} (Analisis karakteristik lokalitas ini secara kritis).
      - Konteks Pertumbuhan: ${data.previous_context ? `Gunakan data sejarah ini sebagai 'pengalaman operasional' untuk menentukan langkah evolusi: ${data.previous_context}` : 'Ini adalah data awal. Bangun benchmark data untuk pertumbuhan masa depan.'}
      - Budget & Tekanan Sumber Daya: Rp ${data.budget.toLocaleString("id-ID")} (Analisis efisiensi biaya secara ketat).
      - Tujuan: ${data.goal}

      PRINSIP BERPIKIR (Critical Analytics):
      1. DATA-DRIVEN: Setiap komponen rundown dan budget harus memiliki alasan operasional yang kuat, bukan sekadar pelengkap.
      2. GROWTH MINDSET: Hubungkan inisiatif ini dengan potensi perkembangan jangka panjang komunitas. Jika ini acara ke-2 atau ke-3, tunjukkan peningkatan kualitas/efisiensi.
      3. WELLBEING GUARD: Gunakan data beban kerja vs jumlah panitia (${data.staff}) untuk menilai risiko lelah secara pragmatis.
      4. LOCAL TACTICAL: Segala saran harus bisa dieksekusi di ${data.location} dengan memperhitungkan ekosistem lokal.

      Output JSON (Valid & Tanpa Markdown):
      {
        "event_meta": {
          "title": "...",
          "location": "...",
          "budget": 0,
          "strategy": "Analisis kritis yang menghubungkan data pengalaman dan taktik lokasi",
          "scale_classification": "Gerilya Scale",
          "operational_complexity": 50,
          "burnout_risk": 50,
          "budget_pressure": 50,
          "coordination_intensity": 50
        },
        "wellbeing_guard": {
          "risk_level": "Green",
          "burnout_analysis": "Analisis berbasis data beban kerja",
          "fatigue_analysis": "Prediksi kelelahan berdasarkan pengalaman operasional",
          "action_items": ["Langkah nyata 1", "Langkah nyata 2"]
        },
        "operational": {
          "budget_allocation": [ { "item": "Alokasi", "amount": 0, "label": "Catatan kritis efisiensi biaya" } ],
          "rundown": [ { "time": "HH:mm", "task": "Aktivitas Taktis" } ]
        },
        "outreach": {
          "local_partners": ["Partner spesifik yang relevan dengan data lokasi"],
          "ig_caption": "Copywriting humanis berbasis data pertumbuhan"
        }
      }
    `;

    const isComplex = data.goal.length > 300 || (data.previous_context && data.previous_context.length > 200);
    const targetModel = isComplex ? MODELS.ADVANCED : MODELS.DEFAULT;

    // For simplicity, keeping the structured prompt and using responseMimeType.
    const result = await callGemini(targetModel, prompt, {
      responseMimeType: "application/json",
    });

    let rawText = result.text || "{}";
    rawText = extractJSON(rawText);

    const blueprint = JSON.parse(rawText) as Blueprint;
    
    if (!blueprint.event_meta || !blueprint.wellbeing_guard || !blueprint.operational || !blueprint.outreach) {
      throw new Error("Format blueprint yang diterima dari AI tidak valid.");
    }

    return blueprint;
  } catch (error: any) {
    console.error("Blueprint generation failed:", error);
    throw error;
  }
}

export async function refineBlueprint(currentBlueprint: Blueprint, instructions: string, originalData: EventData): Promise<Blueprint> {
  try {
    const prompt = `
      Anda adalah CommunityOS Intelligence. Gunakan logika kritis dan data perkembangan untuk MEMPERBARUI blueprint ini. Jadikan setiap revisi sebagai langkah evolusi berbasis data dan pengalaman instruksi.

      DATA BLUEPRINT SAAT INI (Benchmark):
      - Judul: ${currentBlueprint.event_meta.title}
      - Lokasi: ${currentBlueprint.event_meta.location}
      - Skala & Strategi: ${currentBlueprint.event_meta.scale_classification} | ${currentBlueprint.event_meta.strategy}

      INSTRUKSI PERUBAHAN (Data Pengalaman Baru):
      "${instructions}"

      PRINSIP EVOLUSI:
      1. CRITICAL REVISION: Jangan hanya menuruti instruksi; analisis konsekuensinya terhadap operasional, budget, dan energi tim secara kritis.
      2. DATA CONTINUITY: Pastikan perubahan selaras dengan data asli (${originalData.organization}) namun menunjukkan kemajuan berdasarkan feedback.
      3. WELLBEING GUARD: Jika instruksi menambah beban, CommunityOS wajib memberikan mitigasi taktis di bagian action_items.

      Output JSON (Valid & Tanpa Markdown):
      {
        "event_meta": {
          "title": "...",
          "location": "...",
          "budget": 0,
          "strategy": "Strategi yang berevolusi secara kritis berdasarkan data feedback dan realitas operasional",
          "scale_classification": "...",
          "operational_complexity": 50,
          "burnout_risk": 50,
          "budget_pressure": 50,
          "coordination_intensity": 50
        },
        "wellbeing_guard": {
          "risk_level": "...",
          "burnout_analysis": "Analisis kritis beban kerja baru",
          "fatigue_analysis": "Analisis kelelahan setelah revisi data",
          "action_items": ["Langkah adaptif 1", "Langkah adaptif 2"]
        },
        "operational": {
          "budget_allocation": [ { "item": "Alokasi", "amount": 0, "label": "Analisis efisiensi biaya baru" } ],
          "rundown": [ { "time": "HH:mm", "task": "Aktivitas Hasil Revisi" } ]
        },
        "outreach": {
          "local_partners": ["Partner yang relevan dengan arah evolusi baru"],
          "ig_caption": "Caption yang mencerminkan pertumbuhan setelah revisi"
        }
      }
    `;

    const isComplex = instructions.length > 150 || (originalData.goal && originalData.goal.length > 300);
    const targetModel = isComplex ? MODELS.ADVANCED : MODELS.DEFAULT;

    const result = await callGemini(targetModel, prompt, {
      responseMimeType: "application/json",
    });

    let rawText = result.text || "{}";
    rawText = extractJSON(rawText);

    const refined = JSON.parse(rawText) as Blueprint;
    
    if (!refined.event_meta || !refined.wellbeing_guard || !refined.operational || !refined.outreach) {
      throw new Error("Format blueprint revisi tidak valid.");
    }

    return refined;
  } catch (error: any) {
    console.error("Blueprint refinement failed:", error);
    throw error;
  }
}

