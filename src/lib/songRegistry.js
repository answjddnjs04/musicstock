import { calculateSongDividend } from './dividend'

const DEFAULT_PRICE = 1000
const PRICE_PER_VIEW = 0.01

export function buildSongFromYoutubeTrack(track) {
  const currentPrice =
    track.view_count > 0
      ? Math.round(track.view_count * PRICE_PER_VIEW)
      : DEFAULT_PRICE

  const song = {
    song_id: track.song_id,
    title: track.title,
    artist: track.artist,
    album_cover: track.album_cover,
    current_price: currentPrice,
    daily_views_growth: track.view_count,
    price_change_rate: 0,
    trading_volume: 0,
    dividend_yield_ratio: 0,
  }

  const dividendPerShare = calculateSongDividend(song, 1)
  song.dividend_yield_ratio =
    currentPrice > 0
      ? Number(((dividendPerShare / currentPrice) * 100).toFixed(1))
      : 0

  return song
}
