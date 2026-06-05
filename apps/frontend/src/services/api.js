import axios from 'axios'
import authStore from '../store/authStore'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000' })

// Attach token
api.interceptors.request.use((cfg) => {
  const token = authStore.getState().accessToken
  if (token) {
    cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${token}` }
  }
  return cfg
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// 401 error handler for refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = authStore.getState().refreshToken
      if (!refreshToken) {
        authStore.getState().clear()
        return Promise.reject(error)
      }

      try {
        const res = await axios.post(
          (import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/auth/refresh',
          { refreshToken }
        )
        const newTokens = res.data
        const user = authStore.getState().user
        
        authStore.getState().setTokens(newTokens, user)
        processQueue(null, newTokens.accessToken)
        
        originalRequest.headers['Authorization'] = 'Bearer ' + newTokens.accessToken
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        authStore.getState().clear()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
