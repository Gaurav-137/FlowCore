import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import useAuth from '../store/authStore'

export default function useSocket() {
  const socketRef = useRef(null)
  const token = useAuth((s) => s.accessToken)

  useEffect(() => {
    if (!token) return
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:4000', { auth: { token } })
    socketRef.current = socket
    return () => socket.disconnect()
  }, [token])

  return socketRef
}
