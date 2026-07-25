// artist-tracks.js와 song-views.js가 공유하는 YouTube 조회 헬퍼.
// 파일명이 _lib이라 Cloudflare Pages Functions가 라우트로 인식하지 않는다.
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

export async function readUpstreamError(res) {
  const text = await res.text().catch(() => '')
  return `HTTP ${res.status}${text ? `: ${text}` : ''}`
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

async function searchYoutubeVideo(apiKey, query) {
  const url = `${YOUTUBE_API_BASE}/search?part=snippet&type=video&videoCategoryId=10&maxResults=5&q=${encodeURIComponent(query)}&key=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) {
    console.error('[youtube] search error:', await readUpstreamError(res))
    return null
  }
  const data = await res.json()
  return pickBestVideo(data.items ?? [])
}

async function fetchYoutubeViewCount(apiKey, videoId) {
  const url = `${YOUTUBE_API_BASE}/videos?part=statistics&id=${videoId}&key=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) {
    console.error('[youtube] video stats error:', await readUpstreamError(res))
    return 0
  }
  const data = await res.json()
  return Number(data.items?.[0]?.statistics?.viewCount ?? 0)
}

// 곡명+아티스트로 Official Audio/Topic 영상을 찾아 현재 조회수를 반환.
// 매칭되는 영상이 없거나 API 호출이 실패하면 0을 반환한다(예외를 던지지 않음 —
// 호출부가 여러 곡을 Promise.all로 묶어 처리하는데, 한 곡 실패로 전체가
// 죽는 것을 막기 위함).
export async function findYoutubeViewCount(apiKey, title, artist) {
  const video = await searchYoutubeVideo(apiKey, `${artist} ${title} official audio`)
  const videoId = video?.id?.videoId
  if (!videoId) return 0
  return fetchYoutubeViewCount(apiKey, videoId)
}
