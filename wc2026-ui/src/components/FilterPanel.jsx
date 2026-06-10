import React, { useState, useEffect, useMemo, useRef } from 'react'

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function localDateStr(utcString) {
  const d = new Date(utcString)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function CalendarSection({ fixtures, selectedDate, onDateChange }) {
  const [month, setMonth] = useState(5) // June = 5
  const year = 2026

  const matchDates = useMemo(() => {
    const s = new Set()
    for (const f of fixtures) s.add(localDateStr(f.kickoff_utc))
    return s
  }, [fixtures])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayMon = (new Date(year, month, 1).getDay() + 6) % 7 // Mon=0

  function dayKey(day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-muted">Date</p>
        {selectedDate && (
          <button onClick={() => onDateChange(null)} className="text-xs text-accent">Clear</button>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setMonth(m => Math.max(5, m - 1))}
          disabled={month === 5}
          className="w-8 h-8 rounded-full bg-border flex items-center justify-center disabled:opacity-25 text-fg text-lg leading-none"
        >‹</button>
        <span className="font-semibold text-sm">{MONTH_NAMES[month]} {year}</span>
        <button
          onClick={() => setMonth(m => Math.min(6, m + 1))}
          disabled={month === 6}
          className="w-8 h-8 rounded-full bg-border flex items-center justify-center disabled:opacity-25 text-fg text-lg leading-none"
        >›</button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} className="text-center text-xs text-muted font-semibold py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: firstDayMon }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dk = dayKey(day)
          const hasMatch = matchDates.has(dk)
          const isSelected = selectedDate === dk
          return (
            <button
              key={day}
              disabled={!hasMatch}
              onClick={() => onDateChange(isSelected ? null : dk)}
              className={[
                'w-9 h-9 mx-auto rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                isSelected ? 'bg-accent text-bg font-bold' : '',
                hasMatch && !isSelected ? 'text-fg hover:bg-border' : '',
                !hasMatch ? 'text-muted/25 cursor-default' : '',
              ].join(' ')}
            >
              {day}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function TeamAutocomplete({ allTeams, value, onChange }) {
  const [input, setInput] = useState(value || '')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  // Sync input when filter is cleared externally (e.g. "Clear all")
  useEffect(() => { setInput(value || '') }, [value])

  const suggestions = useMemo(() => {
    if (!input.trim()) return []
    return allTeams.filter(t => t.toLowerCase().includes(input.toLowerCase()))
  }, [input, allTeams])

  function select(team) {
    setInput(team)
    onChange(team)
    setOpen(false)
  }

  function handleChange(e) {
    const v = e.target.value
    setInput(v)
    if (!v) onChange('')
    setOpen(true)
  }

  function handleBlur() {
    // delay so onMouseDown on a suggestion fires before blur hides the list
    setTimeout(() => setOpen(false), 150)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={handleChange}
          onFocus={() => input && setOpen(true)}
          onBlur={handleBlur}
          placeholder="Type a country name…"
          className="w-full bg-bg border border-border rounded-xl pl-4 pr-9 py-2.5 text-sm text-fg placeholder-muted outline-none focus:border-accent transition-colors"
        />
        {input && (
          <button
            onMouseDown={e => { e.preventDefault(); setInput(''); onChange(''); setOpen(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-lg leading-none"
          >×</button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-xl mt-1 max-h-48 overflow-y-auto z-20 shadow-lg">
          {suggestions.map(t => (
            <button
              key={t}
              onMouseDown={() => select(t)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-border ${
                value === t ? 'text-accent font-semibold' : 'text-fg'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function FilterPanel({ fixtures, filters, onChange, onClose }) {
  const allTeams = useMemo(() => {
    const s = new Set()
    for (const f of fixtures) { s.add(f.home_team); s.add(f.away_team) }
    return Array.from(s).sort()
  }, [fixtures])

  const activeCount = (filters.date ? 1 : 0) + (filters.group !== 'All' ? 1 : 0) + (filters.team ? 1 : 0)

  function clearAll() {
    onChange({ date: null, group: 'All', team: '' })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={onClose} />

      <div className="relative bg-card rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden animate-slide-up">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
          <h2 className="text-base font-bold flex items-center gap-2">
            Filter Matches
            {activeCount > 0 && (
              <span className="bg-accent text-bg text-xs font-bold rounded-full px-2 py-0.5">{activeCount} active</span>
            )}
          </h2>
          <button onClick={onClose} className="text-muted text-2xl leading-none w-8 h-8 flex items-center justify-center">×</button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pt-5 pb-4 space-y-6">

          <CalendarSection
            fixtures={fixtures}
            selectedDate={filters.date}
            onDateChange={d => onChange({ ...filters, date: d })}
          />

          <div className="border-t border-border" />

          {/* Group dropdown */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted">Group</p>
              {filters.group !== 'All' && (
                <button onClick={() => onChange({ ...filters, group: 'All' })} className="text-xs text-accent">Clear</button>
              )}
            </div>
            <div className="relative">
              <select
                value={filters.group}
                onChange={e => onChange({ ...filters, group: e.target.value })}
                style={{ fontSize: '16px' }}
                className="w-full appearance-none bg-bg border border-border rounded-xl px-4 py-2.5 text-base font-sans font-medium text-fg outline-none focus:border-accent transition-colors cursor-pointer"
              >
                <option value="All">All groups</option>
                {GROUPS.map(g => (
                  <option key={g} value={g}>Group {g}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </section>

          <div className="border-t border-border" />

          {/* Team autocomplete */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted">Team</p>
              {filters.team && (
                <button onClick={() => onChange({ ...filters, team: '' })} className="text-xs text-accent">Clear</button>
              )}
            </div>
            <TeamAutocomplete
              allTeams={allTeams}
              value={filters.team}
              onChange={team => onChange({ ...filters, team })}
            />
          </section>

        </div>

        <div className="px-5 py-4 border-t border-border flex gap-3 flex-shrink-0">
          <button
            onClick={clearAll}
            className="flex-1 py-3 rounded-xl border border-border text-muted font-semibold text-sm active:opacity-60"
          >
            Clear all
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-accent text-bg font-bold text-sm active:scale-[0.98] transition-transform"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
