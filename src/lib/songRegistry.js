const DEFAULT_PRICE = 1000
const PRICE_PER_VIEW = 0.01
const DEFAULT_TOTAL_SHARES = 1

function randomInRange(min, max, decimals = 1) {
  const value = Math.random() * (max - min) + min
  return Number(value.toFixed(decimals))
}

export function buildSongFromYoutubeTrack(track) {
  const currentPrice =
    track.view_count > 0
      ? Math.round(track.view_count * PRICE_PER_VIEW)
      : DEFAULT_PRICE

  return {
    song_id: track.song_id,
    title: track.title,
    artist: track.artist,
    album_cover: track.album_cover,
    current_price: currentPrice,
    daily_views_growth: track.view_count,
    total_shares: DEFAULT_TOTAL_SHARES,
    shares_sold: 0,
    // 실제 주가 등락/배당 이력이 아직 없어서 초기값은 랜덤으로 채움
    price_change_rate: randomInRange(-15, 15),
    dividend_yield_ratio: randomInRange(1, 8),
  }
}
