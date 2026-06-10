import React, { createContext, useContext, useState, useEffect } from 'react'
import { getMe, saveTheme } from '../api'
import { useAuth } from './AuthContext'

const ThemeContext = createContext(null)

function applyTheme(theme) {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(theme)
  localStorage.setItem('wc_theme', theme)
}

export function ThemeProvider({ children }) {
  const { auth } = useAuth()
  const [theme, setThemeState] = useState(() => localStorage.getItem('wc_theme') || 'dark')

  // Reflect the current theme onto <html> and persist locally
  useEffect(() => { applyTheme(theme) }, [theme])

  // On login, pull the user's saved preference from the server
  useEffect(() => {
    if (!auth) return
    getMe()
      .then((me) => { if (me?.theme) setThemeState(me.theme) })
      .catch(() => {})
  }, [auth])

  function setTheme(next) {
    if (next === theme) return
    setThemeState(next)
    // Persist to the user collection when signed in (best-effort)
    if (auth) saveTheme(next).catch(() => {})
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
