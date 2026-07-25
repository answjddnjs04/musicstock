import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { AppShell } from './components/layout/AppShell'
import { TickerBar } from './components/TickerBar'
import { FeeBadge } from './components/FeeBadge'
import { ReceiptModal } from './components/ReceiptModal'
import { TradingModal } from './components/TradingModal'
import { HomeScreen } from './screens/HomeScreen'
import { PortfolioScreen } from './screens/PortfolioScreen'

function AppContent() {
  const { songs } = useApp()
  const [tradeRequest, setTradeRequest] = useState(null)

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
      <FeeBadge />
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
