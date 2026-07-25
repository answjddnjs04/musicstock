export function RankColumn({
  label,
  mainValue,
  subValue,
  topSong,
  restSongs,
  renderStat,
  onSelect,
}) {
  return (
    <div className="flex w-[220px] shrink-0 flex-col overflow-hidden rounded-card bg-surface">
      <button
        type="button"
        onClick={() => onSelect?.(topSong)}
        className="flex flex-col items-center gap-1 p-3 text-center"
      >
        <span className="text-[10px] font-medium text-muted sm:text-[11px]">
          {label}
        </span>

        <div>
          <p className="text-xs font-extrabold text-white sm:text-sm">
            {mainValue}
          </p>
          <p className="text-[10px] font-semibold sm:text-[11px]">{subValue}</p>
        </div>

        <img
          src={topSong.album_cover}
          alt={topSong.title}
          className="h-[190px] w-[190px] rounded-xl object-cover"
        />

        <div className="flex items-center gap-1">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rise/10 text-[9px] font-bold text-rise">
            1
          </span>
          <p className="max-w-[150px] truncate text-[11px] font-semibold">
            {topSong.title}
          </p>
        </div>
      </button>

      <div className="divide-y divide-white/5 border-t border-white/5">
        {restSongs.map((song, index) => (
          <button
            key={song.song_id}
            type="button"
            onClick={() => onSelect?.(song)}
            className="flex w-full items-center gap-1.5 px-2 py-2 text-left transition-colors hover:bg-white/5"
          >
            <span className="w-3 shrink-0 text-[10px] font-semibold text-muted">
              {index + 2}
            </span>
            <img
              src={song.album_cover}
              alt={song.title}
              className="h-6 w-6 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-semibold sm:text-[11px]">
                {song.title}
              </p>
              <p className="truncate text-[9px] text-muted">{song.artist}</p>
            </div>
            <div className="shrink-0 text-right">{renderStat(song)}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
