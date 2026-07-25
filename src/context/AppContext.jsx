import { createContext, useContext, useReducer } from 'react'
import { mockSongs } from '../data/mockSongs'
import { mockUser } from '../data/mockUser'
import { calculateFeeRate, calculateInflationRate, calculateTradeFee } from '../lib/fee'
import { calculatePortfolioDividend, getTopDividendContributor } from '../lib/dividend'

const initialState = {
  songs: mockSongs,
  portfolio: mockUser.portfolio,
  balance: mockUser.balance,
  feeRate: mockUser.fee_rate,
  lastSettlement: mockUser.last_settlement,
}

function appReducer(state, action) {
  switch (action.type) {
    case 'BUY_SONG': {
      const { songId, quantity } = action.payload
      const song = state.songs.find((s) => s.song_id === songId)
      if (!song || quantity <= 0) return state

      const cost = song.current_price * quantity
      const fee = calculateTradeFee(cost, state.feeRate)
      const totalCost = cost + fee
      if (totalCost > state.balance) return state

      const existing = state.portfolio.find((p) => p.song_id === songId)
      let portfolio
      if (existing) {
        const newQuantity = existing.quantity + quantity
        const newAvgPrice = Math.round(
          (existing.avg_price * existing.quantity + cost) / newQuantity
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

      return { ...state, balance: state.balance - totalCost, portfolio }
    }

    case 'SELL_SONG': {
      const { songId, quantity } = action.payload
      const song = state.songs.find((s) => s.song_id === songId)
      const holding = state.portfolio.find((p) => p.song_id === songId)
      if (!song || !holding || quantity <= 0 || quantity > holding.quantity) {
        return state
      }

      const proceeds = song.current_price * quantity
      const fee = calculateTradeFee(proceeds, state.feeRate)
      const netProceeds = proceeds - fee
      const remaining = holding.quantity - quantity

      const portfolio =
        remaining === 0
          ? state.portfolio.filter((p) => p.song_id !== songId)
          : state.portfolio.map((p) =>
              p.song_id === songId ? { ...p, quantity: remaining } : p
            )

      return { ...state, balance: state.balance + netProceeds, portfolio }
    }

    case 'SETTLE_DAILY': {
      const totalDividend = calculatePortfolioDividend(state.songs, state.portfolio)
      const topSong = getTopDividendContributor(state.songs, state.portfolio)
      const inflationRate = calculateInflationRate(totalDividend)
      const nextFeeRate = calculateFeeRate(inflationRate)

      return {
        ...state,
        balance: state.balance + totalDividend,
        feeRate: nextFeeRate,
        lastSettlement: {
          total_dividend: totalDividend,
          top_song_id: topSong?.song_id ?? null,
          fee_rate_today: nextFeeRate,
        },
      }
    }

    default:
      return state
  }
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const buySong = (songId, quantity) =>
    dispatch({ type: 'BUY_SONG', payload: { songId, quantity } })
  const sellSong = (songId, quantity) =>
    dispatch({ type: 'SELL_SONG', payload: { songId, quantity } })
  const settleDaily = () => dispatch({ type: 'SETTLE_DAILY' })

  return (
    <AppContext.Provider
      value={{ ...state, buySong, sellSong, settleDaily }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
