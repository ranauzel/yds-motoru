// Serbest kelime çalışması girdisi (server action herkese açık uçtur; doğrulama burada).
import { z } from "zod";

export const WordPracticeInput = z.object({ word: z.string().min(1).max(100), correct: z.boolean() });
