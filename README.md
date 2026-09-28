# LingoFrame

LingoFrame is an AI-assisted English learning platform built around authentic video. Users paste a supported video URL and receive a sentence-by-sentence lesson with translations, grammar and slang explanations, pronunciation practice, and personal learning history.

## Current slice

- Next.js App Router + TypeScript foundation
- Landing page and lesson creation flow
- Provider boundaries for video transcripts and language models
- Supabase magic-link auth and lesson persistence
- YouTube subtitle extraction through a local `youtube-dl` executable
- OpenAI Responses API and Anthropic structured-analysis adapters
- OpenAI speech transcription, TTS, browser recording, and pronunciation scoring
- Initial Supabase schema with RLS policies

## Run locally

Node.js 20+ is required. This workspace includes a local Node runtime at `.tools/node`.

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
npm install
cp .env.example .env.local
npm run dev
# In a second terminal, process queued lessons:
npm run worker
```

Open `http://localhost:3000`. Install `youtube-dl` and set `YOUTUBE_DL_BIN` if its executable is not on PATH. Configure Supabase Auth's Site URL and redirect URL as `http://localhost:3000/auth/callback`.

Run `supabase/schema.sql` in the Supabase SQL Editor after creating the project. If the original schema was already applied, run `supabase/migrations/0002_learning_loop.sql` instead. The worker requires `SUPABASE_SERVICE_ROLE_KEY`, because it processes only jobs already created for an authenticated user. In production, run the worker as a separate long-lived process rather than relying on a web request to stay alive.

Lesson creation is asynchronous: the API returns `202`, the lesson page polls its status, and failed jobs expose a retry action. Processing stages are stored in `lessons.processing_stage`.

The worker now claims jobs through an atomic Supabase RPC, writes heartbeats to `worker_heartbeats`, and exposes `/api/health/worker` for monitoring. The Dashboard's “Today's review” entry uses a small interval scheduler: Again in 10 minutes, Hard tomorrow, Good in 3 days, Easy in 7–14 days.

## Product architecture

The app deliberately separates `lib/video` and `lib/ai`. The production implementation should connect these interfaces to permitted caption/transcript sources and a server-side model provider such as OpenAI or Anthropic. Never expose API keys in client code. The app should embed original videos and store analysis rather than downloading or redistributing third-party media without authorization.

## Remaining product work

1. Add the curated grammar, slang, daily English, and business English knowledge base.
2. Add background jobs for long videos and retryable processing.
3. Add billing, quotas, moderation, and an admin resource-review workflow.

The current pronunciation score is a transparent word-order similarity score, not a phoneme-level clinical assessment. It is a useful MVP signal and should later be replaced or complemented by a dedicated pronunciation-evaluation service.

## License

Add a license before publishing this repository publicly.
