import React, { useState, useEffect } from 'react'
import { getLeaderboard } from '../api'
import { useAuth } from '../context/AuthContext'
import LeaderboardRow from '../components/LeaderboardRow'
import Skeleton from '../components/Skeleton'
import Toast from '../components/Toast'

const SCORING_RULES = [
  { pts: 5, label: 'Exact score', desc: 'You got both goals right' },
  { pts: 2, label: 'Correct outcome', desc: 'Right winner or draw, wrong score' },
  { pts: 0, label: 'Wrong outcome', desc: 'Incorrect result' },
]

export default function LeaderboardScreen() {
  const { auth } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    getLeaderboard()
      .then(setRows)
      .catch((err) => setToast({ message: err.message, type: 'error' }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col h-full">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <div className="px-4 pt-safe pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Leaderboard</h1>
          </div>
          <button
            onClick={() => setRulesOpen(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted border border-border rounded-full px-3 py-1.5 transition-colors hover:border-accent hover:text-accent"
          >
            Scoring
            <svg className={`w-3 h-3 transition-transform ${rulesOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {rulesOpen && (
          <div className="mt-3 bg-card border border-border rounded-xl p-4 space-y-2">
            {SCORING_RULES.map(r => (
              <div key={r.pts} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">{r.label}</p>
                  <p className="text-xs text-muted">{r.desc}</p>
                </div>
                <span className={`text-sm font-black flex-shrink-0 ${r.pts === 5 ? 'text-accent' : r.pts === 2 ? 'text-green-400' : 'text-muted'}`}>
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
