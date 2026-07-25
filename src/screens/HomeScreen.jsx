import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { HeroRankCard } from '../components/HeroRankCard'
import { RankingTable } from '../components/RankingTable'
import {
  calculateMarketCap,
  getTopDividend,
  getTopRising,
  getTopVolume,
} from '../lib/rankings'

const TOP_TABS = ['인기 음악', '보유 음악', '관심 음악', '거래 목록']

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
    <div className="flex gap-4 border-b border-white/5 text-sm">
      {TOP_TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`-mb-px border-b-2 pb-2 text-xs font-medium transition-colors sm:text-sm ${
            activeTab === tab
              ? 'border-white text-white'
              : 'border-transparent text-muted'
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
    if (!query.trim()) return songs
    const q = query.trim().toLowerCase()
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    )
  }, [songs, query])

  const topRising = getTopRising(songs, 1)[0]
  const topDividend = getTopDividend(songs, 1)[0]
  const topCap = getTopVolume(songs, 1)[0]

  const handleSelect = (song) => onTrade?.(song, 'buy')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 bg-gradient-to-b from-[#161b30] to-background px-4 pb-4 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">마켓</h1>
          <p className="text-sm font-bold">{balance.toLocaleString()}콩</p>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="음악명 또는 아티스트명을 입력하세요"
          className="w-full rounded-pill bg-surface px-4 py-2 text-sm text-white placeholder:text-muted focus:outline-none"
        />

        <TopTabs activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab !== '인기 음악' ? (
        <div className="mx-4 flex h-40 items-center justify-center rounded-card bg-surface text-sm text-muted">
          준비 중인 화면이에요.
        </div>
      ) : (
        <div className="flex flex-col gap-5 px-4 pb-4">
          <div className="grid grid-cols-3 gap-2">
            {topRising && (
              <HeroRankCard
                label="주가 급상승"
                mainValue={`${topRising.current_price.toLocaleString()}콩`}
                subValue={<ChangeText rate={topRising.price_change_rate} />}
                song={topRising}
                onSelect={handleSelect}
              />
            )}
            {topDividend && (
              <HeroRankCard
                label="배당 왕"
                mainValue={`${topDividend.dividend_yield_ratio}%`}
                subValue={<span className="text-rise">배당 수익률 1위</span>}
                song={topDividend}
                onSelect={handleSelect}
              />
            )}
            {topCap && (
              <HeroRankCard
                label="시가총액 1위"
                mainValue={`${calculateMarketCap(topCap).toLocaleString()}콩`}
                subValue={<span className="text-muted">실시간 기준</span>}
                song={topCap}
                onSelect={handleSelect}
              />
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <RankingTable
              title="주가 급상승 TOP 8"
              songs={getTopRising(filteredSongs, 8)}
              renderStat={(song) => <ChangeText rate={song.price_change_rate} />}
              onSelect={handleSelect}
            />
            <RankingTable
              title="배당 수익률 TOP 8"
              songs={getTopDividend(filteredSongs, 8)}
              renderStat={(song) => (
                <span className="text-[10px] font-semibold text-rise sm:text-xs">
                  {song.dividend_yield_ratio}%
                </span>
              )}
              onSelect={handleSelect}
            />
            <RankingTable
              title="시가총액 TOP 8"
              songs={getTopVolume(filteredSongs, 8)}
              renderStat={(song) => (
                <span className="text-[10px] font-semibold text-white sm:text-xs">
                  {calculateMarketCap(song).toLocaleString()}
                </span>
              )}
              onSelect={handleSelect}
            />
          </div>
        </div>
      )}
    </div>
  )
}
