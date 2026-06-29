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
  { pts: 2, label: 'Tie breaker bonus', desc: 'Knockout draw — pick who goes through on penalties', note: 'Bonus on top of your score/outcome points', highlight: true },
]

export default function LeaderboardScreen() {
  const { auth } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [leagues, setLeagues] = useState([])
  // null = global (only for users in no league); otherwise always a single group
  const [activeLeague, setActiveLeague] = useState(null)
  // Gate the leaderboard fetch until we know which group to scope to
  const [leaguesLoaded, setLeaguesLoaded] = useState(false)

  useEffect(() => {
    getMyLeagues()
      .then((ls) => {
        setLeagues(ls)
        // Always scope to a single group so its start_date is respected
        if (ls.length > 0) setActiveLeague(ls[0].id)
      })
      .catch(() => {})
      .finally(() => setLeaguesLoaded(true))
  }, [])

  useEffect(() => {
    if (!leaguesLoaded) return
    setLoading(true)
    getLeaderboard(activeLeague)
      .then(setRows)
      .catch((err) => setToast({ message: err.message, type: 'error' }))
      .finally(() => setLoading(false))
  }, [activeLeague, leaguesLoaded])

  // Competition ranking: ties share a rank, the next score skips ahead (1, 1, 3, ...)
  const ranks = rows.map((row, i) =>
    i > 0 && rows[i - 1].total_points === row.total_points ? null : i + 1
  )
  ranks.forEach((r, i) => { if (r === null) ranks[i] = ranks[i - 1] })

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
              <div
                key={r.label}
                className={`flex items-center justify-between gap-4 ${
                  r.highlight ? 'bg-accent/10 rounded-lg px-2 py-1.5 -mx-2' : ''
                }`}
              >
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
              rank={ranks[i]}
              {...row}
              leagueId={activeLeague}
              isMe={row.username === auth?.username}
            />
          ))
        )}
      </div>
    </div>
  )
}
