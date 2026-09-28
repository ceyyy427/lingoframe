create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  level text default 'intermediate',
  native_language text default 'zh-CN',
  created_at timestamptz default now()
);

create table if not exists source_videos (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  external_video_id text,
  url text not null,
  title text,
  created_at timestamptz default now()
);

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  source_video_id uuid references source_videos(id) on delete set null,
  title text,
  status text default 'processing',
  processing_stage text default 'queued',
  error_message text,
  attempts integer default 0,
  locked_by text,
  locked_at timestamptz,
  heartbeat_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists lesson_sentences (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  sequence integer not null,
  start_time numeric,
  end_time numeric,
  original_text text not null,
  translation text,
  grammar_note text,
  slang_note text,
  pronunciation_hint text,
  difficulty text default 'intermediate',
  completed_at timestamptz,
  is_favorite boolean default false,
  is_difficult boolean default false
  ,review_count integer default 0
  ,last_reviewed_at timestamptz
  ,next_review_at timestamptz
  ,correct_streak integer default 0
);

create table if not exists worker_heartbeats (
  worker_id text primary key,
  last_seen_at timestamptz not null default now(),
  jobs_processed integer default 0,
  last_error text
);

create table if not exists practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  sentence_id uuid references lesson_sentences(id) on delete cascade,
  audio_url text,
  score numeric,
  feedback text,
  created_at timestamptz default now()
);

alter table lessons add constraint lessons_status_check check (status in ('processing', 'ready', 'failed'));
alter table lessons add constraint lessons_stage_check check (processing_stage in ('queued', 'fetching_captions', 'analyzing', 'saving', 'complete', 'failed'));
alter table source_videos add constraint source_videos_platform_check check (platform in ('youtube', 'tiktok', 'unknown'));
alter table lesson_sentences add constraint lesson_sentences_difficulty_check check (difficulty in ('beginner', 'intermediate', 'advanced'));
alter table lesson_sentences add constraint lesson_sentences_sequence_unique unique (lesson_id, sequence);

alter table profiles enable row level security;
alter table source_videos enable row level security;
alter table lessons enable row level security;
alter table lesson_sentences enable row level security;
alter table practice_attempts enable row level security;

create policy "users read own profile" on profiles for select using (auth.uid() = id);
create policy "users insert own source videos" on source_videos for insert with check (auth.uid() is not null);
create policy "users read source videos in own lessons" on source_videos for select using (exists (select 1 from lessons where lessons.source_video_id = source_videos.id and lessons.user_id = auth.uid()));
create policy "users insert own lessons" on lessons for insert with check (auth.uid() = user_id);
create policy "users read own lessons" on lessons for select using (auth.uid() = user_id);
create policy "users insert sentences in own lessons" on lesson_sentences for insert with check (exists (select 1 from lessons where lessons.id = lesson_sentences.lesson_id and lessons.user_id = auth.uid()));
create policy "users read own sentences" on lesson_sentences for select using (exists (select 1 from lessons where lessons.id = lesson_sentences.lesson_id and lessons.user_id = auth.uid()));
create policy "users update own sentences" on lesson_sentences for update using (exists (select 1 from lessons where lessons.id = lesson_sentences.lesson_id and lessons.user_id = auth.uid())) with check (exists (select 1 from lessons where lessons.id = lesson_sentences.lesson_id and lessons.user_id = auth.uid()));
create policy "users insert own practice" on practice_attempts for insert with check (auth.uid() = user_id and exists (select 1 from lesson_sentences join lessons on lessons.id = lesson_sentences.lesson_id where lesson_sentences.id = practice_attempts.sentence_id and lessons.user_id = auth.uid()));
create policy "users read own practice" on practice_attempts for select using (auth.uid() = user_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email)); return new; end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

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
