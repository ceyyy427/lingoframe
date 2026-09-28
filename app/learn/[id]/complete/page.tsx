import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CompletionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) notFound();
  const { data: lesson } = await supabase.from("lessons").select("id,title,lesson_sentences(completed_at,is_difficult)").eq("id", id).eq("user_id", user.id).single(); if (!lesson) notFound();
  const sentences = lesson.lesson_sentences as Array<{completed_at:string|null;is_difficult:boolean}>; const mastered = sentences.filter(sentence => sentence.completed_at).length; const difficult = sentences.filter(sentence => sentence.is_difficult).length;
  return <main className="shell"><nav className="nav"><Link className="brand" href="/"><span className="brand-mark">L</span><span>LingoFrame</span></Link><Link href="/dashboard" className="nav-links">← Dashboard</Link></nav><div style={{maxWidth:700,margin:"70px auto",textAlign:"center"}}><div className="eyebrow">Lesson complete</div><h1 style={{fontSize:64}}>Nice work. 🎉</h1><p className="lede" style={{margin:"20px auto"}}>{lesson.title} is now part of your learning history.</p><div className="feature-grid" style={{textAlign:"left",marginTop:34}}><article className="feature"><h3>{mastered}</h3><p>sentences learned</p></article><article className="feature"><h3>{difficult}</h3><p>sentences to revisit</p></article><article className="feature"><h3>{sentences.length}</h3><p>sentences in this lesson</p></article></div><div className="hero-actions" style={{justifyContent:"center"}}><Link className="button" href="/review">Review difficult sentences →</Link><Link className="button secondary" href="/dashboard">Back to library</Link></div></div></main>;
}
