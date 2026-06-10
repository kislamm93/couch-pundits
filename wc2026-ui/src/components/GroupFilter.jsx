import React from 'react'

const GROUPS = ['All', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export default function GroupFilter({ selected, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-2">
      {GROUPS.map((g) => (
        <button
          key={g}
          onClick={() => onChange(g)}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
            selected === g
              ? 'bg-accent text-bg border-accent'
              : 'bg-transparent text-muted border-border'
          }`}
        >
          {g}
        </button>
      ))}
    </div>
  )
}
