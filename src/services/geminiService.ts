import { Blueprint, EventData } from "../types";

async function callGeminiProxy(model: string, contents: any, config?: any) {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, contents, config }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  return await response.json();
}

export async function validateInputWithAI(data: EventData): Promise<{ isValid: boolean; message?: string }> {
  try {
    const prompt = `
      You are an event validation expert for CommunityOS.
      Analyze the following event details and determine if they are realistic or too vague/low-quality for an AI to generate a meaningful Indonesian community blueprint.

      DETAILS:
      - Event: ${data.name}
      - Org: ${data.organization || 'Tidak diketahui'}
      - Location: ${data.location}
      - Goal: ${data.goal}
      - Participants: ${data.participants}
      - Budget: Rp ${data.budget}

      CRITERIA:
      - Must not be random letters (e.g. "asdf", "test", "123").
      - Must have a clear community-oriented context in Indonesian or English.
      - Must feel realistic for a community event.

      Response must be in JSON format:
      {
        "isValid": boolean,
        "message": "Friendly Indonesian message if invalid, otherwise leave empty"
      }

      If invalid, use this message: "Input kegiatan masih terlalu singkat untuk dianalisis secara realistis. Tambahkan detail agar CommunityOS bisa memberikan blueprint yang lebih akurat dan manusiawi."
    `;

    const result = await callGeminiProxy("gemini-3-flash-preview", prompt, {
      responseMimeType: "application/json",
    });

    const parsed = JSON.parse(result.text || "{}");
    return {
      isValid: parsed.isValid ?? true,
      message: parsed.message
    };
  } catch (error) {
    console.error("AI Sanity Check failed:", error);
    if (data.name.length < 3 || data.goal.length < 5) {
      return { 
        isValid: false, 
        message: "Detail kegiatan masih sangat terbatas. Berikan penjelasan sedikit lebih panjang agar kami bisa merancang blueprint yang tepat." 
      };
    }
    return { isValid: true };
  }
}

export async function generateBlueprint(data: EventData): Promise<Blueprint> {
  try {
    const prompt = `
      You are CommunityOS, an experienced mentor for Indonesian volunteer communities.
      Plan a high-impact event using "Gerilya Mode" (resourcefulness and low budget).
      
      EVENT CONTEXT:
      - Organization: ${data.organization}
      - Event Name: ${data.name}
      - Location: ${data.location}
      - Participants: ${data.participants}
      - Staff/Committee: ${data.staff}
      - Goal: ${data.goal}
      ${data.previous_context ? `- Previous Context/Reference: ${data.previous_context}` : ''}
      - Budget: Rp ${data.budget.toLocaleString('id-ID')}
      - Event Type: ${data.type}

      Instructions:
      - Persona: Experienced mentor, casual-profesional (anak komunitas).
      - Scale: Classify the event scale: "Gerilya Scale", "Community Scale", "Regional Scale", or "Massive Scale".
      - Metrics (1-100): 
          - Estimate "Level Kerumitan Operasional" (operational_complexity).
          - Estimate "Risiko Burnout Tim" (burnout_risk).
          - Estimate "Tekanan Budget" (budget_pressure) based on the budget vs scale.
          - Estimate "Intensitas Koordinasi" (coordination_intensity).
      - Budget: Be realistic. Suggest barter or "Patungan" if too low.
      - Wellbeing: Focus on preventing volunteer burnout. Provide specific "Risiko Kelelahan Tim" (fatigue_analysis).
      - Output: Strictly follow the responseSchema.
    `;

    // For simplicity, keeping the structured prompt and using responseMimeType.
    const result = await callGeminiProxy("gemini-3-flash-preview", prompt, {
      responseMimeType: "application/json",
    });

    const blueprint = JSON.parse(result.text || "{}") as Blueprint;
    
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
      You are CommunityOS, an experienced mentor for Indonesian volunteer communities.
      You are helping a community REFINE an existing event blueprint based on their specific feedback.
      
      CURRENT BLUEPRINT SUMMARY:
      - Title: ${currentBlueprint.event_meta.title}
      - Location: ${currentBlueprint.event_meta.location}
      - Budget: Rp ${currentBlueprint.event_meta.budget.toLocaleString('id-ID')}
      - Scale: ${currentBlueprint.event_meta.scale_classification}
      - Strategy: ${currentBlueprint.event_meta.strategy}

      REFINEMENT INSTRUCTIONS FROM USER:
      "${instructions}"

      ORIGINAL CONTEXT:
      - Organization: ${originalData.organization}
      - Goal: ${originalData.goal}
      - Participants: ${originalData.participants}
      - Staff: ${originalData.staff}

      Instructions for AI:
      - PERSERVE: Keep the overall spirit and structure unless the feedback specifically asks to change it.
      - ADAPT: Update the operational plan, budget allocation, rundown, or wellbeing guard based on the instructions.
      - TONE: Stay supportive, realistic, and human-centered.
      - SCALE: Re-evaluate the scale if the instructions significantly change the event mass or complexity.
      - Wellbeing: Pay close attention to how the changes affect team burnout risk.
      
      Output: Strictly follow the original blueprint JSON format.
    `;

    const result = await callGeminiProxy("gemini-3-flash-preview", prompt, {
      responseMimeType: "application/json",
    });

    const refined = JSON.parse(result.text || "{}") as Blueprint;
    
    if (!refined.event_meta || !refined.wellbeing_guard || !refined.operational || !refined.outreach) {
      throw new Error("Format blueprint revisi tidak valid.");
    }

    return refined;
  } catch (error: any) {
    console.error("Blueprint refinement failed:", error);
    throw error;
  }
}
