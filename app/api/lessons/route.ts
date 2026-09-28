import { NextResponse } from "next/server";
import { identifyVideo } from "@/lib/video/provider";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { rateLimit } from "@/lib/security/rate-limit";

const lessonInput = z.object({ url: z.string().trim().url().max(2048) });

export async function POST(request: Request) {
  try {
    const parsed = lessonInput.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Please provide a valid video URL." }, { status: 400 });
    const { url } = parsed.data;
    const source = identifyVideo(url);
    if (source.platform !== "youtube") return NextResponse.json({ error: "This first version supports YouTube caption tracks only." }, { status: 400 });
    if (!source.externalId) return NextResponse.json({ error: "This YouTube URL does not contain a video ID." }, { status: 400 });
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please sign in before creating a lesson." }, { status: 401 });
    const limit = rateLimit(`lesson:${user.id}`, 5, 60 * 60 * 1000); if (!limit.allowed) return NextResponse.json({ error: "You have reached the hourly lesson limit. Please try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
    const { data: duplicate } = await supabase.from("lessons").select("id,status,source_videos!inner(url)").eq("user_id", user.id).eq("source_videos.url", url).in("status", ["processing", "ready"]).limit(1).maybeSingle();
    if (duplicate) return NextResponse.json({ lessonId: duplicate.id, status: duplicate.status, duplicate: true }, { status: 200 });
    const { data: video, error: videoError } = await supabase.from("source_videos").insert({ platform: source.platform, external_video_id: source.externalId, url: source.url }).select("id").single();
    if (videoError) throw videoError;
    const { data: lesson, error: lessonError } = await supabase.from("lessons").insert({ user_id: user.id, source_video_id: video.id, title: `Lesson from ${source.platform}`, status: "processing", processing_stage: "queued", attempts: 0 }).select("id").single();
    if (lessonError) { await supabase.from("source_videos").delete().eq("id", video.id); throw lessonError; }
    return NextResponse.json({ lessonId: lesson.id, status: "processing" }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create lesson" }, { status: 500 });
  }
}
