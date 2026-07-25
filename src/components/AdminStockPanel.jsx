import { useState } from 'react'
import { useApp } from '../context/AppContext'

export function AdminStockPanel() {
  const { songs, isAdmin, updateSong } = useApp()
  const [pending, setPending] = useState({})
  const [savingId, setSavingId] = useState(null)

  if (!isAdmin) return null

  const handleChange = (songId, value) => {
    setPending((prev) => ({ ...prev, [songId]: value }))
  }

  const handleSave = async (songId) => {
    const value = Number(pending[songId])
    if (!Number.isFinite(value) || value < 1) return

    setSavingId(songId)
    await updateSong(songId, { total_shares: Math.round(value) })
    setSavingId(null)
    setPending((prev) => {
      const next = { ...prev }
      delete next[songId]
      return next
    })
  }

  if (songs.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-card bg-surface text-sm text-muted">
        등록된 음원이 없어요. 먼저 아티스트 등록에서 곡을 추가해주세요.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted">
        주식분할 개수(총 발행 주식 수)를 조정하면 시가총액과 1주당 가격 체감이
        바뀌어요. 유저가 늘어날 때마다 점진적으로 늘려주세요.
      </p>

      {songs.map((song) => {
        const value = pending[song.song_id] ?? song.total_shares ?? 1
        const isDirty = pending[song.song_id] !== undefined

        return (
          <div
            key={song.song_id}
            className="flex items-center gap-3 rounded-card bg-surface p-3"
          >
            <img
              src={song.album_cover}
              alt={song.title}
              className="h-10 w-10 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{song.title}</p>
              <p className="truncate text-xs text-muted">
                {song.artist} · {song.current_price.toLocaleString()}콩
              </p>
            </div>
            <input
              type="number"
              min={1}
              value={value}
              onChange={(e) => handleChange(song.song_id, e.target.value)}
              className="w-16 shrink-0 rounded-lg bg-background px-2 py-1.5 text-right text-sm text-white focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleSave(song.song_id)}
              disabled={!isDirty || savingId === song.song_id}
              className="shrink-0 rounded-pill bg-rise px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
            >
              {savingId === song.song_id ? '저장 중...' : '저장'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
