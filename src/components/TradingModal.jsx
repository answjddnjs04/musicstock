// 매수/매도 확인 모달. initialSong은 목록에서 클릭한 시점의 스냅샷이라 song_id로
// 최신 songs 배열에서 다시 찾아 쓴다(재고/가격이 그 사이 바뀌었을 수 있어서).
// 실제 확정은 buySong/sellSong이 Supabase RPC 결과를 기다린 뒤에 이뤄지므로,
// 재고가 이미 소진됐다면 여기서 서버가 되돌려준 에러 메시지를 그대로 보여준다.
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { calculateTradeFee } from '../lib/fee'
import { getAvailableShares } from '../lib/trading'

export function TradingModal({ song: initialSong, mode, onClose }) {
  const { songs, balance, feeRate, portfolio, buySong, sellSong } = useApp()
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const song = songs.find((s) => s.song_id === initialSong.song_id) ?? initialSong

  const holding = portfolio.find((p) => p.song_id === song.song_id)
  const availableShares = getAvailableShares(song)
  const maxQuantity = mode === 'sell' ? (holding?.quantity ?? 0) : availableShares

  const amount = song.current_price * quantity
  const fee = calculateTradeFee(amount, feeRate)
  const total = mode === 'buy' ? amount + fee : amount - fee

  const isSoldOut = mode === 'buy' && availableShares <= 0
  const isValid =
    quantity > 0 &&
    !isSoldOut &&
    quantity <= maxQuantity &&
    (mode === 'buy' ? total <= balance : true)

  const adjustQuantity = (delta) => {
    setQuantity((q) => {
      const next = q + delta
      if (next < 1) return 1
      if (next > maxQuantity) return maxQuantity
      return next
    })
  }

  const handleConfirm = async () => {
    if (!isValid || isSubmitting) return
    setIsSubmitting(true)
    setError('')

    const action = mode === 'buy' ? buySong : sellSong
    const result = await action(song.song_id, quantity)

    setIsSubmitting(false)
    if (!result?.ok) {
      setError(result?.error ?? '거래에 실패했어요.')
      return
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

        <div className="mb-2 flex items-center justify-between text-xs text-muted">
          <span>
            {mode === 'buy' ? '보유 잔고' : '보유 수량'}:{' '}
            <span className="text-white">
              {mode === 'buy'
                ? `${balance.toLocaleString()}콩`
                : `${maxQuantity}주`}
            </span>
          </span>
          {mode === 'buy' && (
            <span>
              구매 가능:{' '}
              <span className={isSoldOut ? 'text-fall' : 'text-white'}>
                {isSoldOut ? '품절' : `${availableShares}주`}
              </span>
            </span>
          )}
        </div>

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

        {error && <p className="mb-2 text-xs text-fall">{error}</p>}

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
            disabled={!isValid || isSubmitting}
            className={`flex-1 rounded-pill py-2 text-sm font-semibold disabled:opacity-40 ${
              mode === 'buy' ? 'bg-rise text-background' : 'bg-fall text-background'
            }`}
          >
            {isSubmitting
              ? '처리 중...'
              : mode === 'buy'
                ? '매수하기'
                : '매도하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
