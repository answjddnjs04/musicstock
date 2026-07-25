// 관리자 전용 "아티스트 등록" 검색이 호출하는 창구. 실제 Spotify/YouTube 호출은
// Cloudflare Function(functions/api/artist-tracks.js)에서만 일어나므로, 여기는
// 그 결과를 받아오기만 하고 API 키를 전혀 알지 못한다.
export async function searchArtistTracks(artistName) {
  const res = await fetch(`/api/artist-tracks?artist=${encodeURIComponent(artistName)}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error ?? '검색에 실패했어요.')
  }
  return { songs: data.songs ?? [], warning: data.warning ?? null }
}
