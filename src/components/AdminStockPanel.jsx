// 관리자 전용 "주가 관리" 화면: 곡별 total_shares(주식분할 개수)를 바로 조정한다.
// shares_sold(현재까지 팔린 수량)는 여기서 못 바꾼다 — 그건 buy_shares/sell_shares
// RPC만 건드릴 수 있는 값이라, 관리자가 실수로 재고 카운트를 깨뜨릴 수 없다.
// 화면을 열면 자동으로 등록된 모든 곡의 "지금" YouTube 조회수를 다시 조회해서
// 보여주고, 동시에 오늘 날짜 스냅샷으로 song_view_history에 기록한다. 곡을
// 클릭하면 그동안 날짜별로 쌓인 조회수 기록을 펼쳐서 보여준다.
import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { fetchCurrentViewCounts } from '../lib/songViews'

export function AdminStockPanel() {
  const {
    songs,
    isAdmin,
    updateSong,
    deleteSong,
    recordViewSnapshot,
    fetchViewHistory,
  } = useApp()
  const [pending, setPending] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [currentViews, setCurrentViews] = useState({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [viewsError, setViewsError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [history, setHistory] = useState({})
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)

  const refreshViews = async () => {
    if (songs.length === 0) return
    setIsRefreshing(true)
    setViewsError('')

    try {
      const views = await fetchCurrentViewCounts(songs)
      const nextViews = {}
      for (const v of views) nextViews[v.song_id] = v.view_count
      setCurrentViews(nextViews)

      await Promise.all(
        views.map(async (v) => {
          await recordViewSnapshot(v.song_id, v.view_count)
          // video_id가 새로 해결된 곡은 저장해둬서 다음부터는 검색 없이
          // 정확한 ID로만 조회되게 고정한다(조회수가 하루아침에 널뛰는 걸 방지).
          const song = songs.find((s) => s.song_id === v.song_id)
          if (v.video_id && song && !song.video_id) {
            await updateSong(v.song_id, { video_id: v.video_id })
          }
        })
      )
    } catch (err) {
      setViewsError(err.message)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (isAdmin && songs.length > 0) refreshViews()
    // songs 배열 자체가 아니라 "처음 열렸을 때 한 번"만 실행되면 되므로
    // 의도적으로 songs.length만 조건에 씀 (곡이 새로 등록됐을 때만 재시도).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, songs.length])

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

  const handleDelete = async (song) => {
    const ok = window.confirm(
      `"${song.title}"을(를) 마켓에서 완전히 삭제할까요? 조회수 기록도 함께 지워집니다.`
    )
    if (!ok) return

    setDeletingId(song.song_id)
    await deleteSong(song.song_id)
    setDeletingId(null)
  }

  const toggleHistory = async (songId) => {
    if (expandedId === songId) {
      setExpandedId(null)
      return
    }
    setExpandedId(songId)
    if (!history[songId]) {
      setIsHistoryLoading(true)
      const rows = await fetchViewHistory(songId)
      setHistory((prev) => ({ ...prev, [songId]: rows }))
      setIsHistoryLoading(false)
    }
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
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">
          주식분할 개수(총 발행 주식 수)를 조정하면 시가총액과 1주당 가격 체감이
          바뀌어요. 곡을 누르면 날짜별 조회수 기록을 볼 수 있어요.
        </p>
        <button
          type="button"
          onClick={refreshViews}
          disabled={isRefreshing}
          className="shrink-0 rounded-pill bg-surface px-3 py-1.5 text-xs font-semibold text-muted disabled:opacity-50"
        >
          {isRefreshing ? '조회수 갱신 중...' : '조회수 새로고침'}
        </button>
      </div>

      {viewsError && <p className="text-xs text-fall">{viewsError}</p>}

      {songs.map((song) => {
        const value = pending[song.song_id] ?? song.total_shares ?? 1
        const isDirty = pending[song.song_id] !== undefined
        const isExpanded = expandedId === song.song_id
        const currentViewCount = currentViews[song.song_id]

        return (
          <div key={song.song_id} className="rounded-card bg-surface">
            <div className="flex items-center gap-3 p-3">
              <button
                type="button"
                onClick={() => toggleHistory(song.song_id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
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
                  <p className="truncate text-[11px] text-muted">
                    판매됨 {song.shares_sold ?? 0} / {song.total_shares ?? 1} · 조회수{' '}
                    {currentViewCount !== undefined
                      ? currentViewCount.toLocaleString()
                      : '불러오는 중...'}
                  </p>
                </div>
              </button>
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
              <button
                type="button"
                onClick={() => handleDelete(song)}
                disabled={deletingId === song.song_id}
                className="shrink-0 rounded-pill bg-fall/10 px-3 py-1.5 text-xs font-semibold text-fall disabled:opacity-40"
              >
                {deletingId === song.song_id ? '삭제 중...' : '삭제'}
              </button>
            </div>

            {isExpanded && (
              <div className="border-t border-white/5 p-3">
                {isHistoryLoading && !history[song.song_id] ? (
                  <p className="text-xs text-muted">불러오는 중...</p>
                ) : history[song.song_id]?.length ? (
                  <div className="flex flex-col gap-1">
                    {history[song.song_id].map((row) => (
                      <div
                        key={row.id}
                        className="flex justify-between text-xs text-muted"
                      >
                        <span>{row.recorded_date}</span>
                        <span className="text-white">
                          {Number(row.view_count).toLocaleString()}회
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted">
                    아직 기록된 조회수 히스토리가 없어요.
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
