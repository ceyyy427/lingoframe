import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { text?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const { data: { user } } = await (await createSupabaseServerClient()).auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limit = rateLimit(`tts:${user.id}`, 30, 10 * 60 * 1000); if (!limit.allowed) return NextResponse.json({ error: "Too many audio requests. Please try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  if (!text || text.length > 500) return NextResponse.json({ error: "Text must be between 1 and 500 characters." }, { status: 400 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const audio = await client.audio.speech.create({ model: "gpt-4o-mini-tts", voice: "marin", input: text, response_format: "mp3" });
  return new NextResponse(await audio.arrayBuffer(), { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, no-store" } });
}
