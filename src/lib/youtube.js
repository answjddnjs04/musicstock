export async function fetchYoutubeSongs() {
  const res = await fetch('/api/songs')
  if (!res.ok) throw new Error('Failed to load YouTube song data')
  const data = await res.json()
  return data.songs ?? []
}
