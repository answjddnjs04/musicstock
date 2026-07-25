export function HeroRankCard({ label, mainValue, subValue, song, rank = 1, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(song)}
      className="flex flex-col gap-2 rounded-card border border-white/5 bg-surface/80 p-3 text-left"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted">{label}</span>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rise/10 text-[10px] font-bold text-rise">
          {rank}
        </span>
      </div>

      <div>
        <p className="text-sm font-extrabold text-white sm:text-base">{mainValue}</p>
        <p className="text-[11px] font-semibold">{subValue}</p>
      </div>

      <img
        src={song.album_cover}
        alt={song.title}
        className="h-16 w-16 self-center rounded-xl object-cover"
      />

      <div className="text-center">
        <p className="truncate text-xs font-semibold">{song.title}</p>
        <p className="truncate text-[10px] text-muted">{song.artist}</p>
      </div>
    </button>
  )
}
