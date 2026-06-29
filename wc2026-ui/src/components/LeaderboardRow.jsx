import React, { useState } from 'react'
import { teamFlag } from '../teamFlags'
import { pointBadgeClass } from '../scoring'
import { getUserPredictions } from '../api'

const PAGE_SIZE = 5

export default function LeaderboardRow({ rank, username, total_points, exact_count, favorite_team, leagueId, isMe }) {
  const [open, setOpen] = useState(false)
  const [picks, setPicks] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  async function toggle() {
    if (open) { setOpen(false); return }
    setOpen(true)
    if (picks === null) {
      setLoading(true)
      try {
        const page = await getUserPredictions(username, leagueId, { skip: 0, limit: PAGE_SIZE })
        setPicks(page)
        setHasMore(page.length === PAGE_SIZE)
      } catch {
        setPicks([])
        setHasMore(false)
      } finally {
        setLoading(false)
      }
    }
  }

  async function loadMore() {
    setLoadingMore(true)
    try {
      const page = await getUserPredictions(username, leagueId, { skip: picks.length, limit: PAGE_SIZE })
      setPicks([...picks, ...page])
      setHasMore(page.length === PAGE_SIZE)
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className={`border-b border-border ${isMe ? 'border-l-2 border-l-accent' : ''}`}
      style={isMe ? { backgroundColor: 'rgba(0,224,122,0.07)' } : {}}
    >
      {/* Row */}
      <div
        onClick={toggle}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer active:bg-border transition-colors"
      >
        <span className="w-7 text-center font-bold text-sm" style={{ color: '#8A93A3' }}>
          {rank}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold truncate ${isMe ? 'text-accent' : 'text-fg'}`}>
            {username}{favorite_team && <span className="ml-1">{teamFlag(favorite_team)}</span>}{isMe && <span className="text-xs font-normal text-muted"> (you)</span>}<span className="ml-1 text-xs font-normal text-muted">{exact_count} 🎯</span>
          </p>
        </div>
        <span className="text-2xl font-bold tabular-nums text-accent">{total_points}</span>
        <svg className={`w-3 h-3 text-muted transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded picks */}
      {open && (
        <div className="px-4 pb-3 pt-1 space-y-2 border-t border-border">
          {loading ? (
            <p className="text-xs text-muted text-center py-2">Loading…</p>
          ) : !picks || picks.length === 0 ? (
            <p className="text-xs text-muted text-center py-2">No completed predictions yet.</p>
          ) : (
            picks.map((p) => (
              <div key={p.match_id} className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {teamFlag(p.home_team)} {p.home_team} vs {p.away_team} {teamFlag(p.away_team)}
                  </p>
                  <p className="text-xs text-muted">
                    Pick: <span className="font-bold text-fg">{p.pred_home}–{p.pred_away}</span>
                    {p.pred_penalty_winner && (
                      <span> ({(p.pred_penalty_winner === 'home' ? p.home_team : p.away_team)} to go through)</span>
                    )}
                    <span className="ml-2">Result: <span className="font-bold text-fg">{p.home_score}–{p.away_score}</span></span>
                  </p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${pointBadgeClass(p.points)}`}>
                  +{p.points}
                </span>
              </div>
            ))
          )}
          {!loading && hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full text-xs font-semibold text-accent text-center py-2 disabled:opacity-50"
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
