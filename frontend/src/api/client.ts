import axios from 'axios'
import toast from 'react-hot-toast'

const client = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30_000,
})

// Request interceptor
client.interceptors.request.use(
  (config) => {
    // Attach auth token if present
    const token = localStorage.getItem('hg_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message: string =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred'

    if (status === 401) {
      localStorage.removeItem('hg_token')
      toast.error('Session expired. Please reconnect.')
    } else if (status === 403) {
      toast.error('You do not have permission to perform this action.')
    } else if (status === 404) {
      // Let callers handle 404 silently if needed
    } else if (status >= 500) {
      toast.error(`Server error: ${message}`)
    }

    return Promise.reject(error)
  },
)

export default client
