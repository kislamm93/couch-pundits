import React, { useState, useEffect } from 'react'
import { register, login, getFixtures } from '../api'
import { useAuth } from '../context/AuthContext'

export default function AuthScreen() {
  const { login: authLogin } = useAuth()
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [team, setTeam] = useState('')
  const [teams, setTeams] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Load the selectable team list (public endpoint) for the register dropdown
  useEffect(() => {
    getFixtures()
      .then((fixtures) => {
        const set = new Set()
        for (const f of fixtures) { set.add(f.home_team); set.add(f.away_team) }
        setTeams(Array.from(set).sort())
      })
      .catch(() => setError('Could not load teams — is the API running?'))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (mode === 'register' && !team) {
      setError('Please select your team')
      return
    }
    setLoading(true)
    try {
      const data = mode === 'login'
        ? await login(username.trim(), password)
        : await register(username.trim(), password, team)
      authLogin(data.access_token, username.trim().toLowerCase(), data.favorite_team || '')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-bg">
      {/* Logo / Title */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">🔮</div>
        <h1 className="text-3xl font-black tracking-tight">Pick Your Poison</h1>
        <p className="text-muted text-sm mt-1">Prediction League</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoCapitalize="none"
            autoCorrect="off"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-fg placeholder-muted outline-none focus:border-accent transition-colors"
            style={{ fontSize: '16px' }}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-fg placeholder-muted outline-none focus:border-accent transition-colors"
            style={{ fontSize: '16px' }}
          />
        </div>

        {mode === 'register' && (
          <div className="relative">
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              required
              style={{ fontSize: '16px' }}
              className={`w-full appearance-none bg-card border border-border rounded-xl px-4 py-3 pr-10 outline-none focus:border-accent transition-colors ${team ? 'text-fg' : 'text-muted'}`}
            >
              <option value="" disabled>Pick your team…</option>
              {teams.map((t) => (
                <option key={t} value={t} className="text-fg">{t}</option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-accent text-bg font-bold rounded-xl disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {loading ? '…' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>

        <p className="text-center text-sm text-muted">
          {mode === 'login' ? (
            <>New here?{' '}
              <button type="button" onClick={() => { setMode('register'); setError('') }} className="text-accent font-semibold">
                Create an account
              </button>
            </>
          ) : (
            <>Have an account?{' '}
              <button type="button" onClick={() => { setMode('login'); setError('') }} className="text-accent font-semibold">
                Log in
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  )
}
