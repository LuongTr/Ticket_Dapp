import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateEventConcept = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a creative and modern event concept based on this idea: "${prompt}". 
      Return a JSON object with: title, shortDescription (max 2 sentences), suggestedPriceETH (number between 0.01 and 1.0), and a category (Music, Tech, Art, Sports, or Other).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            shortDescription: { type: Type.STRING },
            suggestedPriceETH: { type: Type.NUMBER },
            category: { type: Type.STRING }
          },
          required: ["title", "shortDescription", "suggestedPriceETH", "category"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating event concept:", error);
    throw error;
  }
};