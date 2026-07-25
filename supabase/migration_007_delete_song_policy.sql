-- Run this in the Supabase SQL editor to let the admin delete junk/duplicate
-- song entries from the 주가 관리 screen (e.g. songs that got matched to the
-- wrong YouTube video because their title was too ambiguous to search well).
-- song_view_history rows for the deleted song are removed automatically
-- (its foreign key was created with "on delete cascade").

create policy "Only the admin account can delete songs"
  on public.songs for delete
  using (auth.jwt() ->> 'email' = 'infinitefoever@naver.com');
