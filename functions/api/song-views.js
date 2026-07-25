// Cloudflare Pages Function: POST /api/song-views
// body: { songs: [{ song_id, title, artist, video_id? }] }
// 이미 마켓에 등록된 곡들의 "지금 이 순간" YouTube 조회수를 다시 조회한다.
// video_id가 있으면 정확한 ID 조회(항상 같은 영상), 없으면 텍스트 검색으로 1회
// 매칭하고 그 videoId를 응답에 같이 실어보낸다 — 프론트가 이걸 받아서
// updateSong으로 저장해두면 다음부터는 이 곡도 ID 조회로 고정된다.
import { findYoutubeVideoMatch, getViewCountById } from '../_lib/youtube.js'

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
    songs.map(async (song) => {
      if (song.video_id) {
        const view_count = await getViewCountById(youtubeApiKey, song.video_id)
        return { song_id: song.song_id, view_count, video_id: song.video_id }
      }

      const { videoId, viewCount } = await findYoutubeVideoMatch(
        youtubeApiKey,
        song.title,
        song.artist
      )
      return { song_id: song.song_id, view_count: viewCount, video_id: videoId }
    })
  )

  return new Response(JSON.stringify({ views }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
