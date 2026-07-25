import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { MusicCard } from './MusicCard'
import { fetchArtistTracks } from '../lib/youtubeArtist'
import { buildSongFromYoutubeTrack } from '../lib/songRegistry'

export function ArtistRegisterPanel({ onTrade }) {
  const { songs, registerSongs } = useApp()
  const [artistName, setArtistName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [registeredIds, setRegisteredIds] = useState([])

  const handleSearch = async (e) => {
    e.preventDefault()
    const query = artistName.trim()
    if (!query || isLoading) return

    setIsLoading(true)
    setError('')

    try {
      const tracks = await fetchArtistTracks(query)
      if (tracks.length === 0) {
        setError('검색 결과가 없어요.')
        return
      }
      const newSongs = tracks.map(buildSongFromYoutubeTrack)
      registerSongs(newSongs)
      setRegisteredIds(newSongs.map((s) => s.song_id))
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const registeredSongs = songs.filter((s) => registeredIds.includes(s.song_id))

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={artistName}
          onChange={(e) => setArtistName(e.target.value)}
          placeholder="아티스트명을 입력하세요 (예: NewJeans)"
          className="flex-1 rounded-pill bg-surface px-4 py-2 text-sm text-white placeholder:text-muted focus:outline-none"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="shrink-0 rounded-pill bg-rise px-4 py-2 text-sm font-semibold text-background disabled:opacity-50"
        >
          {isLoading ? '검색 중...' : '검색'}
        </button>
      </form>

      {error && <p className="text-xs text-fall">{error}</p>}

      {registeredSongs.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted">
            {registeredSongs.length}곡이 마켓에 등록됐어요. 바로 매수할 수 있어요.
          </p>
          {registeredSongs.map((song) => (
            <MusicCard
              key={song.song_id}
              song={song}
              variant="list"
              onBuy={(s) => onTrade?.(s, 'buy')}
              onSell={(s) => onTrade?.(s, 'sell')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
