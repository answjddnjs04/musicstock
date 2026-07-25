export function HeroRankCard({ label, mainValue, subValue, song, rank = 1, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(song)}
      className="flex shrink-0 flex-col items-center gap-1 rounded-card border border-white/5 bg-surface/80 p-2 text-center"
    >
      <span className="text-[10px] font-medium text-muted sm:text-[11px]">
        {label}
      </span>

      <div>
        <p className="text-xs font-extrabold text-white sm:text-sm">{mainValue}</p>
        <p className="text-[10px] font-semibold sm:text-[11px]">{subValue}</p>
      </div>

      <img
        src={song.album_cover}
        alt={song.title}
        className="h-[190px] w-[190px] rounded-xl object-cover"
      />

      <div className="flex items-center gap-1">
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rise/10 text-[9px] font-bold text-rise">
          {rank}
        </span>
        <p className="max-w-[72px] truncate text-[10px] font-semibold">
          {song.title}
        </p>
      </div>
    </button>
  )
}
