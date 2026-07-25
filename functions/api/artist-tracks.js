const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
const RESULT_LIMIT = 5

async function getSpotifyToken(clientId, clientSecret) {
  const credentials = btoa(`${clientId}:${clientSecret}`)
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error('Spotify 인증에 실패했어요.')
  const data = await res.json()
  return data.access_token
}

async function searchSpotifyTracks(token, artistName) {
  const query = encodeURIComponent(`artist:${artistName}`)
  const url = `${SPOTIFY_API_BASE}/search?q=${query}&type=track&limit=${RESULT_LIMIT}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('Spotify 검색에 실패했어요.')
  const data = await res.json()
  return data.tracks?.items ?? []
}

function pickBestVideo(items) {
  const isOfficialOrTopic = (item) => {
    const channelTitle = item.snippet.channelTitle ?? ''
    const title = item.snippet.title ?? ''
    return (
      channelTitle.toLowerCase().endsWith('- topic') ||
      /official\s*audio/i.test(title)
    )
  }
  return items.find(isOfficialOrTopic) ?? items[0] ?? null
}

async function findYoutubeViewCount(apiKey, title, artist) {
  const query = encodeURIComponent(`${artist} ${title} official audio`)
  const searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&type=video&videoCategoryId=10&maxResults=5&q=${query}&key=${apiKey}`
  const searchRes = await fetch(searchUrl)
  if (!searchRes.ok) return 0

  const searchData = await searchRes.json()
  const best = pickBestVideo(searchData.items ?? [])
  const videoId = best?.id?.videoId
  if (!videoId) return 0

  const videoUrl = `${YOUTUBE_API_BASE}/videos?part=statistics&id=${videoId}&key=${apiKey}`
  const videoRes = await fetch(videoUrl)
  if (!videoRes.ok) return 0

  const videoData = await videoRes.json()
  return Number(videoData.items?.[0]?.statistics?.viewCount ?? 0)
}

export async function onRequestGet(context) {
  const spotifyClientId = context.env.SPOTIFY_CLIENT_ID
  const spotifyClientSecret = context.env.SPOTIFY_CLIENT_SECRET
  const youtubeApiKey = context.env.YOUTUBE_API_KEY

  const artistName = new URL(context.request.url).searchParams
    .get('artist')
    ?.trim()

  if (!artistName) {
    return new Response(JSON.stringify({ error: 'artist 파라미터가 필요해요.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!spotifyClientId || !spotifyClientSecret || !youtubeApiKey) {
    return new Response(
      JSON.stringify({ error: 'Spotify/YouTube API 키가 설정되어 있지 않아요.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const token = await getSpotifyToken(spotifyClientId, spotifyClientSecret)
    const tracks = await searchSpotifyTracks(token, artistName)

    const songs = await Promise.all(
      tracks.map(async (track) => {
        const artist = track.artists.map((a) => a.name).join(', ')
        const viewCount = await findYoutubeViewCount(
          youtubeApiKey,
          track.name,
          artist
        )
        return {
          song_id: `sp_${track.id}`,
          title: track.name,
          artist,
          album_cover: track.album.images?.[0]?.url ?? null,
          view_count: viewCount,
        }
      })
    )

    return new Response(JSON.stringify({ songs }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
