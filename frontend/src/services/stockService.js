import api from './api'

export async function fetchStock(ticker) {
  const { data } = await api.get(`/stock/${encodeURIComponent(ticker)}`)
  return data
}
