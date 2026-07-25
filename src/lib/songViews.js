// 등록된 곡들의 "지금" 조회수를 다시 조회하는 창구 (주가 관리 화면 전용).
export async function fetchCurrentViewCounts(songs) {
  const res = await fetch('/api/song-views', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      songs: songs.map((s) => ({
        song_id: s.song_id,
        title: s.title,
        artist: s.artist,
        video_id: s.video_id ?? null,
      })),
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error ?? '조회수를 가져오지 못했어요.')
  }
  return data.views ?? []
}
