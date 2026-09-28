-- Apply this migration when a Supabase project already has the original schema.
alter table public.lessons add column if not exists processing_stage text default 'queued';
alter table public.lessons add column if not exists error_message text;
alter table public.lessons add column if not exists attempts integer default 0;
alter table public.lessons add column if not exists locked_by text;
alter table public.lessons add column if not exists locked_at timestamptz;
alter table public.lessons add column if not exists heartbeat_at timestamptz;
alter table public.lesson_sentences add column if not exists completed_at timestamptz;
alter table public.lesson_sentences add column if not exists is_favorite boolean default false;
alter table public.lesson_sentences add column if not exists is_difficult boolean default false;
alter table public.lesson_sentences add column if not exists review_count integer default 0;
alter table public.lesson_sentences add column if not exists last_reviewed_at timestamptz;
alter table public.lesson_sentences add column if not exists next_review_at timestamptz;
alter table public.lesson_sentences add column if not exists correct_streak integer default 0;
create table if not exists public.worker_heartbeats (worker_id text primary key, last_seen_at timestamptz not null default now(), jobs_processed integer default 0, last_error text);

alter table public.lessons drop constraint if exists lessons_status_check;
alter table public.lessons add constraint lessons_status_check check (status in ('processing', 'ready', 'failed'));
alter table public.lessons drop constraint if exists lessons_stage_check;
alter table public.lessons add constraint lessons_stage_check check (processing_stage in ('queued', 'fetching_captions', 'analyzing', 'saving', 'complete', 'failed'));
alter table public.source_videos drop constraint if exists source_videos_platform_check;
alter table public.source_videos add constraint source_videos_platform_check check (platform in ('youtube', 'tiktok', 'unknown'));
alter table public.lesson_sentences drop constraint if exists lesson_sentences_difficulty_check;
alter table public.lesson_sentences add constraint lesson_sentences_difficulty_check check (difficulty in ('beginner', 'intermediate', 'advanced'));
alter table public.lesson_sentences drop constraint if exists lesson_sentences_sequence_unique;
alter table public.lesson_sentences add constraint lesson_sentences_sequence_unique unique (lesson_id, sequence);

drop policy if exists "users update own sentences" on public.lesson_sentences;
create policy "users update own sentences" on public.lesson_sentences for update using (exists (select 1 from public.lessons where lessons.id = lesson_sentences.lesson_id and lessons.user_id = auth.uid())) with check (exists (select 1 from public.lessons where lessons.id = lesson_sentences.lesson_id and lessons.user_id = auth.uid()));

drop function if exists public.claim_next_lesson(integer);
create or replace function public.claim_next_lesson(worker_name text, max_attempts integer default 3)
returns uuid language plpgsql security definer set search_path = public as $$
declare claimed_id uuid;
begin
  update public.lessons set status = 'failed', processing_stage = 'failed', error_message = 'Worker heartbeat timed out; retry available.', locked_by = null, locked_at = null, heartbeat_at = null where status = 'processing' and processing_stage not in ('queued', 'failed', 'complete') and heartbeat_at < now() - interval '2 minutes';
  select id into claimed_id from public.lessons where status = 'processing' and processing_stage in ('queued', 'failed') and attempts < max_attempts order by created_at for update skip locked limit 1;
  if claimed_id is null then return null; end if;
  update public.lessons set attempts = attempts + 1, processing_stage = 'queued', error_message = null, locked_by = worker_name, locked_at = now(), heartbeat_at = now() where id = claimed_id;
  return claimed_id;
end;
$$;
alter function public.claim_next_lesson(text, integer) security definer;

do $$ begin
  alter publication supabase_realtime add table public.lessons;
exception when duplicate_object then null;
end $$;
