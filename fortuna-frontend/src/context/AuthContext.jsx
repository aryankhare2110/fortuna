import { createContext, useContext, useState, useCallback } from "react"
import { authAPI } from "../api/axios"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")) } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem("token") || null)

  const saveSession = useCallback((token, user) => {
    localStorage.setItem("token", token)
    localStorage.setItem("user",  JSON.stringify(user))
    setToken(token)
    setUser(user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setToken(null)
    setUser(null)
  }, [])

  const playerLogin = useCallback(async (email, password) => {
    const res = await authAPI.playerLogin({ email, password })
    saveSession(res.data.token, { ...res.data.player, role: "player" })
    return res.data
  }, [saveSession])

  const playerRegister = useCallback(async (formData) => {
    const res = await authAPI.playerRegister(formData)
    saveSession(res.data.token, { ...res.data.player, role: "player" })
    return res.data
  }, [saveSession])

  const dealerLogin = useCallback(async (email, password) => {
    const res = await authAPI.dealerLogin({ email, password })
    saveSession(res.data.token, { ...res.data.dealer, role: "dealer" })
    return res.data
  }, [saveSession])

  const adminLogin = useCallback(async (email, password) => {
    const res = await authAPI.adminLogin({ email, password })
    saveSession(res.data.token, { ...res.data.admin, role: "admin" })
    return res.data
  }, [saveSession])

  return (
    <AuthContext.Provider value={{
      user, token,
      isAuthenticated: !!token,
      role: user?.role ?? null,
      playerLogin, playerRegister, dealerLogin, adminLogin, logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
