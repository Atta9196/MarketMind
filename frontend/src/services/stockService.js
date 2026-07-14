import api from './api'

export async function fetchStock(ticker, { period, interval } = {}) {
  const params = {}
  if (period) {
    params.period = period
  }
  if (interval) {
    params.interval = interval
  }

  const { data } = await api.get(`/stock/${encodeURIComponent(ticker)}`, { params })
  return data
}
