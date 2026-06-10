import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children, onLogout }) {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('wc_token')
    const username = localStorage.getItem('wc_username')
    return token && username ? { token, username } : null
  })

  function login(token, username) {
    localStorage.setItem('wc_token', token)
    localStorage.setItem('wc_username', username)
    setAuth({ token, username })
  }

  function logout() {
    localStorage.removeItem('wc_token')
    localStorage.removeItem('wc_username')
    setAuth(null)
    onLogout?.()
  }

  useEffect(() => {
    window.addEventListener('wc:logout', logout)
    return () => window.removeEventListener('wc:logout', logout)
  }, [])

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
