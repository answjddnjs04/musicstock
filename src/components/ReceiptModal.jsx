// 접속 시 자동으로 뜨는 "어제 정산 결과" 모달. "오늘 하루 보지 않기"를 누르면
// localStorage에 다음 자정 타임스탬프를 저장해두고, 그 전까지는 mount 시점에
// isHiddenForToday()가 true를 반환해서 애초에 열리지 않는다(서버 상태 아님,
// 기기/브라우저별로 따로 기억됨).
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { calculateSongDividend } from '../lib/dividend'

const HIDE_UNTIL_KEY = 'hideReceiptUntil'

function isHiddenForToday() {
  const hideUntil = Number(localStorage.getItem(HIDE_UNTIL_KEY) ?? 0)
  return Date.now() < hideUntil
}

export function ReceiptModal() {
  const { songs, portfolio, lastSettlement } = useApp()
  const [isOpen, setIsOpen] = useState(() => !isHiddenForToday())

  if (!isOpen) return null

  const handleHideToday = () => {
    const now = new Date()
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    )
    localStorage.setItem(HIDE_UNTIL_KEY, String(nextMidnight.getTime()))
    setIsOpen(false)
  }

  const topSong = songs.find((s) => s.song_id === lastSettlement.top_song_id)
  const topHolding = portfolio.find((p) => p.song_id === lastSettlement.top_song_id)
  const topSongDividend =
    topSong && topHolding ? calculateSongDividend(topSong, topHolding.quantity) : null

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'MusicStock 영수증',
          text: `어제 배당금 ${lastSettlement.total_dividend.toLocaleString()}콩을 받았어요.`,
        })
        .catch(() => {})
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-xs rounded-card bg-white p-6 text-background shadow-xl">
        <p className="mb-1 text-center text-xs tracking-widest text-muted">
          MUSIC RECEIPT
        </p>
        <p className="mb-4 text-center text-lg font-bold">오늘의 정산</p>

        <div className="mb-4 space-y-2 border-y border-dashed border-black/20 py-4 text-sm">
          <div className="flex justify-between">
            <span>어제 총 배당금</span>
            <span className="font-semibold text-emerald-600">
              +{lastSettlement.total_dividend.toLocaleString()}콩
            </span>
          </div>
          <div className="flex justify-between">
            <span>최고 배당 수익 곡</span>
            <span className="font-semibold">
              {topSong ? topSong.title : '-'}
              {topSongDividend !== null && (
                <span className="ml-1 text-emerald-600">
                  (+{topSongDividend.toLocaleString()}콩)
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span>오늘 수수료율</span>
            <span className="font-semibold">{lastSettlement.fee_rate_today}%</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 rounded-pill bg-background py-2 text-xs font-semibold text-white"
          >
            영수증 자랑하기
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex-1 rounded-pill bg-surface py-2 text-xs font-semibold text-white"
          >
            확인
          </button>
        </div>

        <button
          type="button"
          onClick={handleHideToday}
          className="mt-2 w-full text-center text-[11px] text-muted underline"
        >
          오늘 하루 보지 않기
        </button>
      </div>
    </div>
  )
}
