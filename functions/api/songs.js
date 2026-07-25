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

async function getAccessToken(clientId, clientSecret) {
  const credentials = btoa(`${clientId}:${clientSecret}`)
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error('Failed to get Spotify access token')
  const data = await res.json()
  return data.access_token
}

async function searchTrack(token, { title, artist }) {
  const query = encodeURIComponent(`track:${title} artist:${artist}`)
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.tracks?.items?.[0] ?? null
}

export async function onRequestGet(context) {
  const clientId = context.env.SPOTIFY_CLIENT_ID
  const clientSecret = context.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return new Response(
      JSON.stringify({ error: 'Spotify credentials not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const token = await getAccessToken(clientId, clientSecret)

    const results = await Promise.all(
      TRACK_QUERIES.map(async (query) => {
        const track = await searchTrack(token, query)
        if (!track) return { song_id: query.song_id, found: false }
        return {
          song_id: query.song_id,
          found: true,
          title: track.name,
          artist: track.artists.map((a) => a.name).join(', '),
          album_cover: track.album.images?.[0]?.url ?? null,
        }
      })
    )

    return new Response(JSON.stringify({ songs: results }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
