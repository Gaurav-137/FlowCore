import create from 'zustand'
import api from '../services/api'

const useVariableStore = create((set, get) => ({
  variables: [],
  isLoading: false,

  fetchVariables: async () => {
    set({ isLoading: true })
    try {
      const res = await api.get('/variables')
      set({ variables: res.data || [], isLoading: false })
    } catch (e) {
      set({ isLoading: false })
      console.error(e)
    }
  },

  createVariable: async (data) => {
    set({ isLoading: true })
    try {
      const res = await api.post('/variables', data)
      set((state) => ({ variables: [...state.variables, res.data], isLoading: false }))
      return res.data
    } catch (e) {
      set({ isLoading: false })
      console.error(e)
      throw e
    }
  },

  updateVariable: async (id, data) => {
    set({ isLoading: true })
    try {
      const res = await api.put(`/variables/${id}`, data)
      set((state) => ({
        variables: state.variables.map(v => v.id === id ? res.data : v),
        isLoading: false
      }))
      return res.data
    } catch (e) {
      set({ isLoading: false })
      console.error(e)
      throw e
    }
  },

  deleteVariable: async (id) => {
    set({ isLoading: true })
    try {
      await api.delete(`/variables/${id}`)
      set((state) => ({
        variables: state.variables.filter(v => v.id !== id),
        isLoading: false
      }))
    } catch (e) {
      set({ isLoading: false })
      console.error(e)
    }
  }
}))

export default useVariableStore
