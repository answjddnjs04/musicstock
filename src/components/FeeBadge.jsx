import { useApp } from '../context/AppContext'

export function FeeBadge() {
  const { feeRate } = useApp()

  return (
    <span className="rounded-pill bg-surface px-2.5 py-1.5 text-xs font-medium text-muted">
      오늘 수수료 <span className="font-semibold text-white">{feeRate}%</span>
    </span>
  )
}
