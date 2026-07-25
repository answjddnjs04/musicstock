export function calculateMarketCap(song) {
  return song.current_price * song.trading_volume
}

export function getTopRising(songs, count = 3) {
  return [...songs]
    .sort((a, b) => b.price_change_rate - a.price_change_rate)
    .slice(0, count)
}

export function getTopDividend(songs, count = 3) {
  return [...songs]
    .sort((a, b) => b.dividend_yield_ratio - a.dividend_yield_ratio)
    .slice(0, count)
}

export function getTopVolume(songs, count = 3) {
  return [...songs]
    .sort((a, b) => calculateMarketCap(b) - calculateMarketCap(a))
    .slice(0, count)
}
