import { useApp } from '../context/AppContext'
import { MusicCard } from '../components/MusicCard'
import { calculateSongDividend } from '../lib/dividend'

export function PortfolioScreen({ onTrade }) {
  const { songs, portfolio } = useApp()

  const holdings = portfolio
    .map((holding) => {
      const song = songs.find((s) => s.song_id === holding.song_id)
      if (!song) return null
      return {
        song,
        holding,
        expectedDividend: calculateSongDividend(song, holding.quantity),
      }
    })
    .filter(Boolean)

  if (holdings.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted">
        보유 중인 음원이 없어요. 홈에서 마음에 드는 곡을 매수해보세요.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {holdings.map(({ song, holding, expectedDividend }) => (
        <div key={song.song_id} className="flex flex-col gap-2 rounded-card bg-surface p-2">
          <MusicCard
            song={song}
            variant="list"
            onBuy={(s) => onTrade?.(s, 'buy')}
            onSell={(s) => onTrade?.(s, 'sell')}
          />
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="text-muted">
              보유 {holding.quantity}주 · 평단 {holding.avg_price.toLocaleString()}콩
            </span>
            <span className="font-medium text-rise">
              오늘 밤 예상: +{expectedDividend.toLocaleString()}콩
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
