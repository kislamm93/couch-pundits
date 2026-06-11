import React, { useState, useEffect } from 'react'
import { getLeaderboard, getMyLeagues } from '../api'
import { useAuth } from '../context/AuthContext'
import LeaderboardRow from '../components/LeaderboardRow'
import Skeleton from '../components/Skeleton'
import Toast from '../components/Toast'
import ThemeToggle from '../components/ThemeToggle'
import { pointTextClass } from '../scoring'

const SCORING_RULES = [
  { pts: 5, label: 'Exact score', desc: 'Both teams\' goals exactly right' },
  { pts: 3, label: 'Correct goal difference', desc: 'Right winning margin — e.g. you said 2–1, it ends 3–2' },
  { pts: 2, label: 'Correct outcome', desc: 'Right winner with the wrong score', note: 'A correctly predicted draw scores 2, not 3' },
  { pts: 0, label: 'Wrong outcome', desc: 'Incorrect result' },
]

export default function LeaderboardScreen() {
  const { auth } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [leagues, setLeagues] = useState([])
  const [activeLeague, setActiveLeague] = useState(null) // null = all (union)

  useEffect(() => {
    getMyLeagues().then(setLeagues).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    getLeaderboard(activeLeague)
      .then(setRows)
      .catch((err) => setToast({ message: err.message, type: 'error' }))
      .finally(() => setLoading(false))
  }, [activeLeague])

  return (
    <div className="flex flex-col h-full">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <div className="px-4 pt-safe pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Leaderboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRulesOpen(v => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted border border-border rounded-full px-3 py-1.5 transition-colors hover:border-accent hover:text-accent"
            >
              Scoring
              <svg className={`w-3 h-3 transition-transform ${rulesOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <ThemeToggle />
          </div>
        </div>

        {leagues.length > 1 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            <button
              onClick={() => setActiveLeague(null)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                activeLeague === null
                  ? 'bg-accent text-bg border-accent'
                  : 'border-border text-muted hover:border-accent hover:text-accent'
              }`}
            >
              All
            </button>
            {leagues.map((l) => (
              <button
                key={l.id}
                onClick={() => setActiveLeague(l.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  activeLeague === l.id
                    ? 'bg-accent text-bg border-accent'
                    : 'border-border text-muted hover:border-accent hover:text-accent'
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        )}

        {rulesOpen && (
          <div className="mt-3 bg-card border border-border rounded-xl p-4 space-y-2">
            {SCORING_RULES.map(r => (
              <div key={r.pts} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">{r.label}</p>
                  <p className="text-xs text-muted">{r.desc}</p>
                  {r.note && (
                    <p className="text-[11px] font-semibold text-accent mt-0.5">{r.note}</p>
                  )}
                </div>
                <span className={`text-sm font-black flex-shrink-0 ${pointTextClass(r.pts)}`}>
                  {r.pts > 0 ? `+${r.pts} pts` : '0 pts'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scroll-momentum pb-28">
        {loading ? (
          <div className="space-y-1 px-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-8">
            <p className="text-muted">No results in yet — predictions are open!</p>
          </div>
        ) : (
          rows.map((row, i) => (
            <LeaderboardRow
              key={row.username}
              rank={i + 1}
              {...row}
              isMe={row.username === auth?.username}
            />
          ))
        )}
      </div>
    </div>
  )
}
