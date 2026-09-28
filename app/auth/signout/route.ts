import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  await (await createSupabaseServerClient()).auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), 303);
}
