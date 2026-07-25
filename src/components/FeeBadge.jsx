import { useApp } from '../context/AppContext'

export function FeeBadge() {
  const { feeRate } = useApp()

  return (
    <div className="fixed bottom-24 right-4 z-20 rounded-pill bg-surface px-3 py-1.5 text-[11px] font-medium text-muted shadow-lg">
      오늘의 거래 수수료율: <span className="text-white">{feeRate}%</span> (인플레이션
      반영됨)
    </div>
  )
}
