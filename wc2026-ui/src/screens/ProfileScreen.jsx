import React, { useState, useEffect } from 'react'
import { getLeaderboard, getPredictionsMe, getFixtures, updateProfile, getPredictionDistribution } from '../api'
import { useAuth } from '../context/AuthContext'
import Skeleton from '../components/Skeleton'
import ThemeToggle from '../components/ThemeToggle'
import { teamFlag } from '../teamFlags'
import { pointTextClass } from '../scoring'
import ScoreDistributionChart from '../components/ScoreDistributionChart'

export default function ProfileScreen() {
  const { auth, logout, login } = useAuth()
  const [stats, setStats] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [fixtureMap, setFixtureMap] = useState({})
  const [teams, setTeams] = useState([])
  const [usernameInput, setUsernameInput] = useState(auth?.username || '')
  const [teamInput, setTeamInput] = useState(auth?.favoriteTeam || '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null) // { text, error }
  const [editing, setEditing] = useState(false)
  const [predOpen, setPredOpen] = useState(false)
  const [distribution, setDistribution] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [lb, preds, fixtures, dist] = await Promise.all([
          getLeaderboard(),
          getPredictionsMe(),
          getFixtures(),
          getPredictionDistribution(),
        ])
        const myRow = lb.find((r) => r.username === auth?.username)
        setStats(myRow || { total_points: 0, exact_count: 0, diff_count: 0, correct_count: 0, played: 0 })
        setPredictions(preds)
        setDistribution(dist)
        const map = {}
        for (const f of fixtures) map[f.match_id] = f
        setFixtureMap(map)
        const set = new Set()
        for (const f of fixtures) { set.add(f.home_team); set.add(f.away_team) }
        setTeams(Array.from(set).sort())
      } catch {
        // silently fail — user will see empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [auth])

  // Keep the form in sync with the stored profile (e.g. after a successful save)
  useEffect(() => {
    setUsernameInput(auth?.username || '')
    setTeamInput(auth?.favoriteTeam || '')
  }, [auth?.username, auth?.favoriteTeam])

  const nextUsername = usernameInput.trim().toLowerCase()
  const usernameChanged = nextUsername !== (auth?.username || '')
  const teamChanged = teamInput !== (auth?.favoriteTeam || '')
  const dirty = usernameChanged || teamChanged

  async function handleSave() {
    setMsg(null)
    if (usernameChanged && (nextUsername.length < 3 || nextUsername.length > 20)) {
      setMsg({ text: 'Username must be 3–20 characters', error: true })
      return
    }
    setSaving(true)
    try {
      const res = await updateProfile({
        ...(usernameChanged ? { username: nextUsername } : {}),
        ...(teamChanged ? { favoriteTeam: teamInput } : {}),
      })
      // Apply the (possibly new) token, username and team across the app
      login(res.access_token, res.username, res.favorite_team || '')
      setMsg({ text: 'Saved ✓', error: false })
    } catch (err) {
      setMsg({ text: err.message, error: true })
    } finally {
      setSaving(false)
    }
  }

  function cancelEdit() {
    setUsernameInput(auth?.username || '')
    setTeamInput(auth?.favoriteTeam || '')
    setMsg(null)
    setEditing(false)
  }

  const initial = auth?.username?.[0]?.toUpperCase() || '?'

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-safe pt-6 pb-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-bg text-xl font-black">
          {initial}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black truncate">@{auth?.username}</h1>
            <button
              onClick={() => { setMsg(null); setEditing((v) => !v) }}
              aria-label="Edit profile"
              className={`flex-shrink-0 transition-colors ${editing ? 'text-accent' : 'text-muted hover:text-accent'}`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
          </div>
          {auth?.favoriteTeam && (
            <p className="text-xs text-muted truncate">{teamFlag(auth.favoriteTeam)} {auth.favoriteTeam}</p>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          <ThemeToggle />
          <button
            onClick={logout}
            aria-label="Log out"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-border text-muted transition-colors hover:text-red-400 hover:border-red-400 active:scale-95"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-momentum pb-28 px-4 space-y-6">
        {/* Stats — 2 boxes */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map((i) => <Skeleton key={i} className="h-20 w-full rounded-card" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Points', value: stats?.total_points ?? 0 },
              { label: 'Completed', value: stats?.played ?? 0 },
            ].map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-card p-4 text-center">
                <p className="text-3xl font-black tabular-nums text-accent">{s.value}</p>
                <p className="text-xs text-muted mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Prediction distribution */}
        {!loading && Object.keys(distribution).length > 0 && (
          <div className="bg-card border border-border rounded-card p-4">
            <h2 className="text-sm font-bold text-muted uppercase tracking-widest mb-4">Prediction distribution</h2>
            <ScoreDistributionChart distribution={distribution} />
          </div>
        )}

        {/* Account editor — opened via the edit icon next to the name */}
        {editing && (
        <div>
          <h2 className="text-sm font-bold text-muted uppercase tracking-widest mb-3">Edit profile</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-muted mb-1.5">Username</label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                style={{ fontSize: '16px' }}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-fg placeholder-muted outline-none focus:border-accent transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-muted mb-1.5">Favorite team</label>
              <div className="relative">
                <select
                  value={teamInput}
                  onChange={(e) => setTeamInput(e.target.value)}
                  disabled={teams.length === 0}
                  style={{ fontSize: '16px' }}
                  className={`w-full appearance-none bg-card border border-border rounded-xl px-4 py-3 pr-10 outline-none focus:border-accent transition-colors disabled:opacity-60 ${teamInput ? 'text-fg' : 'text-muted'}`}
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
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="flex-1 py-3 rounded-xl border border-border text-muted font-semibold disabled:opacity-40 active:opacity-70 transition-opacity"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!dirty || saving}
                className="flex-1 py-3 rounded-xl font-bold text-bg bg-accent disabled:opacity-40 active:scale-[0.98] transition-transform"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>

            {msg ? (
              <p className={`text-xs ${msg.error ? 'text-red-400' : 'text-muted'}`}>{msg.text}</p>
            ) : (
              <p className="text-xs text-muted">Your team powers the “My Team” filter on the Matches tab.</p>
            )}
          </div>
        </div>
        )}

        {/* Prediction list (collapsed by default) */}
        <div>
          <button onClick={() => setPredOpen((v) => !v)} className="w-full flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-muted uppercase tracking-widest">
              My predictions{!loading && predictions.length > 0 ? ` (${predictions.length})` : ''}
            </h2>
            <svg className={`w-4 h-4 text-muted transition-transform ${predOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {predOpen && (
          <>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : predictions.length === 0 ? (
            <p className="text-muted text-sm">No predictions yet.</p>
          ) : (
            <div className="space-y-1">
              {predictions.map((p) => {
                const f = fixtureMap[p.match_id]
                if (!f) return null
                return (
                  <div key={p.match_id} className="flex items-center justify-between py-2 border-b border-border">
                    <p className="text-sm truncate flex-1 mr-4">
                      {f.home_team} vs {f.away_team}
                    </p>
                    <span className="text-sm font-bold text-muted mr-3">
                      {p.pred_home}–{p.pred_away}
                    </span>
                    {p.points !== null && p.points !== undefined ? (
                      <span className={`text-sm font-bold ${pointTextClass(p.points)}`}>
                        +{p.points}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-yellow-400">Pending</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  )
}
