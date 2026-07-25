// Cloudflare Pages Function: POST /api/snapshot-views
// GitHub Actions가 매일 10시(KST)에 이 엔드포인트를 호출해서, 등록된 모든 곡의
// 조회수를 서버에서 직접 기록한다(관리자가 화면을 열지 않아도 매일 자동 실행).
// service role 키로 Supabase RLS를 우회해서 쓰기 때문에, 아무나 못 부르게
// CRON_SECRET을 대조하는 인증을 반드시 거친다.
import { createClient } from '@supabase/supabase-js'
import { findYoutubeViewCount } from '../_lib/youtube.js'

function todayInSeoul() {
  // KST는 UTC+9 고정(서머타임 없음)이라 그냥 9시간 더해서 날짜만 뽑으면 된다.
  const seoulNow = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return seoulNow.toISOString().slice(0, 10)
}

export async function onRequestPost(context) {
  const { env, request } = context

  const authHeader = request.headers.get('Authorization') ?? ''
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabaseUrl = env.VITE_SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
  const youtubeApiKey = env.YOUTUBE_API_KEY

  if (!supabaseUrl || !serviceRoleKey || !youtubeApiKey) {
    return new Response(
      JSON.stringify({ error: '필요한 환경변수가 설정되어 있지 않아요.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data: songs, error: fetchError } = await supabase
    .from('songs')
    .select('song_id, title, artist')

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const recordedDate = todayInSeoul()

  const rows = await Promise.all(
    (songs ?? []).map(async (song) => ({
      song_id: song.song_id,
      view_count: await findYoutubeViewCount(youtubeApiKey, song.title, song.artist),
      recorded_date: recordedDate,
    }))
  )

  if (rows.length > 0) {
    const { error: upsertError } = await supabase
      .from('song_view_history')
      .upsert(rows, { onConflict: 'song_id,recorded_date' })

    if (upsertError) {
      return new Response(JSON.stringify({ error: upsertError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  return new Response(
    JSON.stringify({ ok: true, recorded_date: recordedDate, count: rows.length }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
