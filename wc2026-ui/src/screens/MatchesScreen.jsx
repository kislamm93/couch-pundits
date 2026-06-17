import React, { useState, useEffect, useCallback, useRef } from 'react'
import { getFixtures, getPredictionsMe } from '../api'
import { useAuth } from '../context/AuthContext'
import FilterBar from '../components/FilterBar'
import FilterPanel from '../components/FilterPanel'
import MatchCard from '../components/MatchCard'
import Toast from '../components/Toast'
import ThemeToggle from '../components/ThemeToggle'
import { MatchCardSkeleton } from '../components/Skeleton'

function localDateStr(utcString) {
  const d = new Date(utcString)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function localDateLabel(utcString) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(utcString))
}

function groupByDate(fixtures) {
  const map = new Map()
  for (const f of fixtures) {
    const label = localDateLabel(f.kickoff_utc)
    if (!map.has(label)) map.set(label, [])
    map.get(label).push(f)
  }
  return map
}

export default function MatchesScreen() {
  const { auth } = useAuth()
  const myTeam = auth?.favoriteTeam || ''
  const [fixtures, setFixtures] = useState([])
  const [predMap, setPredMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [fixtureTab, setFixtureTab] = useState('upcoming')
  const [filters, setFilters] = useState({ date: null, group: 'All', team: '' })
  const [next24hActive, setNext24hActive] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [toast, setToast] = useState(null)

  const load = useCallback(async () => {
    try {
      const [fx, preds] = await Promise.all([getFixtures(), getPredictionsMe()])
      setFixtures(fx)
      const map = {}
      for (const p of preds) map[p.match_id] = p
      setPredMap(map)
    } catch (err) {
      setToast({ message: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Latest fixtures, readable from the polling interval without re-arming it.
  const fixturesRef = useRef(fixtures)
  useEffect(() => { fixturesRef.current = fixtures }, [fixtures])

  // Refresh live scores ~every 60s (matches the backend poller), but only when
  // it's worth it: the tab is visible AND a match is live or kicking off within
  // the next minute. Otherwise the timer is a cheap no-op — no network call.
  // Fixtures only, so an in-progress edit on an unsaved pick isn't clobbered.
  useEffect(() => {
    const id = setInterval(async () => {
      if (document.visibilityState !== 'visible') return
      const now = Date.now()
      const active = fixturesRef.current.some(f => {
        if (f.status === 'finished') return false
        const ko = new Date(f.kickoff_utc).getTime()
        return ko <= now + 60000 && ko > now - 3 * 60 * 60 * 1000 // imminent, or within a match window
      })
      if (!active) return
      try { setFixtures(await getFixtures()) } catch { /* keep last good data */ }
    }, 60000)
    return () => clearInterval(id)
  }, [])

  const myTeamActive = !!myTeam && filters.team === myTeam

  function handleNext24hClick() {
    setNext24hActive(v => !v)
  }

  function handleMyTeamClick() {
    setFilters(f => ({ ...f, team: f.team === myTeam ? '' : myTeam }))
  }

  const filtered = fixtures.filter(f => {
    if (fixtureTab === 'upcoming' && f.status === 'finished') return false
    if (fixtureTab === 'results' && f.status !== 'finished') return false
    if (filters.group !== 'All' && f.group !== filters.group) return false
    if (filters.team && f.home_team !== filters.team && f.away_team !== filters.team) return false
    if (filters.date && localDateStr(f.kickoff_utc) !== filters.date) return false
    if (next24hActive) {
      const now = Date.now()
      const kickoff = new Date(f.kickoff_utc).getTime()
      if (kickoff < now || kickoff > now + 24 * 60 * 60 * 1000) return false
    }
    return true
  })
  const sorted = [...filtered].sort((a, b) => {
    const diff = new Date(a.kickoff_utc) - new Date(b.kickoff_utc)
    return fixtureTab === 'upcoming' ? diff : -diff
  })
  const grouped = groupByDate(sorted)

  function handleClearFilter(key) {
    setFilters(f => ({
      ...f,
      [key]: key === 'group' ? 'All' : key === 'date' ? null : '',
    }))
  }

  function clearAll() {
    setFilters({ date: null, group: 'All', team: '' })
    setNext24hActive(false)
  }

  return (
    <div className="flex flex-col h-full">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      {panelOpen && (
        <FilterPanel
          fixtures={fixtures}
          filters={filters}
          onChange={setFilters}
          onClose={() => setPanelOpen(false)}
        />
      )}

      {/* Header */}
      <div className="px-4 pt-safe pt-6 pb-2 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-black">Fixtures</h1>
        <ThemeToggle />
      </div>

      {/* Tab switcher */}
      <div className="px-4 pt-1 pb-0 flex gap-1">
        {[{ id: 'upcoming', label: 'Upcoming' }, { id: 'results', label: 'Results' }].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFixtureTab(tab.id)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${fixtureTab === tab.id ? 'bg-accent text-bg' : 'text-muted'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <FilterBar
        filters={filters}
        onOpen={() => setPanelOpen(true)}
        onClear={handleClearFilter}
        next24hActive={next24hActive}
        onNext24hClick={handleNext24hClick}
        myTeam={myTeam}
        myTeamActive={myTeamActive}
        onMyTeamClick={handleMyTeamClick}
      />

      {/* Match list */}
      <div className="flex-1 overflow-y-auto scroll-momentum pb-28 px-4 space-y-4 mt-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <MatchCardSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center mt-20 gap-3">
            <p className="text-3xl">⚽</p>
            <p className="text-muted text-sm">No matches for these filters.</p>
            <button
              onClick={clearAll}
              className="text-accent text-sm font-semibold"
            >
              Clear filters
            </button>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([dateLabel, dayFixtures]) => (
            <div key={dateLabel}>
              <p className="text-xs font-bold text-muted uppercase tracking-widest mb-2">{dateLabel}</p>
              <div className="space-y-3">
                {dayFixtures.map((f) => (
                  <MatchCard
                    key={f.match_id}
                    fixture={f}
                    prediction={predMap[f.match_id]}
                    onSaved={() => {
                      setToast({ message: 'Pick saved!', type: 'success' })
                      load()
                    }}
                    onError={(msg) => setToast({ message: msg, type: 'error' })}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
