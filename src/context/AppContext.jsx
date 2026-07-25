// 앱 전역 상태(로그인 세션, 보유 잔고/포트폴리오, 마켓에 등록된 songs 목록)를
// 관리하는 단일 Context. Supabase가 설정되어 있지 않으면(.env 없음) 로그인 없이
// 로컬 상태만으로 동작하고, 설정되어 있으면 로그인 사용자의 데이터를 DB와 동기화한다.
// 매수/매도/정산의 실제 숫자 계산은 여기서 하지 않고 lib/trading.js의 순수 함수에
// 위임한다 — 이 파일은 "그 결과를 상태에 반영하고 Supabase에 저장하는 것"만 담당.
import { createContext, useContext, useEffect, useReducer } from 'react'
import { mockUser } from '../data/mockUser'
import { applyBuySong, applySellSong, applySettleDaily } from '../lib/trading'
import { supabase } from '../lib/supabaseClient'

const isSupabaseEnabled = !!supabase
const ADMIN_EMAIL = 'infinitefoever@naver.com'

function songToRow(song) {
  // shares_sold is intentionally omitted: it's only ever mutated server-side
  // via the buy_shares/sell_shares RPCs, never overwritten by a client upsert.
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
    video_id: song.video_id ?? null,
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
    shares_sold: row.shares_sold,
    dividend_yield_ratio: row.dividend_yield_ratio,
    video_id: row.video_id,
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

  const buySong = async (songId, quantity) => {
    const result = applyBuySong(state, songId, quantity)
    if (!result) return { ok: false, error: '구매 조건을 확인해주세요.' }

    if (isSupabaseEnabled && state.session) {
      const { error: rpcError } = await supabase.rpc('buy_shares', {
        p_song_id: songId,
        p_quantity: quantity,
      })
      if (rpcError) return { ok: false, error: '재고가 부족해요.' }
    }

    dispatch({
      type: 'MERGE_STATE',
      payload: {
        ...result.nextState,
        songs: state.songs.map((s) =>
          s.song_id === songId
            ? { ...s, shares_sold: (s.shares_sold ?? 0) + quantity }
            : s
        ),
      },
    })

    if (isSupabaseEnabled && state.session) {
      persistTrade(state.session.user.id, { ...state, ...result.nextState }, result.trade)
    }

    return { ok: true }
  }

  const sellSong = async (songId, quantity) => {
    const result = applySellSong(state, songId, quantity)
    if (!result) return { ok: false, error: '판매 조건을 확인해주세요.' }

    if (isSupabaseEnabled && state.session) {
      const { error: rpcError } = await supabase.rpc('sell_shares', {
        p_song_id: songId,
        p_quantity: quantity,
      })
      if (rpcError) return { ok: false, error: '판매에 실패했어요.' }
    }

    dispatch({
      type: 'MERGE_STATE',
      payload: {
        ...result.nextState,
        songs: state.songs.map((s) =>
          s.song_id === songId
            ? { ...s, shares_sold: Math.max(0, (s.shares_sold ?? 0) - quantity) }
            : s
        ),
      },
    })

    if (isSupabaseEnabled && state.session) {
      persistTrade(state.session.user.id, { ...state, ...result.nextState }, result.trade)
    }

    return { ok: true }
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

  // 오늘 날짜로 조회수 스냅샷 1건을 남긴다(같은 날 다시 부르면 upsert로 덮어씀).
  const recordViewSnapshot = async (songId, viewCount) => {
    if (!isAdmin || !isSupabaseEnabled) return
    await supabase.from('song_view_history').upsert(
      {
        song_id: songId,
        view_count: viewCount,
        recorded_date: new Date().toISOString().slice(0, 10),
      },
      { onConflict: 'song_id,recorded_date' }
    )
  }

  // 곡 하나의 날짜별 조회수 기록을 오래된 순으로 가져온다.
  const fetchViewHistory = async (songId) => {
    if (!isSupabaseEnabled) return []
    const { data } = await supabase
      .from('song_view_history')
      .select('*')
      .eq('song_id', songId)
      .order('recorded_date', { ascending: true })
    return data ?? []
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
        recordViewSnapshot,
        fetchViewHistory,
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
