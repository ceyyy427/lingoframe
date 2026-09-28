import { z } from "zod";

export type SentenceAnalysis = { originalText: string; translation: string; grammarNote: string; slangNote: string; pronunciationHint: string; difficulty: "beginner" | "intermediate" | "advanced" };
export interface LanguageModelProvider { analyzeTranscript(transcript: string): Promise<SentenceAnalysis[]>; }
const schema = { type: "array", items: { type: "object", additionalProperties: false, required: ["originalText", "translation", "grammarNote", "slangNote", "pronunciationHint", "difficulty"], properties: { originalText: { type: "string" }, translation: { type: "string" }, grammarNote: { type: "string" }, slangNote: { type: "string" }, pronunciationHint: { type: "string" }, difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] } } } };
const sentenceAnalysis = z.array(z.object({ originalText: z.string().min(1).max(500), translation: z.string().max(1000), grammarNote: z.string().max(1500), slangNote: z.string().max(1500), pronunciationHint: z.string().max(1000), difficulty: z.enum(["beginner", "intermediate", "advanced"]) })).max(20);

export function getModelProvider(): LanguageModelProvider { if (process.env.AI_PROVIDER === "anthropic") return new AnthropicProvider(); if (process.env.AI_PROVIDER === "placeholder") return new PlaceholderProvider(); return new OpenAIProvider(); }

class OpenAIProvider implements LanguageModelProvider {
  async analyzeTranscript(transcript: string) { if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured"); const OpenAI = (await import("openai")).default; const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); const response = await client.responses.create({ model: process.env.OPENAI_MODEL || "gpt-4.1-mini", input: `Split this English transcript into learner-sized sentences. For every sentence provide a Chinese translation, grammar explanation, slang/natural-expression explanation, pronunciation hint, and difficulty. Return only JSON.\n\n${transcript}`, text: { format: { type: "json_schema", name: "sentence_analysis", strict: true, schema } } } as any); return sentenceAnalysis.parse(JSON.parse(response.output_text)); }
}

class AnthropicProvider implements LanguageModelProvider {
  async analyzeTranscript(transcript: string) { if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured"); const Anthropic = (await import("@anthropic-ai/sdk")).default; const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }); const response = await client.messages.create({ model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest", max_tokens: 5000, system: "Return only valid JSON. Each item must contain originalText, translation, grammarNote, slangNote, pronunciationHint, difficulty.", messages: [{ role: "user", content: transcript }] }); const text = response.content.find((item) => item.type === "text")?.text ?? "[]"; return sentenceAnalysis.parse(JSON.parse(text.replace(/^```json\\s*|\\s*```$/g, ""))); }
}

class PlaceholderProvider implements LanguageModelProvider { async analyzeTranscript(transcript: string) { return [{ originalText: transcript || "I’m just not feeling it today.", translation: "我今天就是不太想做。", grammarNote: "现在进行时，用于表达当前状态。", slangNote: "feeling it 表示有兴趣或有心情做某事。", pronunciationHint: "注意 feeling 中的长元音 /iː/。", difficulty: "intermediate" as const }]; } }
