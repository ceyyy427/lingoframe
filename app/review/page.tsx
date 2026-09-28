import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/auth/login");
  const { data: sentences } = await supabase.from("lesson_sentences").select("id,original_text,translation,lesson_id,lessons!inner(user_id,title)").eq("is_difficult", true).eq("lessons.user_id", user.id).order("sequence");
  return <main className="shell"><nav className="nav"><Link className="brand" href="/"><span className="brand-mark">L</span><span>LingoFrame</span></Link><Link href="/dashboard" className="nav-links">← Dashboard</Link></nav><div className="eyebrow">Review</div><h1 style={{fontSize:56}}>Your difficult sentences.</h1><p className="lede">Small, repeated practice turns hard phrases into familiar ones.</p><div style={{display:"grid",gap:12,marginTop:34}}>{sentences?.length ? sentences.map(sentence=><Link className="feature" href={`/learn/${sentence.lesson_id}`} key={sentence.id}><small style={{color:"var(--muted)"}}>{(sentence.lessons as {title?:string})?.title}</small><h3>{sentence.original_text}</h3><p>{sentence.translation}</p></Link>) : <article className="feature"><h3>No difficult sentences yet.</h3><p>Mark a sentence as difficult while studying and it will appear here.</p></article>}</div></main>;
}
