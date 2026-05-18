# Backend DB Setup (Supabase)

This app now includes a backend endpoint for persisting Google sync status:

- `POST /api/google/sync-state`

It stores a row per device in table `google_sync_state`.

## 1. Create table in Supabase

Run this SQL in Supabase SQL Editor:

```sql
create table if not exists public.google_sync_state (
  id bigserial primary key,
  device_id text not null unique,
  source text not null default 'google',
  google_authenticated boolean not null default false,
  google_consent_granted boolean not null default false,
  has_cycle_data boolean not null default false,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at_google_sync_state()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_updated_at_google_sync_state on public.google_sync_state;
create trigger trg_set_updated_at_google_sync_state
before update on public.google_sync_state
for each row
execute function public.set_updated_at_google_sync_state();
```

## 2. Configure Vercel env vars

Set these variables in Vercel Project Settings -> Environment Variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Also ensure these are set for Google auth and Gemma:

- `VITE_GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `VITE_GOOGLE_REDIRECT_URI`
- `GEMMA_API_KEY`
- `GEMMA_MODEL`

## 3. Data flow

1. Frontend authenticates with Google OAuth.
2. Frontend calls `/api/google/fit-cycle-data`.
3. On success, frontend sends a best-effort write to `/api/google/sync-state`.
4. Vercel function upserts row by `device_id` in Supabase.

## 4. Notes

- This stores sync metadata only, not raw health records.
- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed in frontend code.
- Endpoint is designed as upsert so repeated syncs update the same device row.
