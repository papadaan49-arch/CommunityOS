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

/**
 * Sanitizer helper to guarantee that the parsed blueprint contains all required properties and nested structures,
 * eliminating the possibility of standard rendering or saving errors due to missing JSON sections.
 */
function ensureBlueprintFields(raw: any, fallbackTitle?: string, fallbackLocation?: string): Blueprint {
  const safeStr = (v: any, fallback: string) => typeof v === 'string' ? v : fallback;
  const safeNum = (v: any, fallback: number) => typeof v === 'number' && !isNaN(v) ? v : fallback;
  const safeArr = (v: any) => Array.isArray(v) ? v : [];

  const event_meta = raw?.event_meta || {};
  const wellbeing_guard = raw?.wellbeing_guard || {};
  const operational = raw?.operational || {};
  const outreach = raw?.outreach || {};

  return {
    event_meta: {
      title: safeStr(event_meta.title || raw?.title || raw?.name, fallbackTitle || "Kegiatan Tanpa Nama"),
      location: safeStr(event_meta.location || raw?.location, fallbackLocation || "Indonesia"),
      budget: safeNum(event_meta.budget || raw?.budget, 0),
      strategy: safeStr(event_meta.strategy || raw?.strategy, "Strategi taktis gotong-royong."),
      scale_classification: (['Gerilya Scale', 'Community Scale', 'Regional Scale', 'Massive Scale'].includes(event_meta.scale_classification)
        ? event_meta.scale_classification
        : 'Community Scale') as any,
      operational_complexity: safeNum(event_meta.operational_complexity || raw?.operational_complexity, 50),
      burnout_risk: safeNum(event_meta.burnout_risk || raw?.burnout_risk, 50),
      budget_pressure: safeNum(event_meta.budget_pressure || raw?.budget_pressure, 50),
      coordination_intensity: safeNum(event_meta.coordination_intensity || raw?.coordination_intensity, 50),
    },
    wellbeing_guard: {
      risk_level: (['Green', 'Yellow', 'Amber', 'Red'].includes(wellbeing_guard.risk_level)
        ? wellbeing_guard.risk_level
        : 'Green') as any,
      burnout_analysis: safeStr(wellbeing_guard.burnout_analysis, "Kapasitas tim stabil, siap berkolaborasi secara seimbang."),
      fatigue_analysis: safeStr(wellbeing_guard.fatigue_analysis, "Titik lelah sedang, disarankan ada rotasi atau sapaan camilan hangat."),
      action_items: safeArr(wellbeing_guard.action_items).length > 0 
        ? safeArr(wellbeing_guard.action_items) 
        : ["Downtime bersama 15 menit sebelum acara.", "Sediakan pojok air minum hangat & camilan sehat."],
    },
    operational: {
      budget_allocation: safeArr(operational.budget_allocation).map((b: any) => ({
        item: safeStr(b?.item, "Kebutuhan esensial"),
        amount: safeNum(b?.amount, 0),
        label: safeStr(b?.label, "Esensial")
      })),
      rundown: safeArr(operational.rundown || raw?.rundown).map((r: any) => ({
        time: safeStr(r?.time, "00:00"),
        task: safeStr(r?.task, "Persiapan tim panitia")
      })),
    },
    outreach: {
      local_partners: safeArr(outreach.local_partners || raw?.local_partners),
      ig_caption: safeStr(outreach.ig_caption || raw?.ig_caption, "Mari berdaya bersama-sama untuk masyarakat setempat!"),
    }
  };
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
      System: Anda adalah CommunityOS, sebuah sistem operasi AI yang Pintar (cerdas taktis), Kritis tapi Kalem (analitis tajam dengan kepala dingin & menenangkan), Adaptif, Kolaboratif, Inovatif (penuh draf rancangan yang inovatif, ide-ide nyeleneh asal positif, serta gagasan random namun keren jika dieksekusi dengan benar), dan memiliki Integritas Kuat (selalu membela kapasitas nyata relawan & transparansi anggaran).
      Persona: Anda bertindak sebagai mentor lapangan senior yang sangat berpengalaman, yang sedang duduk bersama user dalam sebuah rapat perencanaan terbaik.

      KONTEKS RAPAT:
      - Acara: ${data.name}
      - Penyelenggara: ${data.organization}
      - Semangat Kegiatan: ${data.spirit || 'Ide Baru'} (Model: ${data.spirit === 'duplicate' ? 'Duplikasi Sukses/Best Practice' : data.spirit === 'growth' ? 'Ekspansi/Pengembangan' : data.spirit === 'innovation' ? 'Inovasi/Gebrakan' : 'Eksplorasi Ide Baru'})
      - Lokasi: ${data.location}
      - Kekuatan Tim: ${data.staff} orang (Kritikal: Pastikan beban kerja masuk akal bagi mereka!)
      - Budget: Rp ${data.budget.toLocaleString("id-ID")}
      - Target Utama: ${data.goal}

      ${modeInstruction}

      PRINSIP UTAMA COMMUNITYOS (Pintar, Kritis & Kalem, Inovatif):
      1. INTEGRITAS & KRITIS: Lakukan penilaian objektif. Jika budget terlalu tipis atau panitia terlalu sedikit untuk target raksasa, katakan secara kalem tapi saksama di bagian "strategy", lalu tawarkan jalan keluar terbaik yang taktis (0 Rupiah atau Gerilya Scale).
      2. IDE NYELENEH POSITIF & RANDOM KECE: Wajib selipkan setidaknya 1-2 ide kegiatan yang tidak biasa (nyeleneh positif / out-of-the-box) namun sangat asyik dan realistis jika dieksekusi dengan benar (misal: "Sesi Debat Bubur Diaduk vs Diolah" untuk mencairkan malam, "Raffle Apresiasi Relawan", "Guerilla Marketing Tanpa Banner"). Jelaskan cara eksekusi yang benar agar bernilai keren!
      3. TRANSPARANSI LOGIKA: Paparkan alasan taktis di balik rundown dan alokasi dana agar tim panitia cerdas secara kolektif.
      4. REALISME LOKAL: Manfaatkan penelusuran fakta lokal ${data.location} untuk merekomendasikan entitas nyata (lokasi, katering madu, atau ruang kolaborasi lokal).
      5. WELLBEING GUARD: Tetap jaga keutuhan mental relawan. Selipkan downtime manusiawi agar tidak ada kepanikan ("burnout").

      Bahasa: Bahasa Indonesia kasual-komunitas yang sejuk ("adem"), penuh dukungan, cerdas taktis, dan setara.

      Output JSON only (valid):
      {
        "event_meta": {
          "title": "...",
          "location": "...",
          "budget": 0,
          "strategy": "Tuliskan draf rancangan inovatif yang memadukan strategi kritis-kalem dengan ide-ide nyeleneh positif & random yang keren beserta alasan eksekusi benarnya demi menjawab tujuan kegiatan.",
          "scale_classification": "Gerilya | Community | Regional | Massive",
          "operational_complexity": 1-100,
          "burnout_risk": 1-100,
          "budget_pressure": 1-100,
          "coordination_intensity": 1-100
        },
        "wellbeing_guard": {
          "risk_level": "Green | Yellow | Amber | Red",
          "burnout_analysis": "Analisis kritis yang jujur namun ditenangkan kepala dingin tentang kesiapan kapasitas fisik & mental tim",
          "fatigue_analysis": "Prakiraan titik kritis kelelahan saat acara berlangsung",
          "action_items": ["Langkah praktis inovatif/nyeleneh ramah mental untuk memecah ketegangan tim selama kegiatan"]
        },
        "operational": {
          "budget_allocation": [ { "item": "...", "amount": 0, "label": "Esensial | Opsional" } ],
          "rundown": [ { "time": "...", "task": "..." } ]
        },
        "outreach": {
          "local_partners": ["Kategori atau Nama Partner spesifik/usulan di wilayah sasaran"],
          "ig_caption": "Copywriting bercerita (storytelling) yang menyentuh, inovatif, membesarkan hati peserta, dan mengajak kolaborasi erat."
        }
      }
    `;

    const result = await callGemini(model, prompt, config);

    let rawText = result.text || "{}";
    rawText = extractJSON(rawText);

    const parsedJson = JSON.parse(rawText);
    const blueprint = ensureBlueprintFields(parsedJson, data.name, data.location);
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
      System: Anda adalah Sparring Partner CommunityOS yang Pintar, Kritis tapi Kalem, Adaptif, Kolaboratif, Inovatif, dan berintegritas tinggi. Tugas Anda adalah membantu user mengevolusi blueprint mereka demi melahirkan draf rancangan yang inovatif dengan gagasan nyeleneh positif & taktik random yang keren jika dieksekusi dengan benar.
      Persona: Rekan diskusi yang cerdas, kepala dingin, suportif, kritis analitis namun menyejukkan.
      
      KONTEKS SEKARANG:
      - Blueprint Saat Ini (Semua data operasional & meta): ${JSON.stringify(currentBlueprint)}
      - Skala Awal: ${currentBlueprint.event_meta.scale_classification}
      - Instruksi Penyesuaian: "${instructions}"
      
      TUGAS EVOLUSI:
      1. Jika user ingin "memperdalam" atau meminta data "strategis", gunakan Google Search untuk mencari referensi nyata di ${originalData.location}.
      2. Jangan hanya mengubah kata. Jika instruksi user signifikan, sesuaikan rundown, budget, dan strategi wellbeing (Wellbeing Guard).
      3. Selipkan ide-ide nyeleneh positif & rancangan acak yang keren jika relevan untuk memecahkan kepenatan atau masalah logistik di lapangan secara rill.
      4. Jika user meminta hal yang mustahil bagi tim (${originalData.staff} orang) atau memicu burnout tinggi, berikan masukan kritis nan kalem serta saran alternatif realistis di kolom "strategy".
      5. Pertahankan nada "Rapat Terbaik" - kita berproses bersama secara gotong royong dengan integritas tinggi.

      Bahasa: Indonesia (Modern, Kasual Komunitas, Cerdas Taktis).
      
      Output JSON (Wajib penuhi struktur Blueprint utuh yang ada dengan properti event_meta, wellbeing_guard, operational, outreach).
    `;

    const result = await callGemini(model, prompt, config);

    let rawText = result.text || "{}";
    rawText = extractJSON(rawText);

    const parsedJson = JSON.parse(rawText);
    const refined = ensureBlueprintFields(parsedJson, currentBlueprint.event_meta.title, currentBlueprint.event_meta.location);
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
  originalData?: EventData,
  rundownChecklist?: Record<string, boolean> | Record<number, boolean>,
  rundownNotes?: Record<string, string> | Record<number, string>
): Promise<string> {
  try {
    // Susun rundown dengan data checklist dan coretan lapangan riil
    const rundownWithProgress = blueprint.operational.rundown.map((r, idx) => {
      const isCompleted = rundownChecklist ? (rundownChecklist[idx] || rundownChecklist[String(idx)]) : false;
      const note = rundownNotes ? (rundownNotes[idx] || rundownNotes[String(idx)]) : '';
      return `• [${r.time}] ${r.task} -> ${isCompleted ? '✅ SELESAI' : '⏳ BELUM SELESAI'}${note ? ` (Catatan Lapangan Panitia: "${note}")` : ''}`;
    }).join('\n');

    const prompt = `
      System: Anda adalah Mentor Lapangan Senior & Fasilitator Utama CommunityOS Indonesia yang Pintar (cerdas taktis), Kritis tapi Kalem (kepala dingin, tajam menganalisis masalah rill, menenangkan), Adaptif, Kolaboratif, Inovatif (penuh ide-ide nyeleneh positif & taktik acak yang keren jika dieksekusi dengan benar), dan berintegritas tinggi (menjaga komitmen kejujuran rill lapangan).
      Tugas: Memberikan draf bimbingan taktis, saran inovatif, atau solusi atas kebingungan relawan mengenai jalannya acara dengan gaya yang adem, suportif, penuh kejujuran rill (integritas), dan solutif.
      
      KONTEKS BLUEPRINT OPERASIONAL ACARA:
      - Nama Acara: "${blueprint.event_meta.title}"
      - Lokasi: "${blueprint.event_meta.location}"
      - Estimasi Anggaran: Rp ${blueprint.event_meta.budget.toLocaleString("id-ID")}
      - Skala Kegiatan: "${blueprint.event_meta.scale_classification}"
      - Strategi Dasar: "${blueprint.event_meta.strategy}"
      - Beban Risiko Burnout: ${blueprint.event_meta.burnout_risk}%
      
      REAL-TIME FIELD TELEMETRY & PROGRESS (Laporan Lapangan Panitia):
      Berikut adalah status penyelesaian rundown dan catatan coretan lapangan langsung dari teman-teman panitia di lapangan saat ini:
      ${rundownWithProgress}
      
      Saran Penyelamat Tim (Wellbeing Action):
      ${blueprint.wellbeing_guard.action_items.map(item => `- ${item}`).join('\n')}
      
      PERTANYAAN ATAU KEBINGUNGAN USER:
      "${question}"
      
      PANDUAN JAWABAN:
      1. Berikan apresiasi atau respons taktis kritis-kalem berdasarkan progress rill lapangan saat ini (seperti agenda mana saja yang sudah ✅ selesai, catatan lapangan rill apa yang ditulis, serta agenda mendatang apa yang terdekat).
      2. Wajib berikan minimal 1 usulan inovatif/nyeleneh tapi positif untuk mengatasi keresahan atau tantangan yang dihadapi (0 Rupiah atau tanpa ribet). Jelaskan cara mengeksekusinya secara benar agar sukses gokil.
      3. Gunakan sapaan hangat yang membesarkan hati ("rekan penggerak", "teman-teman panitia") dengan bahasa Indonesia yang sejuk ("adem"), penuh integritas, dan nalar kritis objektif. Jauhi istilah korporat dingin yang kaku.
      4. Format jawaban menggunakan Markdown rapi dengan kata-kata kunci tebal (bold keypoints), ringkas, dan langsung dapat dieksekusi di lapangan saat ini juga.
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

