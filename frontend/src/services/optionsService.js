import api from './api'

export async function calculateOptions(payload) {
  const { data } = await api.post('/options/calculate', payload)
  return data
}
