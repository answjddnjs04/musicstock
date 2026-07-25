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
