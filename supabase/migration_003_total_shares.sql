-- Run this in the Supabase SQL editor to switch market cap from the old
-- trading_volume proxy to an admin-controlled total_shares ("주식분할 개수").

alter table public.songs add column total_shares bigint not null default 1;
alter table public.songs drop column if exists trading_volume;
