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

// videoId를 이미 알고 있을 때 쓰는 정확한 조회. 텍스트 검색이 아니라 ID로 바로
// 찾기 때문에 결과가 절대 흔들리지 않는다 — 매일 조회수를 갱신할 때는 반드시
// 이 함수를 써야 한다.
export async function getViewCountById(apiKey, videoId) {
  const url = `${YOUTUBE_API_BASE}/videos?part=statistics&id=${videoId}&key=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) {
    console.error('[youtube] video stats error:', await readUpstreamError(res))
    return 0
  }
  const data = await res.json()
  return Number(data.items?.[0]?.statistics?.viewCount ?? 0)
}

// 곡명+아티스트로 Official Audio/Topic 영상을 검색해서 videoId와 그 시점 조회수를
// 함께 반환한다. 텍스트 검색이라 매번 정확히 같은 영상이 나온다는 보장이 없으므로
// (제목이 애매하면 날마다 다른 영상이 뽑힐 수 있음), 호출부는 여기서 받은 videoId를
// songs.video_id에 저장해두고 이후에는 getViewCountById로만 조회해야 한다.
export async function findYoutubeVideoMatch(apiKey, title, artist) {
  const video = await searchYoutubeVideo(apiKey, `${artist} ${title} official audio`)
  const videoId = video?.id?.videoId
  if (!videoId) return { videoId: null, viewCount: 0 }
  const viewCount = await getViewCountById(apiKey, videoId)
  return { videoId, viewCount }
}

// videoId가 있으면 정확한 조회, 없으면 텍스트 검색으로 최초 1회 매칭.
// 검색으로 새로 찾은 videoId는 호출부가 반드시 저장해서 다음부터는 고정시켜야 한다.
export async function findYoutubeViewCount(apiKey, title, artist, knownVideoId) {
  if (knownVideoId) return getViewCountById(apiKey, knownVideoId)
  const { viewCount } = await findYoutubeVideoMatch(apiKey, title, artist)
  return viewCount
}
