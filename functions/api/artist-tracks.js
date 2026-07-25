// Cloudflare Pages Function: GET /api/artist-tracks?artist=NewJeans
// Spotify Client Credentials로 노이즈(MV/팬캠 등) 없는 정식 발매곡을 찾고,
// 그 결과를 YouTube Official Audio/Topic 채널의 조회수와 매핑해서 돌려준다.
// SPOTIFY_CLIENT_ID/SECRET, YOUTUBE_API_KEY는 Cloudflare Pages 환경변수에만
// 존재하고 브라우저로는 절대 내려가지 않는다 — 프론트는 이 엔드포인트만 호출.
// Spotify 쪽이 실패하면(예: 앱 소유 계정 Premium 미구독으로 403) 조용히 죽지 않고
// YouTube 단독 검색으로 자동 폴백해서 기능이 계속 동작하게 한다.
import { findYoutubeViewCount, readUpstreamError } from '../_lib/youtube.js'

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
const RESULT_LIMIT = 5

async function getSpotifyToken(clientId, clientSecret) {
  const credentials = btoa(`${clientId}:${clientSecret}`)

  let res
  try {
    res = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })
  } catch (networkError) {
    console.error('[artist-tracks] Spotify token request threw:', networkError)
    throw new Error(`Spotify 토큰 요청 실패: ${networkError.message}`)
  }

  if (!res.ok) {
    const detail = await readUpstreamError(res)
    console.error('[artist-tracks] Spotify token error:', detail)
    throw new Error(`Spotify 인증 실패 (${detail})`)
  }

  const data = await res.json()
  return data.access_token
}

async function searchSpotifyTracks(token, artistName) {
  const query = encodeURIComponent(`artist:${artistName}`)
  const url = `${SPOTIFY_API_BASE}/search?q=${query}&type=track&limit=${RESULT_LIMIT}`

  let res
  try {
    res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  } catch (networkError) {
    console.error('[artist-tracks] Spotify search request threw:', networkError)
    throw new Error(`Spotify 검색 요청 실패: ${networkError.message}`)
  }

  if (!res.ok) {
    const detail = await readUpstreamError(res)
    console.error('[artist-tracks] Spotify search error:', detail)
    throw new Error(`Spotify 검색 실패 (${detail})`)
  }

  const data = await res.json()
  return data.tracks?.items ?? []
}

async function resolveViaSpotify(spotifyClientId, spotifyClientSecret, youtubeApiKey, artistName) {
  const token = await getSpotifyToken(spotifyClientId, spotifyClientSecret)
  const tracks = await searchSpotifyTracks(token, artistName)

  return Promise.all(
    tracks.map(async (track) => {
      const artist = track.artists.map((a) => a.name).join(', ')
      const viewCount = await findYoutubeViewCount(youtubeApiKey, track.name, artist)

      return {
        song_id: `sp_${track.id}`,
        title: track.name,
        artist,
        album_cover: track.album.images?.[0]?.url ?? null,
        view_count: viewCount,
      }
    })
  )
}

async function resolveViaYoutubeOnly(youtubeApiKey, artistName) {
  const url = `${YOUTUBE_API_BASE}/search?part=snippet&type=video&maxResults=${RESULT_LIMIT}&q=${encodeURIComponent(`${artistName} Topic Audio`)}&key=${youtubeApiKey}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`YouTube 검색 실패 (${await readUpstreamError(res)})`)
  }
  const data = await res.json()
  const videos = (data.items ?? []).filter((v) => v.id?.videoId)
  if (videos.length === 0) return []

  const videoIds = videos.map((v) => v.id.videoId)
  const statsUrl = `${YOUTUBE_API_BASE}/videos?part=statistics&id=${videoIds.join(',')}&key=${youtubeApiKey}`
  const statsRes = await fetch(statsUrl)
  const viewCountById = new Map()
  if (statsRes.ok) {
    const statsData = await statsRes.json()
    for (const item of statsData.items ?? []) {
      viewCountById.set(item.id, Number(item.statistics?.viewCount ?? 0))
    }
  } else {
    console.error(
      '[artist-tracks] YouTube stats (fallback) error:',
      await readUpstreamError(statsRes)
    )
  }

  return videos.map((video) => ({
    song_id: `yt_${video.id.videoId}`,
    title: video.snippet.title,
    artist: artistName,
    album_cover:
      video.snippet.thumbnails?.high?.url ??
      video.snippet.thumbnails?.medium?.url ??
      video.snippet.thumbnails?.default?.url ??
      null,
    view_count: viewCountById.get(video.id.videoId) ?? 0,
  }))
}

export async function onRequestGet(context) {
  const spotifyClientId = context.env.SPOTIFY_CLIENT_ID
  const spotifyClientSecret = context.env.SPOTIFY_CLIENT_SECRET
  const youtubeApiKey = context.env.YOUTUBE_API_KEY

  const artistName = new URL(context.request.url).searchParams
    .get('artist')
    ?.trim()

  if (!artistName) {
    return new Response(
      JSON.stringify({ error: 'artist 파라미터가 필요해요.', songs: [] }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (!youtubeApiKey) {
    return new Response(
      JSON.stringify({ error: 'YouTube API 키가 설정되어 있지 않아요.', songs: [] }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  let songs = []
  let warning = null

  if (spotifyClientId && spotifyClientSecret) {
    try {
      songs = await resolveViaSpotify(
        spotifyClientId,
        spotifyClientSecret,
        youtubeApiKey,
        artistName
      )
    } catch (spotifyError) {
      console.error('[artist-tracks] Spotify path failed, falling back to YouTube:', spotifyError)
      warning = `Spotify 검색 실패로 YouTube 검색으로 대체했어요. (${spotifyError.message})`
    }
  } else {
    warning = 'Spotify 키가 설정되어 있지 않아 YouTube 검색을 사용했어요.'
  }

  if (songs.length === 0) {
    try {
      songs = await resolveViaYoutubeOnly(youtubeApiKey, artistName)
    } catch (youtubeError) {
      console.error('[artist-tracks] YouTube fallback also failed:', youtubeError)
      return new Response(
        JSON.stringify({ error: youtubeError.message, songs: [] }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  return new Response(JSON.stringify({ songs, warning }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
