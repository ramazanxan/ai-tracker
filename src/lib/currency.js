const CACHE_KEY = 'usd_kgs_rate'
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export async function fetchUsdKgsRate() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.rate
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    const data = await res.json()
    const rate = data?.rates?.KGS || 87.5
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, ts: Date.now() }))
    return rate
  } catch {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    return cached?.rate || 87.5
  }
}

export function usdToKgs(usd, rate) {
  return Math.round(usd * rate)
}

export function fmtKgs(amount) {
  return amount.toLocaleString('ru-RU') + ' с'
}

export function fmtUsd(amount) {
  return '$' + amount.toFixed(2)
}
