const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

function getApiKey() {
  return import.meta.env.VITE_YOUTUBE_API_KEY
}

async function searchArtistVideos(artistName) {
  const apiKey = getApiKey()
  const query = encodeURIComponent(`${artistName} Topic Audio`)
  const url = `${YOUTUBE_API_BASE}/search?part=snippet&type=video&maxResults=20&q=${query}&key=${apiKey}`

  const res = await fetch(url)
  if (!res.ok) throw new Error('YouTube 검색에 실패했어요.')
  const data = await res.json()
  return data.items ?? []
}

async function fetchViewCounts(videoIds) {
  const apiKey = getApiKey()
  const url = `${YOUTUBE_API_BASE}/videos?part=statistics&id=${videoIds.join(',')}&key=${apiKey}`

  const res = await fetch(url)
  if (!res.ok) throw new Error('조회수를 가져오지 못했어요.')
  const data = await res.json()
  return data.items ?? []
}

export async function fetchArtistTracks(artistName) {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('YouTube API 키가 설정되어 있지 않아요.')

  const videos = await searchArtistVideos(artistName)
  const videoIds = videos.map((v) => v.id.videoId).filter(Boolean)
  if (videoIds.length === 0) return []

  const stats = await fetchViewCounts(videoIds)
  const viewCountById = new Map(
    stats.map((item) => [item.id, Number(item.statistics?.viewCount ?? 0)])
  )

  return videos
    .filter((video) => video.id.videoId)
    .map((video) => {
      const videoId = video.id.videoId
      const thumbnails = video.snippet.thumbnails ?? {}
      const albumCover =
        thumbnails.high?.url ?? thumbnails.medium?.url ?? thumbnails.default?.url

      return {
        song_id: `yt_${videoId}`,
        title: video.snippet.title,
        artist: artistName,
        album_cover: albumCover,
        view_count: viewCountById.get(videoId) ?? 0,
      }
    })
}
