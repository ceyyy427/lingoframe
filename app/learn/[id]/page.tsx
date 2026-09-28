import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LessonStatus } from "@/components/lesson-status";
import { LessonPlayer } from "@/components/lesson-player";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: lesson } = await supabase.from("lessons").select("id,title,status,processing_stage,error_message,source_videos(url),lesson_sentences(*)").eq("id", id).single();
  if (!lesson) return <main className="shell"><p>Lesson not found.</p></main>;
  if (lesson.status !== "ready") return <main className="shell"><nav className="nav"><Link className="brand" href="/"><span className="brand-mark">L</span><span>LingoFrame</span></Link><Link href="/dashboard" className="nav-links">← Dashboard</Link></nav><div className="eyebrow">Your lesson</div><h1 style={{fontSize:56,maxWidth:800}}>{lesson.title ?? "New lesson"}</h1><LessonStatus lessonId={id} initialStage={lesson.processing_stage} initialStatus={lesson.status} initialError={lesson.error_message}/></main>;
  const sentences = lesson.lesson_sentences as Array<{ id:string; sequence:number; start_time:number|null; end_time:number|null; original_text:string; translation:string; grammar_note:string; slang_note?:string; pronunciation_hint?:string; completed_at:string|null; is_favorite:boolean; is_difficult:boolean }>;
  return <main className="shell"><nav className="nav"><Link className="brand" href="/"><span className="brand-mark">L</span><span>LingoFrame</span></Link><Link href="/dashboard" className="nav-links">← Dashboard</Link></nav><div className="eyebrow">Lesson {id.slice(0,8)}</div><h1 style={{fontSize:56,maxWidth:800}}>{lesson.title ?? "Your lesson"}</h1><p className="lede">{(lesson.source_videos as {url?:string}|null)?.url}</p><LessonPlayer lessonId={id} videoUrl={(lesson.source_videos as {url?:string}|null)?.url} sentences={sentences}/></main>;
}
