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
            className="rounded-pill bg-rise/10 px-3 py-1 text-xs font-semibold text-rise"
          >
            매수
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
          className="flex-1 rounded-pill bg-rise/10 py-1.5 text-xs font-semibold text-rise"
        >
          매수
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
