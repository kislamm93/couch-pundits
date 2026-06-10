import React, { useState, useEffect } from 'react'
import Stepper from './Stepper'
import { putPrediction } from '../api'

const FLAG_MAP = {
  'Mexico': '🇲🇽', 'USA': '🇺🇸', 'Canada': '🇨🇦',
  'Brazil': '🇧🇷', 'Argentina': '🇦🇷', 'Colombia': '🇨🇴', 'Ecuador': '🇪🇨',
  'Uruguay': '🇺🇾', 'Chile': '🇨🇱', 'Paraguay': '🇵🇾', 'Peru': '🇵🇪',
  'Bolivia': '🇧🇴', 'Venezuela': '🇻🇪',
  'Germany': '🇩🇪', 'France': '🇫🇷', 'Spain': '🇪🇸', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Portugal': '🇵🇹', 'Netherlands': '🇳🇱', 'Belgium': '🇧🇪', 'Italy': '🇮🇹',
  'Croatia': '🇭🇷', 'Switzerland': '🇨🇭', 'Austria': '🇦🇹', 'Denmark': '🇩🇰',
  'Sweden': '🇸🇪', 'Norway': '🇳🇴', 'Poland': '🇵🇱',
  'Czech Republic': '🇨🇿', 'Bosnia & Herzegovina': '🇧🇦',
  'Serbia': '🇷🇸', 'Hungary': '🇭🇺', 'Romania': '🇷🇴', 'Ukraine': '🇺🇦',
  'Turkey': '🇹🇷', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'Slovakia': '🇸🇰',
  'Slovenia': '🇸🇮', 'Albania': '🇦🇱', 'Georgia': '🇬🇪',
  'Morocco': '🇲🇦', 'Senegal': '🇸🇳', 'Nigeria': '🇳🇬', 'Egypt': '🇪🇬',
  'South Africa': '🇿🇦', 'Cameroon': '🇨🇲', 'Ghana': '🇬🇭', 'Tunisia': '🇹🇳',
  'Algeria': '🇩🇿', 'Mali': '🇲🇱', 'Ivory Coast': '🇨🇮',
  'Cape Verde': '🇨🇻', 'DR Congo': '🇨🇩', 'Haiti': '🇭🇹',
  'Japan': '🇯🇵', 'South Korea': '🇰🇷', 'Australia': '🇦🇺', 'Iran': '🇮🇷',
  'Saudi Arabia': '🇸🇦', 'Qatar': '🇶🇦', 'Iraq': '🇮🇶', 'Uzbekistan': '🇺🇿',
  'China': '🇨🇳', 'Indonesia': '🇮🇩', 'Jordan': '🇯🇴', 'Bahrain': '🇧🇭',
  'New Zealand': '🇳🇿', 'Curaçao': '🇨🇼',
}

function teamFlag(name) {
  return FLAG_MAP[name] || '⚽'
}

function formatKickoff(utcString) {
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(utcString))
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

function PointsBadge({ points }) {
  if (points === null || points === undefined) return null
  const cfg =
    points === 5 ? { label: '+5', cls: 'bg-accent text-bg' }
    : points === 2 ? { label: '+2', cls: 'bg-green-900 text-accent' }
    : { label: '+0', cls: 'bg-border text-muted' }
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
}

export default function MatchCard({ fixture, prediction, onSaved, onError }) {
  const isLocked = Date.now() >= new Date(fixture.kickoff_utc).getTime()
  const isFinished = fixture.status === 'finished'

  const [homeVal, setHomeVal] = useState(prediction?.pred_home ?? 0)
  const [awayVal, setAwayVal] = useState(prediction?.pred_away ?? 0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!prediction)

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
        <div>
          <span className="text-xs font-semibold text-muted bg-border rounded-full px-2 py-0.5">
            Group {fixture.group}
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">{formatKickoff(fixture.kickoff_utc)}</p>
          <p className="text-xs text-muted truncate max-w-[140px]">{fixture.stadium} · {fixture.city}</p>
        </div>
      </div>

      {cd && (
        <span className="inline-block text-xs font-semibold text-bg bg-accent rounded-full px-2 py-0.5">
          {cd}
        </span>
      )}

      {isFinished ? (
        /* ── FINISHED STATE ── */
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{teamFlag(fixture.home_team)} {fixture.home_team}</span>
            <PointsBadge points={prediction?.points} />
          </div>
          <div className="flex items-center justify-center gap-4 py-2">
            <span className="text-4xl font-black tabular-nums">{fixture.home_score}</span>
            <span className="text-muted font-bold">—</span>
            <span className="text-4xl font-black tabular-nums">{fixture.away_score}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">{teamFlag(fixture.away_team)} {fixture.away_team}</span>
            <span className="text-xs text-muted bg-border rounded-full px-2 py-0.5">FT</span>
          </div>
          {prediction && (
            <p className="text-xs text-muted text-center">
              Your pick: {prediction.pred_home}–{prediction.pred_away}
            </p>
          )}
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
            <p className="text-xs text-muted text-center">Your pick saved ✓</p>
          )}
          <button
            onClick={handleSave}
            disabled={saving || (!dirty && saved)}
            className="w-full py-2.5 rounded-xl font-bold text-bg bg-accent disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            {saving ? 'Saving…' : saved && !dirty ? 'Saved ✓' : 'Save pick'}
          </button>
        </div>
      )}
    </div>
  )
}
