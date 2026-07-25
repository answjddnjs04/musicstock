const TRACK_QUERIES = [
  { song_id: 'song_01', title: 'Hype Boy', artist: 'NewJeans' },
  { song_id: 'song_02', title: 'Dynamite', artist: 'BTS' },
  { song_id: 'song_03', title: 'APT.', artist: 'ROSÉ' },
  { song_id: 'song_04', title: 'Super Shy', artist: 'NewJeans' },
  { song_id: 'song_05', title: 'Spicy', artist: 'aespa' },
  { song_id: 'song_06', title: 'Seven', artist: 'Jung Kook' },
  { song_id: 'song_07', title: 'Ditto', artist: 'NewJeans' },
  { song_id: 'song_08', title: 'Cupid', artist: 'FIFTY FIFTY' },
  { song_id: 'song_09', title: 'I AM', artist: 'IVE' },
  { song_id: 'song_10', title: 'Golden', artist: 'HUNTR/X' },
]

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

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

async function searchVideoId(apiKey, { title, artist }) {
  const query = encodeURIComponent(`${artist} ${title} official audio`)
  const url = `${YOUTUBE_API_BASE}/search?part=snippet&type=video&videoCategoryId=10&maxResults=5&q=${query}&key=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  const best = pickBestVideo(data.items ?? [])
  return best?.id?.videoId ?? null
}

async function fetchVideoDetails(apiKey, videoId) {
  const url = `${YOUTUBE_API_BASE}/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  return data.items?.[0] ?? null
}

async function resolveTrack(apiKey, query) {
  const videoId = await searchVideoId(apiKey, query)
  if (!videoId) return { song_id: query.song_id, found: false }

  const video = await fetchVideoDetails(apiKey, videoId)
  if (!video) return { song_id: query.song_id, found: false }

  const thumbnails = video.snippet.thumbnails ?? {}
  const bestThumbnail =
    thumbnails.maxres ?? thumbnails.high ?? thumbnails.medium ?? thumbnails.default

  return {
    song_id: query.song_id,
    found: true,
    title: query.title,
    artist: query.artist,
    video_id: videoId,
    album_cover: bestThumbnail?.url ?? null,
    view_count: Number(video.statistics?.viewCount ?? 0),
  }
}

export async function onRequestGet(context) {
  const apiKey = context.env.YOUTUBE_API_KEY

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'YouTube API key not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const cache = caches.default
  const cacheKey = new Request(context.request.url, context.request)
  const cached = await cache.match(cacheKey)
  if (cached) return cached

  try {
    const results = await Promise.all(
      TRACK_QUERIES.map((query) => resolveTrack(apiKey, query))
    )

    const response = new Response(JSON.stringify({ songs: results }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    })

    context.waitUntil(cache.put(cacheKey, response.clone()))
    return response
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
