import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getModelProvider } from "@/lib/ai/provider";
import { AuthorizedTranscriptProvider, type TranscriptSegment } from "@/lib/video/provider";

const MAX_SENTENCES = 20;

export async function processLesson(lessonId: string, workerId = "local") {
  const db = createSupabaseAdminClient();
  const { data: lesson, error } = await db.from("lessons").select("id,source_video_id,attempts,source_videos(platform,external_video_id,url)").eq("id", lessonId).single();
  if (error || !lesson) throw new Error("Lesson was not found");
  const source = Array.isArray(lesson.source_videos) ? lesson.source_videos[0] : lesson.source_videos;
  const heartbeat = setInterval(() => void db.from("lessons").update({ heartbeat_at: new Date().toISOString() }).eq("id", lessonId).eq("locked_by", workerId), 15_000);
  try {
    await updateStage(db, lessonId, "fetching_captions", workerId);
    const segments = await new AuthorizedTranscriptProvider().getTranscript({ platform: source.platform, externalId: source.external_video_id ?? undefined, url: source.url });
    const transcript = segments.map((segment) => segment.text).join(" ").slice(0, 80_000);
    if (!transcript.trim()) throw new Error("The video has no usable English captions.");
    await updateStage(db, lessonId, "analyzing", workerId);
    const sentences = (await getModelProvider().analyzeTranscript(transcript)).slice(0, MAX_SENTENCES);
    if (!sentences.length) throw new Error("The model returned no sentences.");
    await updateStage(db, lessonId, "saving", workerId);
    const { error: sentenceError } = await db.from("lesson_sentences").insert(sentences.map((sentence, index) => ({ lesson_id: lessonId, sequence: index + 1, start_time: alignTime(sentence.originalText, segments, index).start, end_time: alignTime(sentence.originalText, segments, index).end, original_text: sentence.originalText, translation: sentence.translation, grammar_note: sentence.grammarNote, slang_note: sentence.slangNote, pronunciation_hint: sentence.pronunciationHint, difficulty: sentence.difficulty })));
    if (sentenceError) throw sentenceError;
    await db.from("lessons").update({ status: "ready", processing_stage: "complete", error_message: null, locked_by: null, locked_at: null, heartbeat_at: null }).eq("id", lessonId).eq("locked_by", workerId);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Lesson processing failed";
    await db.from("lessons").update({ status: "failed", processing_stage: "failed", error_message: message, locked_by: null, locked_at: null, heartbeat_at: null }).eq("id", lessonId).eq("locked_by", workerId);
    throw caught;
  } finally { clearInterval(heartbeat); }
}

async function updateStage(db: ReturnType<typeof createSupabaseAdminClient>, lessonId: string, processing_stage: string, workerId: string) { await db.from("lessons").update({ processing_stage, status: "processing", heartbeat_at: new Date().toISOString() }).eq("id", lessonId).eq("locked_by", workerId); }
function normalize(value: string) { return value.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim(); }
function alignTime(text: string, segments: TranscriptSegment[], index: number) { const target = normalize(text).slice(0, 50); const found = segments.find((segment) => normalize(segment.text).includes(target) || target.includes(normalize(segment.text).slice(0, 40))); return found ?? segments[Math.min(index, segments.length - 1)] ?? { start: 0, end: 0 }; }
