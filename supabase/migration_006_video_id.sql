-- Run this in the Supabase SQL editor.
-- Fixes wildly-jumping view counts (e.g. a song's daily count 8x'ing overnight):
-- the view-count refresh was re-searching YouTube by text query every time,
-- which can match a different video day to day for ambiguous titles.
-- video_id pins a song to one specific YouTube video the first time it's
-- resolved; after that, refreshes look it up by ID (exact, never drifts).

alter table public.songs add column video_id text;
