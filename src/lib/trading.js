import { calculateTradeFee, calculateFeeRate, calculateInflationRate } from './fee'
import { calculatePortfolioDividend, getTopDividendContributor } from './dividend'

export function getAvailableShares(song) {
  return (song.total_shares ?? 1) - (song.shares_sold ?? 0)
}

export function applyBuySong(state, songId, quantity) {
  const song = state.songs.find((s) => s.song_id === songId)
  if (!song || quantity <= 0) return null
  if (quantity > getAvailableShares(song)) return null

  const amount = song.current_price * quantity
  const fee = calculateTradeFee(amount, state.feeRate)
  const totalCost = amount + fee
  if (totalCost > state.balance) return null

  const existing = state.portfolio.find((p) => p.song_id === songId)
  let portfolio
  if (existing) {
    const newQuantity = existing.quantity + quantity
    const newAvgPrice = Math.round(
      (existing.avg_price * existing.quantity + amount) / newQuantity
    )
    portfolio = state.portfolio.map((p) =>
      p.song_id === songId
        ? { ...p, quantity: newQuantity, avg_price: newAvgPrice }
        : p
    )
  } else {
    portfolio = [
      ...state.portfolio,
      { song_id: songId, quantity, avg_price: song.current_price },
    ]
  }

  return {
    nextState: { balance: state.balance - totalCost, portfolio },
    trade: { songId, quantity, price: song.current_price, fee, type: 'buy' },
  }
}

export function applySellSong(state, songId, quantity) {
  const song = state.songs.find((s) => s.song_id === songId)
  const holding = state.portfolio.find((p) => p.song_id === songId)
  if (!song || !holding || quantity <= 0 || quantity > holding.quantity) {
    return null
  }

  const amount = song.current_price * quantity
  const fee = calculateTradeFee(amount, state.feeRate)
  const netProceeds = amount - fee
  const remaining = holding.quantity - quantity

  const portfolio =
    remaining === 0
      ? state.portfolio.filter((p) => p.song_id !== songId)
      : state.portfolio.map((p) =>
          p.song_id === songId ? { ...p, quantity: remaining } : p
        )

  return {
    nextState: { balance: state.balance + netProceeds, portfolio },
    trade: { songId, quantity, price: song.current_price, fee, type: 'sell' },
  }
}

export function applySettleDaily(state) {
  const totalDividend = calculatePortfolioDividend(state.songs, state.portfolio)
  const topSong = getTopDividendContributor(state.songs, state.portfolio)
  const inflationRate = calculateInflationRate(totalDividend)
  const nextFeeRate = calculateFeeRate(inflationRate)

  return {
    balance: state.balance + totalDividend,
    feeRate: nextFeeRate,
    lastSettlement: {
      total_dividend: totalDividend,
      top_song_id: topSong?.song_id ?? null,
      fee_rate_today: nextFeeRate,
    },
  }
}
