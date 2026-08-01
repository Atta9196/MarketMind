import axios from 'axios'

function resolveApiBaseUrl() {
  const configured = import.meta.env.VITE_API_URL || '/api'
  if (configured === '/api') {
    return configured
  }

  const trimmed = configured.replace(/\/+$/, '')
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS) || 120_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      return Promise.reject(
        new Error('The request timed out. Please check your connection and try again.'),
      )
    }

    if (!error.response) {
      return Promise.reject(
        new Error('Unable to reach the MarketMinds API. Please check your connection and try again.'),
      )
    }

    const detail = error.response?.data?.detail
    let message = error.message || 'An unexpected error occurred'

    if (typeof detail === 'string') {
      message = detail
    } else if (Array.isArray(detail)) {
      message = detail.map((item) => item.msg).join('. ')
    } else if (error.response.status === 404) {
      message = 'The requested ticker or resource was not found.'
    } else if (error.response.status >= 500) {
      message = 'Market data is temporarily unavailable. Please try again shortly.'
    }

    return Promise.reject(new Error(message))
  },
)

export default api
