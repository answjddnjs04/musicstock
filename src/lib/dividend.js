// 배당금 = 곡의 조회수 × 내 지분율 × 배당 계수. 지분율은 "가상의 총 발행량"
// TOTAL_SHARES_PER_SONG을 기준으로 계산하는 것으로, 실제 매수 가능한 재고 수량인
// songs.total_shares(기본 1주)와는 별개의 값이니 혼동하지 말 것.
export const TOTAL_SHARES_PER_SONG = 100_000
export const BASE_DIVIDEND_COEFFICIENT = 30

export function calculateOwnershipRatio(quantity) {
  return quantity / TOTAL_SHARES_PER_SONG
}

export function calculateSongDividend(song, quantity) {
  const ownershipRatio = calculateOwnershipRatio(quantity)
  return Math.round(
    song.daily_views_growth * ownershipRatio * BASE_DIVIDEND_COEFFICIENT
  )
}

export function calculatePortfolioDividend(songs, portfolio) {
  return portfolio.reduce((total, holding) => {
    const song = songs.find((s) => s.song_id === holding.song_id)
    if (!song) return total
    return total + calculateSongDividend(song, holding.quantity)
  }, 0)
}

export function getTopDividendContributor(songs, portfolio) {
  let best = null
  let bestAmount = -Infinity

  for (const holding of portfolio) {
    const song = songs.find((s) => s.song_id === holding.song_id)
    if (!song) continue
    const amount = calculateSongDividend(song, holding.quantity)
    if (amount > bestAmount) {
      bestAmount = amount
      best = song
    }
  }

  return best
}
