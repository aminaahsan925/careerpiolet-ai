-- AI Usage Tracking for Rate Limiting
-- Run this in Supabase SQL Editor

create table if not exists ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  window_start timestamp with time zone not null,
  tokens_used bigint not null default 0,
  requests_made bigint not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  primary key (user_id, window_start)
);

create index if not exists ai_usage_user_id_idx on ai_usage(user_id);

alter table ai_usage enable row level security;

create policy "Users can view their own AI usage"
  on ai_usage for select
  using (auth.uid() = user_id);

create policy "Users can insert their own AI usage"
  on ai_usage for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own AI usage"
  on ai_usage for update
  using (auth.uid() = user_id);

-- Function to atomically increment usage
create or replace function increment_ai_usage(
  p_user_id uuid,
  p_window_start timestamp with time zone,
  p_tokens bigint
) returns void
language plpgsql
security definer
as $$
begin
  insert into ai_usage (user_id, window_start, tokens_used, requests_made)
  values (p_user_id, p_window_start, p_tokens, 1)
  on conflict (user_id, window_start) do update set
    tokens_used = ai_usage.tokens_used + p_tokens,
    requests_made = ai_usage.requests_made + 1,
    updated_at = now();
end;
$$;

grant execute on function increment_ai_usage to authenticated;