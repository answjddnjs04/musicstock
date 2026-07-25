// 홈 화면 랭킹 패널 하나(급상승/배당/시가총액 중 하나). 1등 곡은 큰 앨범아트로,
// 2~8등은 같은 회색 패널 안에서 한 줄짜리 리스트로 이어붙여서 "하나의 덩어리"처럼
// 보이게 만든다(이전엔 1등 카드와 리스트가 따로 떨어진 두 블록이었음).
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
    <div className="flex w-full flex-col overflow-hidden rounded-card bg-surface">
      <button
        type="button"
        onClick={() => onSelect?.(topSong)}
        className="flex flex-col items-center gap-1 p-4 text-center"
      >
        <span className="text-xs font-medium text-muted">{label}</span>

        <div>
          <p className="text-sm font-extrabold text-white sm:text-base">
            {mainValue}
          </p>
          <p className="text-xs font-semibold">{subValue}</p>
        </div>

        <img
          src={topSong.album_cover}
          alt={topSong.title}
          className="h-[190px] w-[190px] rounded-xl object-cover"
        />

        <div className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rise/10 text-[10px] font-bold text-rise">
            1
          </span>
          <p className="max-w-[180px] truncate text-sm font-semibold">
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
            className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/5"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="w-4 shrink-0 text-xs font-semibold text-muted">
                {index + 2}
              </span>
              <img
                src={song.album_cover}
                alt={song.title}
                className="h-8 w-8 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold sm:text-sm">
                  {song.title}
                </p>
                <p className="truncate text-[11px] text-muted">{song.artist}</p>
              </div>
            </div>
            <div className="shrink-0 text-right text-xs sm:text-sm">
              {renderStat(song)}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
