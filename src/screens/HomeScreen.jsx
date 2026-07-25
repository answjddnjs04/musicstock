import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { MusicCard } from '../components/MusicCard'
import { getTopRising, getTopDividend, getTopVolume } from '../lib/rankings'

const CURATION_TABS = [
  { id: 'rising', label: '🔥 급등주', getSongs: getTopRising },
  { id: 'dividend', label: '💎 효자주', getSongs: getTopDividend },
  { id: 'volume', label: '👑 대장주', getSongs: getTopVolume },
]

export function HomeScreen({ onTrade }) {
  const { songs } = useApp()
  const [activeCuration, setActiveCuration] = useState(CURATION_TABS[0].id)

  const rankedSongs = useMemo(() => {
    const tab = CURATION_TABS.find((t) => t.id === activeCuration)
    return tab.getSongs(songs)
  }, [songs, activeCuration])

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex gap-2">
        {CURATION_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveCuration(tab.id)}
            className={`rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeCuration === tab.id
                ? 'bg-rise/10 text-rise'
                : 'bg-surface text-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {rankedSongs.map((song) => (
          <MusicCard
            key={song.song_id}
            song={song}
            variant="card"
            onBuy={(s) => onTrade?.(s, 'buy')}
            onSell={(s) => onTrade?.(s, 'sell')}
          />
        ))}
      </div>
    </div>
  )
}
