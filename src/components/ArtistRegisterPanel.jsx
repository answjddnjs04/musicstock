import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { searchArtistTracks } from '../lib/artistTracks'
import { buildSongFromYoutubeTrack } from '../lib/songRegistry'

export function ArtistRegisterPanel() {
  const { isAdmin, registerSongs } = useApp()
  const [artistName, setArtistName] = useState('')
  const [candidates, setCandidates] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  if (!isAdmin) return null

  const handleSearch = async (e) => {
    e.preventDefault()
    const query = artistName.trim()
    if (!query || isSearching) return

    setIsSearching(true)
    setError('')
    setSuccessMessage('')

    try {
      const tracks = await searchArtistTracks(query)
      if (tracks.length === 0) {
        setError('검색 결과가 없어요.')
        setCandidates([])
        return
      }
      setCandidates(
        tracks.map((track) => ({
          ...buildSongFromYoutubeTrack(track),
          checked: true,
        }))
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSearching(false)
    }
  }

  const toggleChecked = (songId) => {
    setCandidates((prev) =>
      prev.map((c) => (c.song_id === songId ? { ...c, checked: !c.checked } : c))
    )
  }

  const handleRegister = async () => {
    const selected = candidates.filter((c) => c.checked)
    if (selected.length === 0 || isRegistering) return

    setIsRegistering(true)
    setError('')

    try {
      await registerSongs(selected)
      setSuccessMessage(`${selected.length}곡을 마켓에 등록했어요.`)
      setCandidates([])
      setArtistName('')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsRegistering(false)
    }
  }

  const selectedCount = candidates.filter((c) => c.checked).length

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
          disabled={isSearching}
          className="shrink-0 rounded-pill bg-rise px-4 py-2 text-sm font-semibold text-background disabled:opacity-50"
        >
          {isSearching ? '검색 중...' : '검색'}
        </button>
      </form>

      {error && <p className="text-xs text-fall">{error}</p>}
      {successMessage && <p className="text-xs text-rise">{successMessage}</p>}

      {candidates.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 rounded-card bg-surface p-2">
            {candidates.map((song) => (
              <label
                key={song.song_id}
                className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  checked={song.checked}
                  onChange={() => toggleChecked(song.song_id)}
                  className="h-4 w-4 shrink-0 accent-rise"
                />
                <img
                  src={song.album_cover}
                  alt={song.title}
                  className="h-10 w-10 shrink-0 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold sm:text-sm">
                    {song.title}
                  </p>
                  <p className="truncate text-[11px] text-muted">{song.artist}</p>
                </div>
                <p className="shrink-0 text-xs font-semibold sm:text-sm">
                  {song.current_price.toLocaleString()}콩
                </p>
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRegister}
            disabled={selectedCount === 0 || isRegistering}
            className="rounded-pill bg-rise py-2 text-sm font-semibold text-background disabled:opacity-50"
          >
            {isRegistering
              ? '등록 중...'
              : `선택한 ${selectedCount}곡 마켓에 등록`}
          </button>
        </div>
      )}
    </div>
  )
}
