import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const body = await request.json() as { completed?: boolean; favorite?: boolean; difficult?: boolean }; const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: sentence } = await supabase.from("lesson_sentences").select("id,lessons!inner(user_id)").eq("id", id).eq("lessons.user_id", user.id).single(); if (!sentence) return NextResponse.json({ error: "Sentence not found" }, { status: 404 });
  const update: Record<string, unknown> = {}; if (typeof body.completed === "boolean") update.completed_at = body.completed ? new Date().toISOString() : null; if (typeof body.favorite === "boolean") update.is_favorite = body.favorite; if (typeof body.difficult === "boolean") update.is_difficult = body.difficult;
  const { data, error } = await supabase.from("lesson_sentences").update(update).eq("id", id).select("id,completed_at,is_favorite,is_difficult").single(); if (error) return NextResponse.json({ error: error.message }, { status: 500 }); return NextResponse.json(data);
}
