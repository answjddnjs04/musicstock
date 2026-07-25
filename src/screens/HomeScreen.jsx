import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { RankColumn } from '../components/RankColumn'
import { MusicCard } from '../components/MusicCard'
import { FeeBadge } from '../components/FeeBadge'
import {
  calculateMarketCap,
  getTopDividend,
  getTopRising,
  getTopVolume,
} from '../lib/rankings'

const TOP_TABS = ['인기 음악', '보유 음악', '관심 음악', '거래 목록', '검색 음악']

function ChangeText({ rate }) {
  const isRise = rate >= 0
  return (
    <span className={isRise ? 'text-rise' : 'text-fall'}>
      {isRise ? '▲' : '▼'} {Math.abs(rate)}%
    </span>
  )
}

function TopTabs({ activeTab, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TOP_TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`flex h-[30px] min-w-[120px] items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
            activeTab === tab ? 'bg-rise/10 text-rise' : 'bg-surface text-muted'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

export function HomeScreen({ onTrade }) {
  const { songs, balance } = useApp()
  const [activeTab, setActiveTab] = useState(TOP_TABS[0])
  const [query, setQuery] = useState('')

  const filteredSongs = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    )
  }, [songs, query])

  const topRising = getTopRising(songs, 1)[0]
  const topDividend = getTopDividend(songs, 1)[0]
  const topCap = getTopVolume(songs, 1)[0]

  const handleSelect = (song) => onTrade?.(song, 'buy')

  const handleQueryChange = (e) => {
    const value = e.target.value
    setQuery(value)
    if (value.trim() !== '') {
      setActiveTab('검색 음악')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 bg-gradient-to-b from-[#161b30] to-background px-4 pb-4 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">마켓</h1>
          <div className="flex items-center gap-2">
            <FeeBadge />
            <p className="text-base font-bold">{balance.toLocaleString()}콩</p>
          </div>
        </div>

        <input
          value={query}
          onChange={handleQueryChange}
          placeholder="음악명 또는 아티스트명을 입력하세요"
          className="w-full rounded-pill bg-surface px-4 py-2 text-sm text-white placeholder:text-muted focus:outline-none"
        />

        <TopTabs activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === '검색 음악' ? (
        <div className="flex flex-col gap-2 px-4 pb-4">
          {query.trim() === '' ? (
            <div className="flex h-40 items-center justify-center rounded-card bg-surface text-sm text-muted">
              검색어를 입력해주세요.
            </div>
          ) : filteredSongs.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-card bg-surface text-sm text-muted">
              검색 결과가 없어요.
            </div>
          ) : (
            filteredSongs.map((song) => (
              <MusicCard
                key={song.song_id}
                song={song}
                variant="list"
                onBuy={(s) => onTrade?.(s, 'buy')}
                onSell={(s) => onTrade?.(s, 'sell')}
              />
            ))
          )}
        </div>
      ) : activeTab !== '인기 음악' ? (
        <div className="mx-4 flex h-40 items-center justify-center rounded-card bg-surface text-sm text-muted">
          준비 중인 화면이에요.
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto px-4 pb-4">
          {topRising && (
            <RankColumn
              label="주가 급상승"
              mainValue={`${topRising.current_price.toLocaleString()}콩`}
              subValue={<ChangeText rate={topRising.price_change_rate} />}
              topSong={topRising}
              restSongs={getTopRising(songs, 8).slice(1)}
              renderStat={(song) => <ChangeText rate={song.price_change_rate} />}
              onSelect={handleSelect}
            />
          )}
          {topDividend && (
            <RankColumn
              label="배당 수익률"
              mainValue={`${topDividend.dividend_yield_ratio}%`}
              subValue={<span className="text-rise">배당 수익률 1위</span>}
              topSong={topDividend}
              restSongs={getTopDividend(songs, 8).slice(1)}
              renderStat={(song) => (
                <span className="text-[10px] font-semibold text-rise sm:text-xs">
                  {song.dividend_yield_ratio}%
                </span>
              )}
              onSelect={handleSelect}
            />
          )}
          {topCap && (
            <RankColumn
              label="시가총액 1위"
              mainValue={`${calculateMarketCap(topCap).toLocaleString()}콩`}
              subValue={<span className="text-muted">실시간 기준</span>}
              topSong={topCap}
              restSongs={getTopVolume(songs, 8).slice(1)}
              renderStat={(song) => (
                <span className="text-[10px] font-semibold text-white sm:text-xs">
                  {calculateMarketCap(song).toLocaleString()}
                </span>
              )}
              onSelect={handleSelect}
            />
          )}
        </div>
      )}
    </div>
  )
}
