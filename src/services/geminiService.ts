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

export interface BudgetSuggestion {
  min: number;
  max: number;
  notes: string;
  breakdowns: Array<{ item: string; cost: string }>;
}

export async function getBudgetSuggestion(data: {
  name: string;
  location: string;
  participants: number;
  staff: number;
  type: string;
  goal: string;
}): Promise<BudgetSuggestion> {
  try {
    const prompt = `
      System: Anda adalah CommunityOS, seorang mentor dan sparring partner bagi komunitas lokal di Indonesia yang ramah, taktis, dan realistis.
      Task: Berikan saran budget ideal (Min & Max dalam Rupiah) berdasarkan tipe event, jumlah peserta, jumlah staff/panitia, dan lokasi kegiatan berikut.
      
      Konteks Kegiatan:
      - Nama Acara: "${data.name}"
      - Tipe Acara: "${data.type}"
      - Lokasi: "${data.location}"
      - Estimasi Target Peserta: ${data.participants} orang
      - Jumlah Panitia/Staff: ${data.staff} orang
      - Tujuan/Goal Acara: "${data.goal}"
      
      Prinsip Penyusunan Budget Ideal:
      1. Berpikirlah secara realistis dan ramah kantong komunitas (jangan over-budgeting, utamakan skala Gerilya atau Community Scale).
      2. Berikan perkiraan range harga min dan max yang realistis untuk wilayah ${data.location || 'Indonesia'}.
      3. Jelaskan kenapa kisaran tersebut yang disarankan dengan nada seorang Mentor yang hangat, suportif, dan merangkul (adem), tanpa menghakimi.
      4. Berikan breakdown logis dalam bentuk daftar item esensial beserta estimasi biayanya (misal: Konsumsi, Tempat, Perlengkapan, dll).
      
      Output JSON format:
      {
        "min": number,
        "max": number,
        "notes": "Penjelasan mentor yang adem dan solutif tentang optimasi budget ini...",
        "breakdowns": [
          { "item": "...", "cost": "..." }
        ]
      }
    `;

    const result = await callGemini(MODELS.QUICK, prompt, {
      responseMimeType: "application/json"
    });

    let rawText = result.text || "{}";
    rawText = extractJSON(rawText);
    
    const parsed = JSON.parse(rawText) as BudgetSuggestion;
    return parsed;
  } catch (error) {
    console.error("Budget suggestion failed:", error);
    // Return a sensible fallback based on participants
    const p = data.participants || 20;
    const baseMin = Math.max(200000, p * 15000 + 100000);
    const baseMax = Math.max(500000, p * 35000 + 300000);
    return {
      min: baseMin,
      max: baseMax,
      notes: "Mohon maaf terjadi kendala koneksi dengan server AI, berikut adalah estimasi dasar lokal dari mentor untuk membantu pemikiran awal Anda.",
      breakdowns: [
        { item: "Konsumsi (Makan & Minum)", cost: `Rp ${(p * 15000).toLocaleString('id-ID')}` },
        { item: "Logistik & Perlengkapan Mandiri", cost: "Rp 150.000" },
        { item: "Dana Darurat (Buffer)", cost: "Rp 100.000" }
      ]
    };
  }
}

/**
 * Tanya Mentor AI - Interactive consult on specific blueprint details
 */
export async function askMentorAboutBlueprint(
  blueprint: Blueprint,
  question: string,
  originalData?: EventData
): Promise<string> {
  try {
    const prompt = `
      System: Anda adalah Mentor Lapangan Senior & Fasilitator Utama CommunityOS Indonesia.
      Tugas: Memberikan saran praktis atas kekhawatiran atau pertanyaan penggerak komunitas mengenai blueprint acara mereka secara taktis, rill, dan sangat ramah ("adem").
      
      KONTEKS BLUEPRINT OPERASIONAL ACARA:
      - Nama Acara: "${blueprint.event_meta.title}"
      - Lokasi: "${blueprint.event_meta.location}"
      - Estimasi Anggaran: Rp ${blueprint.event_meta.budget.toLocaleString("id-ID")}
      - Skala Kegiatan: "${blueprint.event_meta.scale_classification}"
      - Strategi Dasar: "${blueprint.event_meta.strategy}"
      - Beban Risiko Burnout: ${blueprint.event_meta.burnout_risk}%
      
      RUNDOWN DETIL:
      ${blueprint.operational.rundown.map(r => `• [${r.time}] ${r.task}`).join('\n')}
      
      Saran Penyelamat Tim (Wellbeing Action):
      ${blueprint.wellbeing_guard.action_items.map(item => `- ${item}`).join('\n')}
      
      PERTANYAAN ATAU KEBINGUNGAN USER:
      "${question}"
      
      PANDUAN JAWABAN:
      1. Sampaikan solusi lapangan yang instan, efisien (0 Rupiah atau anggaran minim jika memungkinkan).
      2. Jangan gunakan istilah korporat yang kaku. Gunakan sapaan hangat ("rekan penggerak", "teman-teman panitia") dan tone suportif yang menenangkan emosi panitia.
      3. Format jawaban menggunakan Markdown rapi dengan bold keypoints, ringkas, dan langsung dapat dieksekusi lusa di lapangan.
    `;

    const result = await callGemini(MODELS.QUICK, prompt);
    return result.text || "Terjadi kendala memuat nasihat mentor.";
  } catch (error: any) {
    console.error("Gagal berkonsultasi dengan mentor:", error);
    return `Maaf rekan, ada gangguan dalam sinyal koordinasi dengan mentor kami (${error.message || "Unknown error"}). Silakan coba ajukan pertanyaan Anda kembali!`;
  }
}

/**
 * Automate filling/generating high-quality past event reference or context based on current form
 */
export async function generateReferenceContextWithAI(
  name: string,
  goal: string,
  location: string,
  organization: string
): Promise<string> {
  try {
    const prompt = `
      System: Anda adalah Mentor Utama Lapangan di CommunityOS.
      Tugas: Tulis sebuah draf ringkas mengenai 'Referensi atau kegiatan versi sebelumnya' yang rill, relevan, dan bermakna untuk menginspirasi atau dijadikan basis perbaikan kegiatan baru ini.
      
      KONTEKS ACARA BARU YANG SEDANG DIRANCANG:
      - Nama Acara: "${name || "Gerakan Pemuda Komunitas"}"
      - Komunitas/Penyelenggara: "${organization || "Ekosistem Relawan Lokal"}"
      - Lokasi Sasaran: "${location || "Indonesia"}"
      - Tujuan/Goal: "${goal || "Pemberdayaan sosial & peningkatan literasi masyarakat"}"
      
      PANDUAN PENULISAN:
      1. Sampaikan ringkasan realistis (tapi fiktif/rekonstruksi berbasis template sukses nyata) kejadian "versi perdana", "pilot project", atau "kegiatan sejenis tahun lalu" yang pernah diadakan. 
      2. Berikan angka yang masuk akal untuk skala lokal Indonesia (misal: "30 peserta", "8 relawan", "anggaran swadaya Rp 450.000").
      3. Bagian paling penting: Sebutkan 1 keberhasilan kecil DAN 1 kendala lapangan / kelelahan tim yang terjadi di masa lalu (misal: "evaluasi: koordinasi konsumsi telat dan 2 panitia nyaris burnout karena merangkap tugas"). Ini melatih panitia baru untuk belajar dari masa lalu!
      4. Tulis sangat ringkas, padat, maksimal 2-3 kalimat saja sehingga ramah UX.
      
      Bahasa: Bahasa Indonesia kasual komunitas penggerak yang hangat, jujur, dan murni.
      
      Contoh Output:
      "EduAction #1 tahun lalu melibatkan 45 siswa di Desa Juai dengan dana swadaya Rp 600.000. Berhasil meningkatkan minat baca, namun evaluasi panitia mencatat kelelahan fisik karena mobilisasi logistik dilakukan manual tanpa bantuan warga lokal."
    `;

    const result = await callGemini(MODELS.QUICK, prompt);
    return (result.text || "").replace(/"/g, '').trim();
  } catch (error: any) {
    console.error("Gagal menambang referensi mentor:", error);
    return `Evaluasi ${name || 'Kegiatan'} sebelumnya melibatkan sekitar 50 peserta lokal, berjalan lancar secara swadaya, namun koordinasi operasional masih menyisakan catatan kelelahan tim karena pembagian tugas yang kurang berimbang.`;
  }
}

