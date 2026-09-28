import { createSupabaseAdminClient } from "../lib/supabase/admin";
import { processLesson } from "../lib/lessons/process";

const db = createSupabaseAdminClient();
const interval = Number(process.env.WORKER_INTERVAL_MS ?? 3000);
const workerId = `${process.env.WORKER_ID ?? "worker"}-${process.pid}`;

async function claimAndProcess() {
  await touchWorker();
  const { data: lessonId, error } = await db.rpc("claim_next_lesson", { worker_name: workerId, max_attempts: 3 });
  if (error) { await touchWorker(error.message); return; }
  if (!lessonId) return;
  try { await processLesson(lessonId, workerId); await touchWorker(undefined, true); } catch (caught) { await touchWorker(caught instanceof Error ? caught.message : "job failed"); }
}

async function touchWorker(lastError?: string, completed = false) {
  const { data: current } = await db.from("worker_heartbeats").select("jobs_processed").eq("worker_id", workerId).maybeSingle();
  await db.from("worker_heartbeats").upsert({ worker_id: workerId, last_seen_at: new Date().toISOString(), jobs_processed: (current?.jobs_processed ?? 0) + (completed ? 1 : 0), last_error: lastError ?? null });
}

console.log(`LingoFrame lesson worker polling every ${interval}ms`);
setInterval(() => void claimAndProcess(), interval);
void claimAndProcess();
