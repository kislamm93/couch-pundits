import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children, onLogout }) {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('wc_token')
    const username = localStorage.getItem('wc_username')
    const favoriteTeam = localStorage.getItem('wc_team') || ''
    return token && username ? { token, username, favoriteTeam } : null
  })

  function login(token, username, favoriteTeam = '') {
    localStorage.setItem('wc_token', token)
    localStorage.setItem('wc_username', username)
    localStorage.setItem('wc_team', favoriteTeam)
    setAuth({ token, username, favoriteTeam })
  }

  function setFavoriteTeam(favoriteTeam) {
    localStorage.setItem('wc_team', favoriteTeam)
    setAuth((a) => (a ? { ...a, favoriteTeam } : a))
  }

  function logout() {
    localStorage.removeItem('wc_token')
    localStorage.removeItem('wc_username')
    localStorage.removeItem('wc_team')
    setAuth(null)
    onLogout?.()
  }

  useEffect(() => {
    window.addEventListener('wc:logout', logout)
    return () => window.removeEventListener('wc:logout', logout)
  }, [])

  return (
    <AuthContext.Provider value={{ auth, login, logout, setFavoriteTeam }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
