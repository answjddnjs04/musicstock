import { createContext, useContext, useReducer } from 'react'
import { mockSongs } from '../data/mockSongs'
import { mockUser } from '../data/mockUser'

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
      const fee = Math.round(cost * (state.feeRate / 100))
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
      const fee = Math.round(proceeds * (state.feeRate / 100))
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
      // 9단계에서 src/lib/dividend.js 배당 계산 로직과 연결 예정
      return state
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
