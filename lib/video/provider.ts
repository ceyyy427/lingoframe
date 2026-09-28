export type VideoSource = { platform: "youtube" | "tiktok" | "unknown"; externalId?: string; url: string };
export type TranscriptSegment = { start: number; end: number; text: string };

export function identifyVideo(url: string): VideoSource {
  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "youtube.com" || host === "m.youtube.com") return { platform: "youtube", externalId: parsed.searchParams.get("v") ?? undefined, url };
  if (host === "youtu.be") return { platform: "youtube", externalId: parsed.pathname.split("/").filter(Boolean)[0], url };
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return { platform: "tiktok", url };
  return { platform: "unknown", url };
}

export interface TranscriptProvider { getTranscript(source: VideoSource): Promise<TranscriptSegment[]>; }

import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export class AuthorizedTranscriptProvider implements TranscriptProvider {
  async getTranscript(source: VideoSource) {
    if (source.platform !== "youtube") throw new Error("This subtitle adapter currently supports YouTube URLs only.");
    const directory = await mkdtemp(join(tmpdir(), "lingoframe-captions-"));
    const executable = process.env.YOUTUBE_DL_BIN || "youtube-dl";
    try {
      await execFileAsync(executable, ["--skip-download", "--write-subs", "--write-auto-subs", "--sub-langs", "en,en-US,en-GB", "--sub-format", "vtt", "--output", join(directory, "caption.%(ext)s"), source.url], { timeout: 120_000, maxBuffer: 1024 * 1024 * 8 });
      const files = (await readdir(directory)).filter((file) => file.endsWith(".vtt"));
      if (!files.length) throw new Error("No English caption track was found for this video.");
      return parseVtt(await readFile(join(directory, files[0]), "utf8"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new Error("youtube-dl was not found. Install youtube-dl or set YOUTUBE_DL_BIN to its path.");
      throw new Error(`Could not retrieve permitted YouTube captions: ${error instanceof Error ? error.message : "unknown error"}`);
    } finally { await rm(directory, { recursive: true, force: true }); }
  }
}

export function parseVtt(vtt: string): TranscriptSegment[] {
  const blocks = vtt.split(/\r?\n\s*\r?\n/); const output: TranscriptSegment[] = []; let last = "";
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const timing = lines.find((line) => line.includes("-->")); if (!timing) continue;
    const [start, end] = timing.split("-->").map((value) => parseVttTime(value.trim().split(" ")[0]));
    const text = lines.slice(lines.indexOf(timing) + 1).join(" ").replace(/<[^>]+>/g, "").trim();
    if (text && text !== last) { output.push({ start, end, text }); last = text; }
  }
  return output;
}

function parseVttTime(value: string) { const parts = value.split(":").map(Number); if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]; return parts[0] * 60 + parts[1]; }
