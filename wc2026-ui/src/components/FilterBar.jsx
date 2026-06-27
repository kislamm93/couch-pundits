import React from 'react'
import { teamFlag } from '../teamFlags'

function formatDate(ds) {
  const [, m, d] = ds.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`
}

const ROW_BTN = 'flex-1 min-w-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold border transition-colors'
const ON  = 'bg-accent/10 border-accent text-accent'
const OFF = 'bg-transparent border-border text-muted'

export default function FilterBar({
  filters, onOpen, onClear,
  next24hActive, onNext24hClick,
  myTeam, myTeamActive, onMyTeamClick,
}) {
  const { date, group, team } = filters

  // Chips for panel-set filters not already represented by a quick button
  const chips = []
  if (date) chips.push({ key: 'date', label: formatDate(date) })
  if (group !== 'All') chips.push({ key: 'group', label: group === 'KO' ? 'Knockout stage' : `Group ${group}` })
  if (team && team !== myTeam) chips.push({ key: 'team', label: team })

  const panelActive = chips.length > 0

  return (
    <div className="px-4 py-2 space-y-2">

      {/* Row 1: Filters · Today · Favorite team — full width */}
      <div className="flex items-stretch gap-2">
        <button onClick={onOpen} className={`${ROW_BTN} ${panelActive ? ON : OFF}`}>
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 12h10M11 20h2" />
          </svg>
          Filters
          {panelActive && (
            <span className="bg-accent text-bg text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none flex-shrink-0">
              {chips.length}
            </span>
          )}
        </button>

        <button onClick={onNext24hClick} className={`${ROW_BTN} ${next24hActive ? ON : OFF}`}>
          Next 24h
        </button>

        <button
          onClick={onMyTeamClick}
          disabled={!myTeam}
          className={`${ROW_BTN} ${myTeamActive ? ON : OFF} disabled:opacity-40`}
        >
          {myTeam ? (
            <>
              <span className="flex-shrink-0">{teamFlag(myTeam)}</span>
              <span className="truncate">{myTeam}</span>
            </>
          ) : (
            'My Team'
          )}
        </button>
      </div>

      {/* Active panel-filter chips (only when present) */}
      {chips.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
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
      )}
    </div>
  )
}
