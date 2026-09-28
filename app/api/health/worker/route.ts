import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const db = createSupabaseAdminClient(); const cutoff = new Date(Date.now() - 45_000).toISOString(); const { data, error } = await db.from("worker_heartbeats").select("worker_id,last_seen_at,jobs_processed,last_error").gt("last_seen_at", cutoff).order("last_seen_at", { ascending:false });
  if (error) return NextResponse.json({ status:"unknown", error:error.message }, { status:503 });
  return NextResponse.json({ status: data?.length ? "healthy" : "offline", workers: data ?? [] }, { status: data?.length ? 200 : 503 });
}
