-- Incremental migration: run this in the Supabase SQL editor if you already
-- applied schema.sql before the songs table existed. (schema.sql now
-- includes this for fresh installs, so new projects only need schema.sql.)

create table public.songs (
  song_id text primary key,
  title text not null,
  artist text not null,
  album_cover text,
  current_price bigint not null default 1000,
  daily_views_growth bigint not null default 0,
  price_change_rate numeric not null default 0,
  trading_volume bigint not null default 0,
  dividend_yield_ratio numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.songs enable row level security;

create policy "Anyone can view songs"
  on public.songs for select
  using (true);

create policy "Only the admin account can add songs"
  on public.songs for insert
  with check (auth.jwt() ->> 'email' = 'infinitefoever@naver.com');

create policy "Only the admin account can update songs"
  on public.songs for update
  using (auth.jwt() ->> 'email' = 'infinitefoever@naver.com');
