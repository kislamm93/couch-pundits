import React, { useState, useEffect } from 'react'
import { getLeaderboard, getPredictionsMe, getFixtures } from '../api'
import { useAuth } from '../context/AuthContext'
import Skeleton from '../components/Skeleton'

export default function ProfileScreen() {
  const { auth, logout } = useAuth()
  const [stats, setStats] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [fixtureMap, setFixtureMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [lb, preds, fixtures] = await Promise.all([
          getLeaderboard(),
          getPredictionsMe(),
          getFixtures(),
        ])
        const myRow = lb.find((r) => r.username === auth?.username)
        setStats(myRow || { total_points: 0, exact_count: 0, correct_count: 0, played: 0 })
        setPredictions(preds)
        const map = {}
        for (const f of fixtures) map[f.match_id] = f
        setFixtureMap(map)
      } catch {
        // silently fail — user will see empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [auth])

  const initial = auth?.username?.[0]?.toUpperCase() || '?'

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-safe pt-6 pb-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-bg text-xl font-black">
          {initial}
        </div>
        <div>
          <h1 className="text-xl font-black">@{auth?.username}</h1>
          <p className="text-xs text-muted">Group Stage</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-momentum pb-28 px-4 space-y-6">
        {/* Stats card */}
        <div className="bg-card border border-border rounded-card p-4">
          {loading ? (
            <div className="flex gap-4">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="flex-1 h-14" />)}
            </div>
          ) : (
            <div className="flex divide-x divide-border">
              {[
                { label: 'Points', value: stats?.total_points ?? 0 },
                { label: 'Exact', value: stats?.exact_count ?? 0 },
                { label: 'Correct', value: stats?.correct_count ?? 0 },
              ].map((s) => (
                <div key={s.label} className="flex-1 text-center px-2">
                  <p className="text-3xl font-black text-accent tabular-nums">{s.value}</p>
                  <p className="text-xs text-muted mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prediction list */}
        <div>
          <h2 className="text-sm font-bold text-muted uppercase tracking-widest mb-3">My predictions</h2>
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
                      <span className={`text-sm font-bold ${p.points === 5 ? 'text-accent' : p.points === 2 ? 'text-green-400' : 'text-muted'}`}>
                        +{p.points}
                      </span>
                    ) : (
                      <span className="text-xs text-muted">Pending</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full py-3 border border-border rounded-xl text-muted font-semibold active:opacity-70 transition-opacity"
        >
          Log out
        </button>
      </div>
    </div>
  )
}
