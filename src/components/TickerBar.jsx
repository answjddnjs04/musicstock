export function TickerBar({ songs }) {
  const items = [...songs, ...songs]

  return (
    <div className="overflow-hidden border-b border-white/5 bg-surface py-2">
      <div className="flex w-max animate-ticker gap-6 whitespace-nowrap px-4">
        {items.map((song, i) => {
          const isRise = song.price_change_rate >= 0
          return (
            <span key={`${song.song_id}-${i}`} className="text-xs font-medium">
              <span className="text-muted">${song.title}</span>{' '}
              <span className={isRise ? 'text-rise' : 'text-fall'}>
                {isRise ? '▲' : '▼'}
                {Math.abs(song.price_change_rate)}%
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
