// 곡 하나를 보여주는 공용 카드. variant="card"(그리드용, 세로형)와
// "list"(가로 한 줄형) 두 레이아웃을 지원해서 홈 랭킹/검색 결과/포트폴리오에서
// 재사용한다. 재고가 없는 곡은 매수 버튼이 "품절"로 바뀌고 비활성화된다.
import { getAvailableShares } from '../lib/trading'

function ChangeBadge({ rate, className = '' }) {
  const isRise = rate >= 0
  return (
    <p
      className={`text-xs font-medium ${isRise ? 'text-rise' : 'text-fall'} ${className}`}
    >
      {isRise ? '▲' : '▼'} {Math.abs(rate)}%
    </p>
  )
}

export function MusicCard({ song, variant = 'card', onBuy, onSell }) {
  const isSoldOut = getAvailableShares(song) <= 0

  if (variant === 'list') {
    return (
      <div className="flex items-center gap-3 rounded-card bg-surface p-3">
        <img
          src={song.album_cover}
          alt={song.title}
          className="h-12 w-12 rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{song.title}</p>
          <p className="truncate text-xs text-muted">{song.artist}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">
            {song.current_price.toLocaleString()}콩
          </p>
          <ChangeBadge rate={song.price_change_rate} />
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onBuy?.(song)}
            disabled={isSoldOut}
            className="rounded-pill bg-rise/10 px-3 py-1 text-xs font-semibold text-rise disabled:opacity-40"
          >
            {isSoldOut ? '품절' : '매수'}
          </button>
          <button
            type="button"
            onClick={() => onSell?.(song)}
            className="rounded-pill bg-fall/10 px-3 py-1 text-xs font-semibold text-fall"
          >
            매도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-card bg-surface p-3">
      <img
        src={song.album_cover}
        alt={song.title}
        className="h-16 w-16 rounded-lg object-cover"
      />
      <div>
        <p className="truncate text-sm font-semibold">{song.title}</p>
        <p className="truncate text-xs text-muted">{song.artist}</p>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">
          {song.current_price.toLocaleString()}콩
        </p>
        <ChangeBadge rate={song.price_change_rate} />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onBuy?.(song)}
          disabled={isSoldOut}
          className="flex-1 rounded-pill bg-rise/10 py-1.5 text-xs font-semibold text-rise disabled:opacity-40"
        >
          {isSoldOut ? '품절' : '매수'}
        </button>
        <button
          type="button"
          onClick={() => onSell?.(song)}
          className="flex-1 rounded-pill bg-fall/10 py-1.5 text-xs font-semibold text-fall"
        >
          매도
        </button>
      </div>
    </div>
  )
}
