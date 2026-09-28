import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { nextReviewAt, nextStreak } from "@/lib/review/schedule";
import { rateLimit } from "@/lib/security/rate-limit";

function normalize(value: string) { return value.toLowerCase().replace(/[^a-z0-9\s']/g, "").replace(/\s+/g, " ").trim(); }
function compareWords(a: string, b: string) { const left = normalize(a).split(" "); const right = normalize(b).split(" "); const missing = left.filter((word, index) => word !== right[index]); const extra = right.filter((word, index) => word !== left[index]); const common = left.filter((word, index) => word === right[index]).length; return { score: Math.round((common / Math.max(left.length, right.length, 1)) * 100), missing, extra }; }

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limit = rateLimit(`practice:${user.id}`, 30, 10 * 60 * 1000); if (!limit.allowed) return NextResponse.json({ error: "Too many practice attempts. Please try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  const form = await request.formData(); const audio = form.get("audio"); const sentenceId = String(form.get("sentenceId") ?? "");
  if (!(audio instanceof File) || !sentenceId) return NextResponse.json({ error: "audio and sentenceId are required" }, { status: 400 });
  if (audio.size === 0 || !audio.type.startsWith("audio/") || audio.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Audio must be a non-empty audio file smaller than 10 MB." }, { status: 400 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  const { data: sentence } = await supabase.from("lesson_sentences").select("id,original_text,review_count,correct_streak,lessons!inner(user_id)").eq("id", sentenceId).eq("lessons.user_id", user.id).single();
  if (!sentence) return NextResponse.json({ error: "Sentence does not belong to the current user." }, { status: 403 });
  const OpenAI = (await import("openai")).default; const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const transcription = await client.audio.transcriptions.create({ file: audio, model: "gpt-4o-mini-transcribe", response_format: "json" });
  const comparison = compareWords(sentence.original_text, transcription.text); const score = comparison.score; const quality = score >= 90 ? 5 : score >= 75 ? 4 : score >= 55 ? 3 : 1; const feedback = score >= 90 ? "表达匹配度很高。" : score >= 70 ? "表达基本准确，再练习连读和节奏。" : "先放慢速度，逐词跟读原句。";
  const { error } = await supabase.from("practice_attempts").insert({ user_id: user.id, sentence_id: sentenceId, score, feedback }); if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from("lesson_sentences").update({ review_count: (sentence.review_count ?? 0) + 1, last_reviewed_at: new Date().toISOString(), next_review_at: nextReviewAt(quality, sentence.correct_streak ?? 0), correct_streak: nextStreak(quality, sentence.correct_streak ?? 0), completed_at: quality >= 3 ? new Date().toISOString() : null }).eq("id", sentenceId);
  return NextResponse.json({ transcript: transcription.text, score, feedback, missing: comparison.missing, extra: comparison.extra, scoreType: "expression_match" });
}
