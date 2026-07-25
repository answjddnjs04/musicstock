export async function searchArtistTracks(artistName) {
  const res = await fetch(`/api/artist-tracks?artist=${encodeURIComponent(artistName)}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error ?? '검색에 실패했어요.')
  }
  return { songs: data.songs ?? [], warning: data.warning ?? null }
}
