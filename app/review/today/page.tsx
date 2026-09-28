import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ReviewQueue } from "@/components/review-queue";

export const dynamic = "force-dynamic";

export default async function TodayReviewPage() {
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/auth/login");
  const { data: sentences } = await supabase.from("lesson_sentences").select("id,original_text,translation,review_count,correct_streak,next_review_at,lessons!inner(user_id)").eq("lessons.user_id", user.id).or(`next_review_at.is.null,next_review_at.lte.${new Date().toISOString()}`).order("next_review_at", { ascending:true, nullsFirst:true }).limit(10);
  const queue = (sentences ?? []) as Array<{ id:string; original_text:string; translation:string; review_count:number; correct_streak:number }>;
  return <main className="shell"><nav className="nav"><Link className="brand" href="/"><span className="brand-mark">L</span><span>LingoFrame</span></Link><Link href="/dashboard" className="nav-links">← Dashboard</Link></nav><div className="eyebrow">Today’s review</div><h1 style={{fontSize:56}}>Five minutes well spent.</h1><p className="lede">Review up to 10 sentences due today. Honest answers make the schedule smarter.</p><ReviewQueue sentences={queue}/></main>;
}
