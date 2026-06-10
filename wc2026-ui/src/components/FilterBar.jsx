import React from 'react'

function formatDate(ds) {
  const [, m, d] = ds.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`
}

const TOGGLE_BASE = 'flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors'
const TOGGLE_ON   = 'bg-accent/10 border-accent text-accent'
const TOGGLE_OFF  = 'bg-transparent border-border text-muted'

export default function FilterBar({
  filters, onOpen, onClear,
  hidePredicted, onToggleHidePredicted,
  todayActive, onTodayClick,
}) {
  const { date, group, team } = filters
  const chips = []
  if (date && !todayActive) chips.push({ key: 'date', label: formatDate(date) })
  if (group !== 'All') chips.push({ key: 'group', label: `Group ${group}` })
  if (team) chips.push({ key: 'team', label: team })

  const panelActive = chips.length > 0

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 py-2">

      {/* Panel filters button */}
      <button
        onClick={onOpen}
        className={`${TOGGLE_BASE} ${panelActive ? TOGGLE_ON : TOGGLE_OFF}`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 12h10M11 20h2" />
        </svg>
        Filters
        {panelActive && (
          <span className="bg-accent text-bg text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
            {chips.length}
          </span>
        )}
      </button>

      {/* Today shortcut */}
      <button
        onClick={onTodayClick}
        className={`${TOGGLE_BASE} ${todayActive ? TOGGLE_ON : TOGGLE_OFF}`}
      >
        Today
      </button>

      {/* Hide predicted toggle */}
      <button
        onClick={onToggleHidePredicted}
        className={`${TOGGLE_BASE} ${hidePredicted ? TOGGLE_ON : TOGGLE_OFF}`}
      >
        Hide predicted
        <span className={`inline-flex w-7 h-4 rounded-full transition-colors items-center px-0.5 flex-shrink-0 ${hidePredicted ? 'bg-accent' : 'bg-border'}`}>
          <span className={`w-3 h-3 rounded-full bg-white transition-transform ${hidePredicted ? 'translate-x-3' : 'translate-x-0'}`} />
        </span>
      </button>

      {/* Active filter chips (date/group/team — not today, handled above) */}
      {chips.map(chip => (
        <button
          key={chip.key}
          onClick={() => onClear(chip.key)}
          className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent/15 border border-accent/50 text-accent text-sm font-semibold"
        >
          {chip.label}
          <span className="opacity-60 ml-0.5 text-base leading-none">×</span>
        </button>
      ))}
    </div>
  )
}
