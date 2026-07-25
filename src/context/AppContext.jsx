import { createContext, useContext, useEffect, useReducer } from 'react'
import { mockSongs } from '../data/mockSongs'
import { mockUser } from '../data/mockUser'
import { applyBuySong, applySellSong, applySettleDaily } from '../lib/trading'
import { supabase } from '../lib/supabaseClient'
import { fetchYoutubeSongs } from '../lib/youtube'

const isSupabaseEnabled = !!supabase

const initialState = {
  songs: mockSongs,
  portfolio: mockUser.portfolio,
  balance: mockUser.balance,
  feeRate: mockUser.fee_rate,
  lastSettlement: mockUser.last_settlement,
  session: null,
  isAuthLoading: isSupabaseEnabled,
  isProfileLoading: false,
}

function appReducer(state, action) {
  if (action.type === 'MERGE_STATE') {
    return { ...state, ...action.payload }
  }
  return state
}

async function persistTrade(userId, nextState, trade) {
  const holding = nextState.portfolio.find((p) => p.song_id === trade.songId)

  await Promise.all([
    supabase.from('profiles').update({ balance: nextState.balance }).eq('id', userId),
    holding
      ? supabase
          .from('portfolio')
          .upsert(
            {
              user_id: userId,
              song_id: trade.songId,
              quantity: holding.quantity,
              avg_price: holding.avg_price,
            },
            { onConflict: 'user_id,song_id' }
          )
      : supabase
          .from('portfolio')
          .delete()
          .eq('user_id', userId)
          .eq('song_id', trade.songId),
    supabase.from('transactions').insert({
      user_id: userId,
      song_id: trade.songId,
      type: trade.type,
      quantity: trade.quantity,
      price: trade.price,
      fee: trade.fee,
    }),
  ])
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  useEffect(() => {
    if (!isSupabaseEnabled) return

    supabase.auth.getSession().then(({ data }) => {
      dispatch({
        type: 'MERGE_STATE',
        payload: { session: data.session, isAuthLoading: false },
      })
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch({ type: 'MERGE_STATE', payload: { session, isAuthLoading: false } })
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    fetchYoutubeSongs()
      .then((results) => {
        dispatch({
          type: 'MERGE_STATE',
          payload: {
            songs: state.songs.map((song) => {
              const match = results.find(
                (r) => r.song_id === song.song_id && r.found
              )
              return match
                ? {
                    ...song,
                    title: match.title,
                    artist: match.artist,
                    album_cover: match.album_cover ?? song.album_cover,
                    daily_views_growth: match.view_count ?? song.daily_views_growth,
                  }
                : song
            }),
          },
        })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!isSupabaseEnabled || !state.session) return

    const userId = state.session.user.id
    dispatch({ type: 'MERGE_STATE', payload: { isProfileLoading: true } })

    async function loadProfile() {
      const [{ data: profile }, { data: holdings }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('portfolio').select('*').eq('user_id', userId),
      ])

      dispatch({
        type: 'MERGE_STATE',
        payload: {
          balance: profile?.balance ?? mockUser.balance,
          feeRate: profile?.fee_rate ?? mockUser.fee_rate,
          lastSettlement: {
            total_dividend: profile?.last_settlement_total ?? 0,
            top_song_id: profile?.last_settlement_top_song_id ?? null,
            fee_rate_today: profile?.last_settlement_fee_rate ?? mockUser.fee_rate,
          },
          portfolio: (holdings ?? []).map((h) => ({
            song_id: h.song_id,
            quantity: h.quantity,
            avg_price: h.avg_price,
          })),
          isProfileLoading: false,
        },
      })
    }

    loadProfile()
  }, [state.session])

  const buySong = (songId, quantity) => {
    const result = applyBuySong(state, songId, quantity)
    if (!result) return
    dispatch({ type: 'MERGE_STATE', payload: result.nextState })
    if (isSupabaseEnabled && state.session) {
      persistTrade(state.session.user.id, { ...state, ...result.nextState }, result.trade)
    }
  }

  const sellSong = (songId, quantity) => {
    const result = applySellSong(state, songId, quantity)
    if (!result) return
    dispatch({ type: 'MERGE_STATE', payload: result.nextState })
    if (isSupabaseEnabled && state.session) {
      persistTrade(state.session.user.id, { ...state, ...result.nextState }, result.trade)
    }
  }

  const settleDaily = () => {
    const nextState = applySettleDaily(state)
    dispatch({ type: 'MERGE_STATE', payload: nextState })
    if (isSupabaseEnabled && state.session) {
      supabase
        .from('profiles')
        .update({
          balance: nextState.balance,
          fee_rate: nextState.feeRate,
          last_settlement_total: nextState.lastSettlement.total_dividend,
          last_settlement_top_song_id: nextState.lastSettlement.top_song_id,
          last_settlement_fee_rate: nextState.lastSettlement.fee_rate_today,
        })
        .eq('id', state.session.user.id)
    }
  }

  const signUp = (email, password) => supabase.auth.signUp({ email, password })
  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })
  const signOut = () => supabase.auth.signOut()

  return (
    <AppContext.Provider
      value={{
        ...state,
        isSupabaseEnabled,
        buySong,
        sellSong,
        settleDaily,
        signUp,
        signIn,
        signOut,
      }}
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
