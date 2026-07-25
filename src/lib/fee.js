// 동적 거래 수수료 계산. 어제 시스템 전체에 풀린 배당금이 많을수록(=인플레이션)
// 오늘의 거래 수수료율이 올라간다. BASE~MAX 사이로 매일 조금씩만 움직이게 캡을 둔다.
export const BASE_FEE_RATE = 1
export const MAX_FEE_RATE = 5
export const FEE_INFLATION_SENSITIVITY = 10000
export const TOTAL_CIRCULATING_CURRENCY = 10_000_000

export function calculateInflationRate(
  totalDividendPaid,
  totalCirculatingCurrency = TOTAL_CIRCULATING_CURRENCY
) {
  if (totalCirculatingCurrency <= 0) return 0
  return totalDividendPaid / totalCirculatingCurrency
}

export function calculateFeeRate(inflationRate) {
  const raw = BASE_FEE_RATE + inflationRate * FEE_INFLATION_SENSITIVITY
  return Math.min(MAX_FEE_RATE, Math.max(BASE_FEE_RATE, Number(raw.toFixed(1))))
}

export function calculateTradeFee(amount, feeRatePercent) {
  return Math.round(amount * (feeRatePercent / 100))
}
