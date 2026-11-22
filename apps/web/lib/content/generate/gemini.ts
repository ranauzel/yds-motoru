// Gemini bağlantısı (@google/genai). Hattın geri kalanı yalnızca ModelClient arayüzünü bilir.
import { GoogleGenAI } from "@google/genai";
import type { ModelClient } from "./client";

/** Varsayılan model; GEMINI_MODEL ile değiştirilebilir (ör. daha güçlü bir "pro" model). */
export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

export function createGeminiClient(apiKey: string, model: string = DEFAULT_GEMINI_MODEL): ModelClient {
  const ai = new GoogleGenAI({ apiKey });
  return {
    async generateJson({ prompt, pdf, schema }) {
      const parts = [
        ...(pdf ? [{ inlineData: { mimeType: "application/pdf", data: Buffer.from(pdf).toString("base64") } }] : []),
        { text: prompt },
      ];
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        config: { responseMimeType: "application/json", responseJsonSchema: schema },
      });
      const text = res.text;
      if (!text) throw new Error("Gemini boş cevap döndürdü.");
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(`Gemini geçerli JSON döndürmedi: ${text.slice(0, 200)}`);
      }
    },
  };
}
