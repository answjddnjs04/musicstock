// Cloudflare Pages Function: POST /api/song-views
// body: { songs: [{ song_id, title, artist }] }
// 이미 마켓에 등록된 곡들의 "지금 이 순간" YouTube 조회수를 다시 조회한다.
// 주가 관리 화면에서 관리자가 접속할 때마다 호출되고, 그 결과를 프론트가
// song_view_history 테이블에 오늘 날짜로 저장(기록)한다.
import { findYoutubeViewCount } from '../_lib/youtube.js'

export async function onRequestPost(context) {
  const youtubeApiKey = context.env.YOUTUBE_API_KEY

  if (!youtubeApiKey) {
    return new Response(
      JSON.stringify({ error: 'YouTube API 키가 설정되어 있지 않아요.', views: [] }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  let body
  try {
    body = await context.request.json()
  } catch {
    return new Response(
      JSON.stringify({ error: '요청 본문이 올바르지 않아요.', views: [] }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const songs = Array.isArray(body.songs) ? body.songs : []

  const views = await Promise.all(
    songs.map(async (song) => ({
      song_id: song.song_id,
      view_count: await findYoutubeViewCount(youtubeApiKey, song.title, song.artist),
    }))
  )

  return new Response(JSON.stringify({ views }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
