import { createContext, useContext, useEffect, useReducer } from 'react'
import { mockUser } from '../data/mockUser'
import { applyBuySong, applySellSong, applySettleDaily } from '../lib/trading'
import { supabase } from '../lib/supabaseClient'

const isSupabaseEnabled = !!supabase
const ADMIN_EMAIL = 'infinitefoever@naver.com'

function songToRow(song) {
  return {
    song_id: song.song_id,
    title: song.title,
    artist: song.artist,
    album_cover: song.album_cover,
    current_price: song.current_price,
    daily_views_growth: song.daily_views_growth,
    price_change_rate: song.price_change_rate,
    total_shares: song.total_shares,
    dividend_yield_ratio: song.dividend_yield_ratio,
  }
}

function rowToSong(row) {
  return {
    song_id: row.song_id,
    title: row.title,
    artist: row.artist,
    album_cover: row.album_cover,
    current_price: row.current_price,
    daily_views_growth: row.daily_views_growth,
    price_change_rate: row.price_change_rate,
    total_shares: row.total_shares,
    dividend_yield_ratio: row.dividend_yield_ratio,
  }
}

const initialState = {
  songs: [],
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
    if (!isSupabaseEnabled) return

    supabase
      .from('songs')
      .select('*')
      .then(({ data }) => {
        if (!data || data.length === 0) return
        dispatch({
          type: 'MERGE_STATE',
          payload: {
            songs: [
              ...state.songs,
              ...data
                .filter((row) => !state.songs.some((s) => s.song_id === row.song_id))
                .map(rowToSong),
            ],
          },
        })
      })
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

  const isAdmin = state.session?.user?.email === ADMIN_EMAIL

  const registerSongs = async (newSongs) => {
    if (!isAdmin) return

    const unseen = newSongs.filter(
      (ns) => !state.songs.some((s) => s.song_id === ns.song_id)
    )
    if (unseen.length === 0) return

    dispatch({ type: 'MERGE_STATE', payload: { songs: [...state.songs, ...unseen] } })

    if (isSupabaseEnabled) {
      await supabase.from('songs').upsert(unseen.map(songToRow))
    }
  }

  const updateSong = async (songId, patch) => {
    if (!isAdmin) return

    dispatch({
      type: 'MERGE_STATE',
      payload: {
        songs: state.songs.map((s) =>
          s.song_id === songId ? { ...s, ...patch } : s
        ),
      },
    })

    if (isSupabaseEnabled) {
      await supabase.from('songs').update(patch).eq('song_id', songId)
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
        isAdmin,
        buySong,
        sellSong,
        settleDaily,
        registerSongs,
        updateSong,
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
