import { useState } from 'react'

const TABS = [
  { id: 'home', label: '홈' },
  { id: 'portfolio', label: '포트폴리오' },
]

export function AppShell({ tickerBar, screens }) {
  const [activeTab, setActiveTab] = useState('home')

  return (
    <div className="flex min-h-screen flex-col bg-background text-white">
      <div className="sticky top-0 z-10">{tickerBar}</div>

      <main className="mx-auto w-full max-w-[1600px] flex-1 overflow-y-auto pb-20">
        {screens[activeTab]}
      </main>

      <nav className="fixed inset-x-0 bottom-0 flex border-t border-white/5 bg-surface">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'text-rise' : 'text-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
