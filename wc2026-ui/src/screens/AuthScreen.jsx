import React, { useState } from 'react'
import { register, login } from '../api'
import { useAuth } from '../context/AuthContext'

export default function AuthScreen() {
  const { login: authLogin } = useAuth()
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const fn = mode === 'login' ? login : register
      const data = await fn(username.trim(), password)
      authLogin(data.access_token, username.trim().toLowerCase())
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
        <div className="text-5xl mb-3">⚽</div>
        <h1 className="text-3xl font-black tracking-tight">World Cup 2026</h1>
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
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white placeholder-muted outline-none focus:border-accent transition-colors"
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
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white placeholder-muted outline-none focus:border-accent transition-colors"
            style={{ fontSize: '16px' }}
          />
        </div>

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
