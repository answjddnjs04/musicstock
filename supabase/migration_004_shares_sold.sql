-- Run this in the Supabase SQL editor to enforce real inventory limits.
-- total_shares is the supply cap (admin-controlled); shares_sold tracks how
-- many are currently owned across ALL users. Regular users can't UPDATE the
-- songs table directly (that policy is admin-only), so buying/selling goes
-- through these security-definer functions instead, which check availability
-- and increment/decrement atomically (via `for update` row locking) so two
-- concurrent buyers can't both grab the last share.

alter table public.songs add column shares_sold bigint not null default 0;

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
