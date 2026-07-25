// Supabase 로그인 없이(.env 미설정) 앱을 켰을 때만 쓰이는 초기값.
// 로그인하면 이 값 대신 profiles/portfolio 테이블의 실제 데이터로 대체된다.
export const mockUser = {
  balance: 150000,
  fee_rate: 1.8,
  portfolio: [],
  last_settlement: {
    total_dividend: 0,
    top_song_id: null,
    fee_rate_today: 1.8,
  },
}
