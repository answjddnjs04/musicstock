import { useState } from 'react'
import { useApp } from '../context/AppContext'

export function ReceiptModal() {
  const { songs, lastSettlement } = useApp()
  const [isOpen, setIsOpen] = useState(true)

  if (!isOpen) return null

  const topSong = songs.find((s) => s.song_id === lastSettlement.top_song_id)

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
            <span>어제의 효자 곡</span>
            <span className="font-semibold">{topSong ? topSong.title : '-'}</span>
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
      </div>
    </div>
  )
}
