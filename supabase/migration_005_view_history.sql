-- Run this in the Supabase SQL editor to enable per-day view count history
-- in the admin "주가 관리" screen.

create table public.song_view_history (
  id uuid primary key default gen_random_uuid(),
  song_id text not null references public.songs (song_id) on delete cascade,
  view_count bigint not null,
  recorded_date date not null default current_date,
  unique (song_id, recorded_date)
);

alter table public.song_view_history enable row level security;

create policy "Only the admin account can view history"
  on public.song_view_history for select
  using (auth.jwt() ->> 'email' = 'infinitefoever@naver.com');

create policy "Only the admin account can insert history"
  on public.song_view_history for insert
  with check (auth.jwt() ->> 'email' = 'infinitefoever@naver.com');

create policy "Only the admin account can update history"
  on public.song_view_history for update
  using (auth.jwt() ->> 'email' = 'infinitefoever@naver.com');
