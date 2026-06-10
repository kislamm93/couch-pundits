import React from 'react'
import { useTheme } from '../context/ThemeContext'

function SunIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

const OPTIONS = [
  { id: 'light', label: 'Light', Icon: SunIcon },
  { id: 'dark', label: 'Dark', Icon: MoonIcon },
]

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-card p-0.5">
      {OPTIONS.map(({ id, label, Icon }) => {
        const active = theme === id
        return (
          <button
            key={id}
            onClick={() => setTheme(id)}
            aria-pressed={active}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${active ? 'bg-accent text-bg' : 'text-muted'}`}
          >
            <Icon />
          </button>
        )
      })}
    </div>
  )
}
