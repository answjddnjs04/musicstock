import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { calculateTradeFee } from '../lib/fee'

export function TradingModal({ song, mode, onClose }) {
  const { balance, feeRate, portfolio, buySong, sellSong } = useApp()
  const [quantity, setQuantity] = useState(1)

  const holding = portfolio.find((p) => p.song_id === song.song_id)
  const maxQuantity = mode === 'sell' ? (holding?.quantity ?? 0) : null

  const amount = song.current_price * quantity
  const fee = calculateTradeFee(amount, feeRate)
  const total = mode === 'buy' ? amount + fee : amount - fee

  const isValid =
    quantity > 0 && (mode === 'buy' ? total <= balance : quantity <= maxQuantity)

  const adjustQuantity = (delta) => {
    setQuantity((q) => {
      const next = q + delta
      if (next < 1) return 1
      if (mode === 'sell' && next > maxQuantity) return maxQuantity
      return next
    })
  }

  const handleConfirm = () => {
    if (!isValid) return
    if (mode === 'buy') {
      buySong(song.song_id, quantity)
    } else {
      sellSong(song.song_id, quantity)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl bg-surface p-5 sm:rounded-card">
        <div className="mb-4 flex items-center gap-3">
          <img
            src={song.album_cover}
            alt={song.title}
            className="h-12 w-12 rounded-lg object-cover"
          />
          <div>
            <p className="text-sm font-semibold">{song.title}</p>
            <p className="text-xs text-muted">{song.artist}</p>
          </div>
        </div>

        <p className="mb-2 text-xs text-muted">
          {mode === 'buy' ? '보유 잔고' : '보유 수량'}:{' '}
          <span className="text-white">
            {mode === 'buy' ? `${balance.toLocaleString()}콩` : `${maxQuantity}주`}
          </span>
        </p>

        <div className="mb-4 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => adjustQuantity(-1)}
            className="h-8 w-8 rounded-pill bg-background text-lg"
          >
            −
          </button>
          <span className="w-12 text-center text-lg font-semibold">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => adjustQuantity(1)}
            className="h-8 w-8 rounded-pill bg-background text-lg"
          >
            +
          </button>
        </div>

        <div className="mb-4 space-y-1 rounded-card bg-background p-3 text-xs">
          <div className="flex justify-between text-muted">
            <span>거래 금액</span>
            <span>{amount.toLocaleString()}콩</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>수수료 ({feeRate}%)</span>
            <span>{fee.toLocaleString()}콩</span>
          </div>
          <div className="flex justify-between font-semibold text-white">
            <span>{mode === 'buy' ? '총 결제금액' : '최종 수령액'}</span>
            <span>{total.toLocaleString()}콩</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-pill bg-background py-2 text-sm font-semibold text-muted"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid}
            className={`flex-1 rounded-pill py-2 text-sm font-semibold disabled:opacity-40 ${
              mode === 'buy' ? 'bg-rise text-background' : 'bg-fall text-background'
            }`}
          >
            {mode === 'buy' ? '매수하기' : '매도하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
