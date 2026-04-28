import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface TranslationResult {
  original: string;
  result: string;
  explanation: string;
  type: 'translation' | 'correction';
}

export async function processText(text: string): Promise<TranslationResult> {
  const prompt = `
    You are a real-time Tamil-to-English translator and English grammar corrector.
    Input Text: "${text}"

    Rules:
    1. If the input is in Tamil, translate it into clear, natural, and simple English.
    2. If the input is in English, check for grammar mistakes. If there are mistakes, correct the sentence and provide the improved version. If it's already correct, state that it's correct but you can offer a slightly more natural alternative if possible.
    3. Keep the original meaning exactly the same.
    4. Provide a brief explanation for the translation or correction in simple terms.
    5. Use a friendly and easy-to-understand tone.

    Response Format (JSON):
    {
      "result": "The translated or corrected sentence",
      "explanation": "Short explanation of the translation or correction",
      "type": "translation" or "correction"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const data = JSON.parse(response.text || "{}");
    return {
      original: text,
      result: data.result || "Could not process.",
      explanation: data.explanation || "No explanation provided.",
      type: data.type || (text.match(/[^\x00-\x7F]/) ? 'translation' : 'correction'),
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to process text. Please try again.");
  }
}
