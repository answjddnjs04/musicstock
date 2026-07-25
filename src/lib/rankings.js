// 홈 화면 3대 랭킹(급상승/배당/시가총액)에 쓰이는 정렬 함수 모음.
export function calculateMarketCap(song) {
  return song.current_price * (song.total_shares ?? 1)
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
