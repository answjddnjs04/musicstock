// 매수/매도/정산의 "다음 상태가 뭐가 되어야 하는가"를 계산하는 순수 함수 모음.
// React나 Supabase를 전혀 모르기 때문에 AppContext에서 재사용하기도, 테스트하기도 쉽다.
// 실패 조건(잔고 부족, 재고 부족, 보유 수량 초과 등)을 만나면 null을 반환해서
// 호출부가 "거래 불가"를 판단하게 한다. 재고 체크는 여기서 1차로(빠른 UX 피드백)
// 하지만, 여러 유저가 동시에 사는 경우의 최종 방어선은 Supabase의 buy_shares RPC다.
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
