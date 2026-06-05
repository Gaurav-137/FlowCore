import create from 'zustand'
import api from '../services/api'

const useCredentialStore = create((set, get) => ({
  credentials: [],
  credentialTypes: [],
  isLoading: false,

  fetchCredentials: async () => {
    set({ isLoading: true })
    try {
      const res = await api.get('/credentials')
      set({ credentials: res.data || [], isLoading: false })
    } catch (e) {
      set({ isLoading: false })
      console.error(e)
    }
  },

  fetchCredentialTypes: async () => {
    try {
      const res = await api.get('/credentials/types')
      set({ credentialTypes: res.data || [] })
    } catch (e) {
      console.error(e)
    }
  },

  createCredential: async (data) => {
    set({ isLoading: true })
    try {
      const res = await api.post('/credentials', data)
      set((state) => ({ credentials: [res.data, ...state.credentials], isLoading: false }))
      return res.data
    } catch (e) {
      set({ isLoading: false })
      console.error(e)
      throw e
    }
  },

  updateCredential: async (id, data) => {
    set({ isLoading: true })
    try {
      const res = await api.put(`/credentials/${id}`, data)
      set((state) => ({
        credentials: state.credentials.map(c => c.id === id ? { ...c, ...res.data } : c),
        isLoading: false
      }))
      return res.data
    } catch (e) {
      set({ isLoading: false })
      console.error(e)
      throw e
    }
  },

  deleteCredential: async (id) => {
    set({ isLoading: true })
    try {
      await api.delete(`/credentials/${id}`)
      set((state) => ({
        credentials: state.credentials.filter(c => c.id !== id),
        isLoading: false
      }))
    } catch (e) {
      set({ isLoading: false })
      console.error(e)
    }
  },

  testCredential: async (id) => {
    try {
      const res = await api.post(`/credentials/${id}/test`)
      return res.data
    } catch (e) {
      console.error(e)
      return { success: false, message: e.message }
    }
  }
}))

export default useCredentialStore
