import { Blueprint, EventData } from "../types";

// Model options based on CommunityOS Operational Logic
export const MODELS = {
  QUICK: "gemini-3.5-flash",
  STRATEGIC: "gemini-3.5-flash",
  // Refinement Hub mix logic
  REFINE_LIGHT: "gemini-3.5-flash",
  REFINE_MEDIUM: "gemini-3.5-flash",
  REFINE_DEEP: "gemini-3.5-flash",
  REFINE_EXPERIMENTAL: "gemini-3.5-flash" 
};

// Mode definitions for UI feedback
export const MODE_INFO = {
  QUICK: {
    name: "Mode Diskusi (Gerilya)",
    desc: "Cepat, brainstorming lincah, fokus pada eksekusi praktis.",
    model: "Gemini 3.5 Flash"
  },
  STRATEGIC: {
    name: "Rapat Strategis",
    desc: "Analisis mendalam, berbasis data realitas lokal.",
    model: "Gemini 3.5 Flash (Advanced Search)"
  }
};

// ... existing helper functions ...

/**
 * Intelligent Model Selector for Refinement Hub
 * Uses logic to determine the best model based on instruction complexity and data context.
 */
function selectRefinementModel(instructions: string, originalData: EventData): string {
  const text = instructions.toLowerCase();
  const hasHistory = !!originalData.previous_context;
  const isComplex = text.length > 150 || text.includes("analisis") || text.includes("strategi") || text.includes("risiko");
  const needsPreview = text.includes("experimental") || text.includes("terbaru") || text.includes("3.1");

  if (needsPreview) return MODELS.REFINE_EXPERIMENTAL;
  if (isComplex && hasHistory) return MODELS.REFINE_DEEP;
  if (isComplex || hasHistory) return MODELS.REFINE_MEDIUM;
  return MODELS.REFINE_LIGHT;
}

// Helper function to call the backend AI proxy instead of direct SDK
async function callGemini(model: string, contents: any, config?: any) {
  try {
    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        contents: typeof contents === 'string' ? [{ role: 'user', parts: [{ text: contents }] }] : contents,
        config: config?.generationConfig || config || {}
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { text: data.text || "" };
  } catch (error: any) {
    const technicalError = error.message || "Unknown error";
    console.error("Gemini call via Proxy failed:", technicalError);
    
    if (technicalError.includes("429") || technicalError.includes("quota")) {
      throw new Error("Kapasitas AI sedang penuh (Quota Exceeded). Silakan tunggu 1 menit lalu coba lagi.");
    }
    
    throw new Error("Maaf, terjadi gangguan teknis saat menyusun blueprint. CommunityOS sedang melakukan pemeliharaan otomatis, silakan coba lagi.");
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

export async function validateInputWithAI(data: EventData): Promise<{ isValid: boolean; feedback_taktis?: string; mode_suggestion?: { recommended: 'quick' | 'strategic'; reason: string; plus: string; minus: string } }> {
  if (data.name.length < 3 || data.goal.length < 5) {
    return { 
      isValid: false, 
      feedback_taktis: "Input kegiatan masih terlalu singkat. CommunityOS butuh sedikit lebih banyak detail untuk mulai berpikir secara taktis." 
    };
  }

  try {
    const prompt = `
      System: CommunityOS Rekan Diskusi & Mentor Strategis.
      Role: Teman kolaborasi yang suportif, logis, dan memberdayakan.
      Input: Kegiatan "${data.name}" oleh ${data.organization} dengan tujuan "${data.goal}" di ${data.location}.
      Spirit/Fokus: ${data.spirit || 'Ide Baru'}.
      
      Task: 
      1. Berikan respons awal yang hangat (feedback_taktis).
      2. Analisis kompleksitas kegiatan dan berikan saran mode (mode_suggestion).
      
      Panduan Saran Mode:
      - Quick (Mode Diskusi): Cocok untuk acara internal, skala kecil (<50 orang), atau butuh brainstorming cepat tanpa pusing data eksternal.
      - Strategic (Rapat Strategis): Cocok untuk acara publik, skala menengah-besar, atau butuh validasi lokasi/vendor nyata di ${data.location}.
      
      PENTING: Jangan mendikte. Berikan alasan (reason), kelebihan (plus), dan keterbatasan (minus) dari saran Anda agar user yang memutuskan.
      
      Bahasa: Indonesia (Modern, Suportif, Tidak Menghakimi).
      
      Output JSON only: 
      { 
        "isValid": boolean, 
        "feedback_taktis": "...", 
        "mode_suggestion": {
          "recommended": "quick" | "strategic",
          "reason": "Kenapa menyarankan ini",
          "plus": "Kelebihan jika pakai mode ini",
          "minus": "Apa yang mungkin kurang/terlewat"
        }
      }
    `;

    const result = await callGemini(MODELS.QUICK, prompt, {
      responseMimeType: "application/json"
    });

    let rawText = result.text || "{}";
    rawText = extractJSON(rawText);
    
    const parsed = JSON.parse(rawText);
    return {
      isValid: parsed.isValid ?? true,
      feedback_taktis: parsed.feedback_taktis,
      mode_suggestion: parsed.mode_suggestion
    };
  } catch (error) {
    console.error("Validation AI failed:", error);
    return { isValid: true };
  }
}

export async function generateBlueprint(data: EventData & { mode?: 'quick' | 'strategic' }): Promise<Blueprint> {
  try {
    const isStrategic = data.mode === 'strategic';
    const modeInstruction = isStrategic 
      ? 'Mode: STRATEGIC. Bantu user merancang kegiatan yang kokoh dengan analisis mendalam melalui pencarian data real-time. Hubungkan strategi dengan realitas lokal (vendor, lokasi, organisasi) yang benar-benar ada.'
      : 'Mode: QUICK. Fokus pada kesederhanaan dan langkah-langkah praktis yang bisa langsung dieksekusi tanpa membebani pikiran user.';

    const model = isStrategic ? MODELS.STRATEGIC : MODELS.QUICK;
    const config: any = {
      responseMimeType: "application/json"
    };

    if (isStrategic) {
      config.tools = [{ googleSearch: {} }];
    }

    const prompt = `
      System: Anda adalah CommunityOS, seorang Sparring Partner strategis untuk aktivis dan relawan komunitas di Indonesia.
      Persona: Anda cerdas, taktis, sangat manusiawi, dan tidak pernah menghakimi. Bayangkan Anda sedang duduk bersama user dalam sebuah rapat perencanaan terbaik.

      KONTEKS RAPAT:
      - Acara: ${data.name}
      - Penyelenggara: ${data.organization}
      - Semangat Kegiatan: ${data.spirit || 'Ide Baru'} (Model: ${data.spirit === 'duplicate' ? 'Duplikasi Sukses/Best Practice' : data.spirit === 'growth' ? 'Ekspansi/Pengembangan' : data.spirit === 'innovation' ? 'Inovasi/Gebrakan' : 'Eksplorasi Ide Baru'})
      - Lokasi: ${data.location}
      - Kekuatan Tim: ${data.staff} orang (Kritikal: Pastikan beban kerja masuk akal bagi mereka!)
      - Budget: Rp ${data.budget.toLocaleString("id-ID")}
      - Target Utama: ${data.goal}

      ${modeInstruction}

      PRINSIP "RAPAT TERBAIK" (Humanis & Data-Driven):
      1. TRANSPARANSI LOGIKA: Pada bagian "strategy", jangan hanya memberi instruksi. Jelaskan *kenapa* Anda menyarankan hal tersebut. Gunakan nada diskusi: "Mengingat tim kita terbatas, saya menyarankan..."
      2. REALISME LOKAL: Gunakan kekuatan Google Search (terutama di Strategic Mode) untuk menyebut tempat, komunitas, atau vendor asli di ${data.location} jika valid. Jika ragu, gunakan kategori logis.
      3. WELLBEING GUARD: Sampaikan kekhawatiran atau apresiasi Anda terhadap ritme kerja tim secara empati di bagian 'wellbeing_guard'.
      4. RUNDOWN MANUSIAWI: Pastikan ada waktu untuk tim bernafas (Ishoma & Buffer Time).

      Bahasa: Bahasa Indonesia yang modern, suportif, cerdas, dan setara (rekan sejawat).

      Output JSON only (valid):
      {
        "event_meta": {
          "title": "...",
          "location": "...",
          "budget": 0,
          "strategy": "Jelaskan alasan logis di balik pemilihan strategi agar user merasa dibimbing dan paham konteksnya.",
          "scale_classification": "Gerilya | Community | Regional | Massive",
          "operational_complexity": 1-100,
          "burnout_risk": 1-100,
          "budget_pressure": 1-100,
          "coordination_intensity": 1-100
        },
        "wellbeing_guard": {
          "risk_level": "Green | Yellow | Amber | Red",
          "burnout_analysis": "Analisis jujur namun suportif tentang ritme kerja tim",
          "fatigue_analysis": "Prediksi titik lelah dengan nada empati rekan rapat",
          "action_items": ["Saran konkret untuk menjaga mood dan kesehatan tim"]
        },
        "operational": {
          "budget_allocation": [ { "item": "...", "amount": 0, "label": "Esensial | Opsional" } ],
          "rundown": [ { "time": "...", "task": "..." } ]
        },
        "outreach": {
          "local_partners": ["Kategori atau Nama Partner spesifik/usulan"],
          "ig_caption": "Copywriting yang bercerita, menyentuh, dan mengajak kolaborasi"
        }
      }
    `;

    const result = await callGemini(model, prompt, config);

    let rawText = result.text || "{}";
    rawText = extractJSON(rawText);

    const blueprint = JSON.parse(rawText) as Blueprint;
    return blueprint;
  } catch (error: any) {
    console.error("Blueprint generation failed:", error);
    throw error;
  }
}

export async function refineBlueprint(currentBlueprint: Blueprint, instructions: string, originalData: EventData): Promise<Blueprint> {
  try {
    const isDeepDive = instructions.toLowerCase().includes("strategis") || 
                       instructions.toLowerCase().includes("perdalam") || 
                       instructions.toLowerCase().includes("riset") ||
                       instructions.toLowerCase().includes("data");

    const model = isDeepDive ? MODELS.REFINE_DEEP : selectRefinementModel(instructions, originalData);
    
    const config: any = {
      responseMimeType: "application/json"
    };

    if (isDeepDive) {
      config.tools = [{ googleSearch: {} }];
    }

    const prompt = `
      System: Anda adalah Sparring Partner CommunityOS. Tugas Anda adalah membantu user mengevolusi blueprint mereka.
      Persona: Rekan diskusi yang cerdas, suportif, dan adaptif.
      
      KONTEKS SEKARANG:
      - Blueprint Saat Ini: ${JSON.stringify(currentBlueprint.event_meta)}
      - Skala Awal: ${currentBlueprint.event_meta.scale_classification}
      - Instruksi Penyesuaian: "${instructions}"
      
      TUGAS EVOLUSI:
      1. Jika user ingin "memperdalam" atau meminta data "strategis", gunakan Google Search untuk mencari referensi nyata di ${originalData.location}.
      2. Jangan hanya mengubah kata. Jika instruksi user signifikan, sesuaikan rundown, budget, dan strategi wellbeing (Wellbeing Guard).
      3. Jika user meminta hal yang mustahil bagi tim (${originalData.staff} orang), berikan saran alternatif yang tetap realistis di kolom "strategy".
      4. Pertahankan nada "Rapat Terbaik" - kita berproses bareng.

      Bahasa: Indonesia (Modern, Suportif, Cerdas).
      
      Output JSON (Sesuai struktur Blueprint yang ada).
    `;

    const result = await callGemini(model, prompt, config);

    let rawText = result.text || "{}";
    rawText = extractJSON(rawText);

    const refined = JSON.parse(rawText) as Blueprint;
    return refined;
  } catch (error: any) {
    console.error("Blueprint refinement failed:", error);
    throw error;
  }
}
