export function RankingTable({ title, songs, renderStat, onSelect }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-card bg-surface">
      <div className="border-b border-white/5 px-2 py-2 text-[10px] font-semibold text-muted sm:text-[11px]">
        {title}
      </div>
      <div className="divide-y divide-white/5">
        {songs.map((song, index) => (
          <button
            key={song.song_id}
            type="button"
            onClick={() => onSelect?.(song)}
            className="flex w-full items-center gap-1.5 px-2 py-2 text-left transition-colors hover:bg-white/5"
          >
            <span className="w-3 shrink-0 text-[10px] font-semibold text-muted">
              {index + 1}
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
