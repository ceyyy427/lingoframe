import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("lessons").select("id,status,processing_stage,error_message,attempts").eq("id", id).eq("user_id", user.id).single();
  if (error || !data) return NextResponse.json({ error: "Lesson not found" }, { status: 404 }); return NextResponse.json(data);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("lessons").update({ status: "processing", processing_stage: "queued", attempts: 0, error_message: null }).eq("id", id).eq("user_id", user.id).eq("status", "failed").select("id").single();
  if (error || !data) return NextResponse.json({ error: "Only failed lessons can be retried." }, { status: 409 }); return NextResponse.json({ id, status: "processing" }, { status: 202 });
}
