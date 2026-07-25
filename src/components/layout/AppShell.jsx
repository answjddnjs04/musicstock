// 앱의 최상위 뼈대: 전광판(sticky) + 화면 본문 + 하단 홈/포트폴리오 탭바.
// 화면 전환은 react-router 없이 이 컴포넌트의 useState로만 처리한다(화면이
// 2개뿐이라 라우팅 라이브러리가 필요 없음). max-w-[1600px]로 초광폭 모니터에서도
// 콘텐츠가 과하게 늘어나지 않게 막는다.
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
