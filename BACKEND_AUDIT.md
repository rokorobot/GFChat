# GF.Chat Backend Audit (Supabase Infrastructure)

This document describes all existing Supabase integrations, database schema definitions, and Edge Functions found in the repository.

## 1. Supabase Client Configurations
- Located in `src/integrations/supabase/client.ts`.
- Uses a hardcoded publishable key pointing to project ID: `lfhmzgqkgxidmsaqpqim`.
- Currently does not fetch URL/key dynamically from environment variables, which prevents easy rotation or staging builds.

## 2. Database Migrations (`/supabase/migrations/`)
The repository contains 3 migrations specifying the MVP database schema:

### A. Messages Table (`20250918150523_...sql`)
- **Table**: `public.messages`
- **Fields**:
  - `id`: `UUID` (Primary Key, default `gen_random_uuid()`)
  - `user_id`: `UUID` (Foreign key referencing `auth.users(id)` ON DELETE CASCADE)
  - `content`: `TEXT`
  - `is_user`: `BOOLEAN`
  - `created_at` / `updated_at`: `TIMESTAMPTZ` (Auto-updated with trigger)
- **RLS (Row Level Security)**: Enabled. Users can perform SELECT, INSERT, UPDATE, and DELETE operations only where `auth.uid() = user_id`.

### B. User Facts Table (`20250919095124_...sql`)
Used for Companion memory and relationship building.
- **Table**: `public.user_facts`
- **Fields**:
  - `id`: `UUID` (Primary Key)
  - `user_id`: `UUID`
  - `fact_category`: `TEXT` (e.g. `location`, `interests`, `preferences`, `personal`)
  - `fact_key`: `TEXT` (e.g. `city`, `hobby`, `favorite_food`)
  - `fact_value`: `TEXT`
  - `confidence_score`: `FLOAT` (default 1.0)
- **RLS**: Enabled. Only owner has read/write access.
- **Unique Constraint**: `UNIQUE(user_id, fact_category, fact_key)` to allow key upserts.

### C. Feedback Table (`20250927163344_...sql`)
- **Table**: `public.feedback`
- **Fields**:
  - `id`: `UUID` (Primary Key)
  - `user_id`: `UUID`
  - `feedback_text`: `TEXT`
  - `feedback_type`: `TEXT` (default `'general'`)
- **RLS**: Enabled. Owner can insert/read their own feedback.

---

## 3. Edge Functions (`/supabase/functions/`)

### A. `chat-ai`
- **Purpose**: Relays chat messages to OpenAI (`gpt-4o-mini`).
- **Dependencies**: Requires `OPENAI_API_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` env vars.
- **Context Flow**:
  1. Fetches user details/facts from the `user_facts` table.
  2. Pulls up to the last 20 messages for context from `messages`.
  3. Prepares system instructions based on Companion personality and user facts.
  4. Calls OpenAI Chat Completion.
  5. Performs asynchronous extraction of new user facts using a separate OpenAI API call and saves them to `user_facts`.

### B. `text-to-speech`
- **Purpose**: Generates base64-encoded audio speech from input text using OpenAI TTS model.
- **Dependencies**: Requires `OPENAI_API_KEY` configured in the Supabase Edge Function environment.

---

## 4. Fresh Backend Plan
For the new clean Supabase setup, the following schema is recommended:
1. Re-run migrations A, B, and C on the new project.
2. Add a `girlfriend_profiles` table to store multiple girlfriend shapes if we support customized companions:
   - `id`, `user_id`, `name`, `voice_settings`, `avatar_settings`, `personality_description`, etc.
3. Deploy the Edge Functions `chat-ai` and `text-to-speech` with the same logic, but cleanly separated into a configurable deployment script.
