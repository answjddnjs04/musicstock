// 앱 진입점. 인증 게이트(로딩 → 로그인 필요 → 프로필 로딩 → 실제 화면) 순서로
// 렌더링을 분기하고, 매매 모달은 어느 화면에서 매수/매도를 눌렀든 여기서 하나만
// 띄운다(홈/포트폴리오 둘 다 onTrade로 이 상태를 올려보냄).
import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { AppShell } from './components/layout/AppShell'
import { TickerBar } from './components/TickerBar'
import { ReceiptModal } from './components/ReceiptModal'
import { TradingModal } from './components/TradingModal'
import { HomeScreen } from './screens/HomeScreen'
import { PortfolioScreen } from './screens/PortfolioScreen'
import { AuthScreen } from './screens/AuthScreen'

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted">
      불러오는 중...
    </div>
  )
}

function AppContent() {
  const { songs, isSupabaseEnabled, session, isAuthLoading, isProfileLoading } =
    useApp()
  const [tradeRequest, setTradeRequest] = useState(null)

  if (isSupabaseEnabled && isAuthLoading) return <LoadingScreen />
  if (isSupabaseEnabled && !session) return <AuthScreen />
  if (isSupabaseEnabled && isProfileLoading) return <LoadingScreen />

  const handleTrade = (song, mode) => setTradeRequest({ song, mode })
  const closeTrade = () => setTradeRequest(null)

  return (
    <>
      <AppShell
        tickerBar={<TickerBar songs={songs} />}
        screens={{
          home: <HomeScreen onTrade={handleTrade} />,
          portfolio: <PortfolioScreen onTrade={handleTrade} />,
        }}
      />
      <ReceiptModal />
      {tradeRequest && (
        <TradingModal
          song={tradeRequest.song}
          mode={tradeRequest.mode}
          onClose={closeTrade}
        />
      )}
    </>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
