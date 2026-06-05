import create from 'zustand'

const getInitialState = () => {
  try {
    const raw = localStorage.getItem('auth')
    if (raw) {
      const { tokens, user } = JSON.parse(raw)
      return {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    }
  } catch (e) {}
  return {
    user: null,
    accessToken: null,
    refreshToken: null
  }
}

const initialState = getInitialState()

const useAuth = create((set) => ({
  ...initialState,
  setTokens: (tokens, user) => {
    set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user })
    try { localStorage.setItem('auth', JSON.stringify({ tokens, user })) } catch (e) {}
  },
  clear: () => {
    set({ user: null, accessToken: null, refreshToken: null })
    try { localStorage.removeItem('auth') } catch (e) {}
  },
  restore: () => {
    try {
      const raw = localStorage.getItem('auth')
      if (!raw) return
      const { tokens, user } = JSON.parse(raw)
      set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user })
    } catch (e) {}
  }
}))

export default useAuth
