import { GoogleGenAI, Type } from "@google/genai";
import { Blueprint, EventData } from "../types";

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function validateInputWithAI(data: EventData): Promise<{ isValid: boolean; message?: string }> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
    const prompt = `
      You are an event validation expert for CommunityOS.
      Analyze the following event details and determine if they are realistic or too vague/low-quality for an AI to generate a meaningful Indonesian community blueprint.

      DETAILS:
      - Event: ${data.name}
      - Org: ${data.organization}
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

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            message: { type: Type.STRING },
          },
          required: ["isValid"]
        }
      }
    });

    const text = response.text;
    if (!text) return { isValid: true };
    const result = JSON.parse(text);
    return {
      isValid: typeof result.isValid === 'boolean' ? result.isValid : true,
      message: result.message
    };
  } catch (error) {
    console.error("AI Sanity Check failed:", error);
    // If AI check fails, assume valid but with basic length risks handled by UI
    return { isValid: true };
  }
}

export async function generateBlueprint(data: EventData): Promise<Blueprint> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      
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

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              event_meta: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  location: { type: Type.STRING },
                  budget: { type: Type.NUMBER },
                  strategy: { type: Type.STRING },
                  scale_classification: { type: Type.STRING, enum: ["Gerilya Scale", "Community Scale", "Regional Scale", "Massive Scale"] },
                  operational_complexity: { type: Type.NUMBER },
                  burnout_risk: { type: Type.NUMBER },
                  budget_pressure: { type: Type.NUMBER },
                  coordination_intensity: { type: Type.NUMBER },
                },
                required: ["title", "location", "budget", "strategy", "scale_classification", "operational_complexity", "burnout_risk", "budget_pressure", "coordination_intensity"],
              },
              wellbeing_guard: {
                type: Type.OBJECT,
                properties: {
                  risk_level: { type: Type.STRING, enum: ["Green", "Amber", "Red"] },
                  burnout_analysis: { type: Type.STRING },
                  fatigue_analysis: { type: Type.STRING },
                  action_items: { 
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                },
                required: ["risk_level", "burnout_analysis", "fatigue_analysis", "action_items"],
              },
              operational: {
                type: Type.OBJECT,
                properties: {
                  budget_allocation: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        item: { type: Type.STRING },
                        amount: { type: Type.NUMBER },
                        label: { type: Type.STRING },
                      },
                      required: ["item", "amount", "label"]
                    }
                  },
                  rundown: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        time: { type: Type.STRING },
                        task: { type: Type.STRING },
                      },
                      required: ["time", "task"]
                    }
                  },
                },
                required: ["budget_allocation", "rundown"]
              },
              outreach: {
                type: Type.OBJECT,
                properties: {
                  local_partners: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  ig_caption: { type: Type.STRING },
                },
                required: ["local_partners", "ig_caption"]
              }
            },
            required: ["event_meta", "wellbeing_guard", "operational", "outreach"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");
      
      const result = JSON.parse(text) as Blueprint;
      
      // Basic validation of the result
      if (!result.event_meta || !result.wellbeing_guard || !result.operational || !result.outreach) {
        throw new Error("Incomplete blueprint data received");
      }
      
      return result;

    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt + 1} failed:`, lastError.message);

      // Check for terminal errors (API key issues)
      const terminalErrors = ["403", "400", "PERMISSION_DENIED", "API_KEY_INVALID"];
      if (terminalErrors.some(code => lastError?.message.includes(code))) {
        throw lastError;
      }

      if (attempt < MAX_RETRIES - 1) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error("Failed to generate blueprint after multiple attempts");
}
