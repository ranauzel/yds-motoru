// Model istemcisi arayüzü. Hat yalnızca bunu bilir; Gemini bağlantısı gemini.ts'de, testler sahte istemci verir.

export type JsonRequest = {
  prompt: string;
  /** Verilirse model PDF'i de görür (analiz çağrısı). Kör çözümde verilmez. */
  pdf?: Uint8Array;
  /** Beklenen çıktının JSON şeması (zod'dan üretilir). */
  schema: Record<string, unknown>;
};

export interface ModelClient {
  /** Modelin JSON çıktısını ayrıştırılmış olarak döner; yapısı çağıran tarafından doğrulanır. */
  generateJson(req: JsonRequest): Promise<unknown>;
}
