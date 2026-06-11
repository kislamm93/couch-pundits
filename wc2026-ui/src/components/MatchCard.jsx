import React, { useState, useEffect } from 'react'
import Stepper from './Stepper'
import { putPrediction, getMatchPredictions } from '../api'
import { useAuth } from '../context/AuthContext'
import { teamFlag } from '../teamFlags'
import { pointBadgeClass } from '../scoring'

function formatKickoff(utcString) {
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(utcString))
}

function formatKickoffDate(utcString) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(utcString))
}

function countdown(utcString) {
  const diff = new Date(utcString) - Date.now()
  if (diff <= 0) return null
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(h / 24)
  if (d > 0) return `in ${d}d ${h % 24}h`
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 0) return `in ${h}h ${m}m`
  return `in ${m}m`
}

function LockIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function CheckIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function PointsBadge({ points }) {
  if (points === null || points === undefined) return null
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pointBadgeClass(points)}`}>
      +{points}
    </span>
  )
}

export default function MatchCard({ fixture, prediction, onSaved, onError }) {
  const { auth } = useAuth()
  const isLocked = Date.now() >= new Date(fixture.kickoff_utc).getTime()
  const isFinished = fixture.status === 'finished'

  const [homeVal, setHomeVal] = useState(prediction?.pred_home ?? 0)
  const [awayVal, setAwayVal] = useState(prediction?.pred_away ?? 0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!prediction)

  const [picksOpen, setPicksOpen] = useState(false)
  const [picks, setPicks] = useState(null) // null = not loaded yet
  const [picksLoading, setPicksLoading] = useState(false)

  async function togglePicks() {
    if (picksOpen) { setPicksOpen(false); return }
    setPicksOpen(true)
    if (picks === null) {
      setPicksLoading(true)
      try {
        setPicks(await getMatchPredictions(fixture.match_id))
      } catch {
        setPicks([])
      } finally {
        setPicksLoading(false)
      }
    }
  }

  const dirty =
    !prediction
      ? homeVal !== 0 || awayVal !== 0
      : homeVal !== prediction.pred_home || awayVal !== prediction.pred_away

  useEffect(() => {
    if (prediction) {
      setHomeVal(prediction.pred_home)
      setAwayVal(prediction.pred_away)
      setSaved(true)
    }
  }, [prediction])

  async function handleSave() {
    setSaving(true)
    const prevHome = homeVal
    const prevAway = awayVal
    setSaved(true)
    try {
      await putPrediction(fixture.match_id, homeVal, awayVal)
      onSaved?.()
    } catch (err) {
      setSaved(false)
      setHomeVal(prevHome)
      setAwayVal(prevAway)
      onError?.(err.message)
    } finally {
      setSaving(false)
    }
  }

  const cd = countdown(fixture.kickoff_utc)

  return (
    <div className="bg-card border border-border rounded-card p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted bg-border rounded-full px-2 py-0.5">
            Group {fixture.group}
          </span>
          {isFinished && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted bg-border rounded-full px-2 py-0.5">
              <CheckIcon className="w-3 h-3" /> Completed
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">{formatKickoffDate(fixture.kickoff_utc)} · {formatKickoff(fixture.kickoff_utc)}</p>
          <p className="text-xs text-muted">{fixture.stadium}</p>
          <p className="text-xs text-muted">{fixture.city}</p>
        </div>
      </div>

      {cd && (
        <span className="inline-block text-xs font-semibold text-bg bg-accent rounded-full px-2 py-0.5">
          {cd}
        </span>
      )}

      {isFinished ? (
        /* ── FINISHED STATE (compact: Home  score  Away in one row) ── */
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold flex items-center gap-1 flex-1 min-w-0">
              <span>{teamFlag(fixture.home_team)}</span>
              <span className="truncate">{fixture.home_team}</span>
            </span>
            <span className="text-2xl font-black tabular-nums flex-shrink-0">
              {fixture.home_score}<span className="text-muted mx-1.5">–</span>{fixture.away_score}
            </span>
            <span className="font-semibold flex items-center justify-end gap-1 flex-1 min-w-0">
              <span className="truncate text-right">{fixture.away_team}</span>
              <span>{teamFlag(fixture.away_team)}</span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted">
              {prediction ? `Your pick: ${prediction.pred_home}–${prediction.pred_away}` : ''}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <PointsBadge points={prediction?.points} />
              <span className="text-xs text-muted bg-border rounded-full px-2 py-0.5">FT</span>
            </div>
          </div>
        </div>
      ) : isLocked ? (
        /* ── LOCKED STATE ── */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{teamFlag(fixture.home_team)} {fixture.home_team}</span>
            <div className="flex items-center gap-2">
              {prediction && <span className="text-sm font-bold text-muted">{prediction.pred_home}</span>}
              <span className="text-xs text-muted">🔒</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">{teamFlag(fixture.away_team)} {fixture.away_team}</span>
            {prediction && <span className="text-sm font-bold text-muted">{prediction.pred_away}</span>}
          </div>
          <p className="text-xs text-center text-muted">Locked — match has kicked off</p>
        </div>
      ) : (
        /* ── OPEN / PREDICTED STATE ── */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{teamFlag(fixture.home_team)} {fixture.home_team}</span>
            <Stepper value={homeVal} onChange={setHomeVal} />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">{teamFlag(fixture.away_team)} {fixture.away_team}</span>
            <Stepper value={awayVal} onChange={setAwayVal} />
          </div>
          {saved && !dirty && (
            <p className="text-xs text-muted text-center">Pick locked in — editable until kickoff</p>
          )}
          <button
            onClick={handleSave}
            disabled={saving || (!dirty && saved)}
            className="w-full py-2.5 rounded-xl font-bold text-bg bg-accent disabled:opacity-40 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            {saving ? 'Saving…' : saved && !dirty ? (<><LockIcon className="w-4 h-4" /> Locked</>) : 'Save pick'}
          </button>
        </div>
      )}

      {/* Everyone's picks — revealed once the match has kicked off */}
      {isLocked && (
        <div>
          <button
            onClick={togglePicks}
            className="w-full flex items-center justify-center gap-1 text-xs font-semibold text-muted hover:text-accent transition-colors"
          >
            {picksOpen ? 'Hide picks' : "See everyone's picks"}
            <svg className={`w-3 h-3 transition-transform ${picksOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {picksOpen && (
            <div className="pt-2 mt-2 border-t border-border space-y-1.5">
              {picksLoading ? (
                <p className="text-xs text-muted text-center py-1">Loading…</p>
              ) : !picks || picks.length === 0 ? (
                <p className="text-xs text-muted text-center py-1">No predictions for this match.</p>
              ) : (
                picks.map((p) => {
                  const isMe = p.username === auth?.username
                  const scored = p.points !== null && p.points !== undefined
                  return (
                    <div key={p.username} className="flex items-center justify-between gap-2 text-sm">
                      <span className={`truncate flex-1 ${isMe ? 'text-accent font-semibold' : ''}`}>
                        {p.username}{isMe && <span className="text-xs font-normal text-muted"> (you)</span>}
                      </span>
                      <span className="font-bold tabular-nums text-muted flex-shrink-0">
                        {p.pred_home}–{p.pred_away}
                      </span>
                      {scored ? (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${pointBadgeClass(p.points)}`}>
                          +{p.points}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-yellow-400 flex-shrink-0">pending</span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
