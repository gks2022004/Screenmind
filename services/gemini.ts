import { GoogleGenAI, Type } from "@google/genai";
import { GeminiAnalysisResult } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeScreenshot = async (base64Image: string): Promise<GeminiAnalysisResult> => {
  const ai = getClient();
  if (!ai) {
    return { title: "Screenshot", summary: "API Key missing" };
  }

  // Remove data URL prefix if present for the API call logic if needed, 
  // but the GoogleGenAI SDK usually handles base64 data in parts cleanly.
  // The SDK expects just the base64 string in the `data` field.
  const base64Data = base64Image.includes("base64,") 
    ? base64Image.split("base64,")[1] 
    : base64Image;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", // Assuming JPEG/PNG, model is flexible
              data: base64Data,
            },
          },
          {
            text: "Analyze this screenshot. Provide a short, punchy title (max 5 words) and a 1 sentence summary of the content. Return JSON.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
          },
          required: ["title", "summary"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    const result = JSON.parse(text) as GeminiAnalysisResult;
    return result;

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      title: "New Screenshot",
      summary: "Could not analyze image content.",
    };
  }
};