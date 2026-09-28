import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { nextReviewAt, nextStreak } from "@/lib/review/schedule";

const input = z.object({ quality: z.number().int().min(0).max(5) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const parsed = input.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "quality must be an integer from 0 to 5" }, { status: 400 });
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: sentence } = await supabase.from("lesson_sentences").select("id,review_count,correct_streak,lessons!inner(user_id)").eq("id", id).eq("lessons.user_id", user.id).single(); if (!sentence) return NextResponse.json({ error: "Sentence not found" }, { status: 404 });
  const { data, error } = await supabase.from("lesson_sentences").update({ review_count: (sentence.review_count ?? 0) + 1, last_reviewed_at: new Date().toISOString(), next_review_at: nextReviewAt(parsed.data.quality, sentence.correct_streak ?? 0), correct_streak: nextStreak(parsed.data.quality, sentence.correct_streak ?? 0), completed_at: parsed.data.quality >= 3 ? new Date().toISOString() : null }).eq("id", id).select("id,review_count,last_reviewed_at,next_review_at,correct_streak,completed_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 }); return NextResponse.json(data);
}
