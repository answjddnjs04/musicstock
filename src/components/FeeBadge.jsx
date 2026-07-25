// 오늘의 동적 수수료율을 보여주는 작은 배지. 홈 헤더의 "마켓" 타이틀과 잔고
// 사이에 인라인으로 들어간다(과거에는 화면 우하단에 떠 있는 고정 뱃지였음).
import { useApp } from '../context/AppContext'

export function FeeBadge() {
  const { feeRate } = useApp()

  return (
    <span className="rounded-pill bg-surface px-2.5 py-1.5 text-xs font-medium text-muted">
      오늘 수수료 <span className="font-semibold text-white">{feeRate}%</span>
    </span>
  )
}
