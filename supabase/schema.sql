-- MusicStock Supabase schema
-- Run this once in the Supabase SQL editor for a new project.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  balance bigint not null default 150000,
  fee_rate numeric not null default 1.8,
  last_settlement_total bigint not null default 0,
  last_settlement_top_song_id text,
  last_settlement_fee_rate numeric not null default 1,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create table public.portfolio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  song_id text not null,
  quantity integer not null default 0,
  avg_price bigint not null default 0,
  unique (user_id, song_id)
);

alter table public.portfolio enable row level security;

create policy "Users can view their own holdings"
  on public.portfolio for select
  using (auth.uid() = user_id);

create policy "Users can modify their own holdings"
  on public.portfolio for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  song_id text not null,
  type text not null check (type in ('buy', 'sell')),
  quantity integer not null,
  price bigint not null,
  fee bigint not null,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

-- Auto-create a profile row (with mock-equivalent starting balance) on signup.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Admin-registered songs (persists across refreshes, visible to everyone).
create table public.songs (
  song_id text primary key,
  title text not null,
  artist text not null,
  album_cover text,
  current_price bigint not null default 1000,
  daily_views_growth bigint not null default 0,
  price_change_rate numeric not null default 0,
  total_shares bigint not null default 1,
  shares_sold bigint not null default 0,
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

-- Buying/selling goes through these instead of updating songs directly, so
-- shares_sold can never exceed total_shares even under concurrent buyers.
create or replace function public.buy_shares(p_song_id text, p_quantity integer)
returns void as $$
declare
  v_total_shares bigint;
  v_shares_sold bigint;
begin
  if p_quantity <= 0 then
    raise exception 'invalid quantity';
  end if;

  select total_shares, shares_sold into v_total_shares, v_shares_sold
  from public.songs
  where song_id = p_song_id
  for update;

  if v_total_shares is null then
    raise exception 'song not found';
  end if;

  if v_shares_sold + p_quantity > v_total_shares then
    raise exception 'not enough shares available';
  end if;

  update public.songs
  set shares_sold = shares_sold + p_quantity
  where song_id = p_song_id;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.sell_shares(p_song_id text, p_quantity integer)
returns void as $$
begin
  if p_quantity <= 0 then
    raise exception 'invalid quantity';
  end if;

  update public.songs
  set shares_sold = greatest(0, shares_sold - p_quantity)
  where song_id = p_song_id;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.buy_shares(text, integer) to authenticated;
grant execute on function public.sell_shares(text, integer) to authenticated;
