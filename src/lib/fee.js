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
