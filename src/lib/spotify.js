export async function fetchSpotifySongs() {
  const res = await fetch('/api/songs')
  if (!res.ok) throw new Error('Failed to load Spotify song data')
  const data = await res.json()
  return data.songs ?? []
}
