import React, { useState } from 'react'

export default function ScoreDistributionChart({ distribution }) {
  const [hoveredScore, setHoveredScore] = useState(null)

  const bars = Object.entries(distribution).sort((a, b) => b[1].count - a[1].count)
  const max = bars[0]?.[1].count ?? 1

  return (
    <div className="space-y-1.5">
      {bars.map(([score, { count, pct }]) => {
        const isHovered = hoveredScore === score
        return (
          <div
            key={score}
            className="flex items-center gap-3 cursor-default"
            onMouseEnter={() => setHoveredScore(score)}
            onMouseLeave={() => setHoveredScore(null)}
          >
            <span className="text-xs font-bold tabular-nums w-8 text-right flex-shrink-0 text-muted">{score}</span>
            <div className="flex-1 rounded-full h-2 relative" style={{ backgroundColor: 'rgba(128,128,128,0.15)' }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-accent transition-all"
                style={{ width: `${(count / max) * 100}%`, opacity: hoveredScore === null || isHovered ? 1 : 0.4 }}
              />
            </div>
            <span
              className="text-xs tabular-nums flex-shrink-0 whitespace-nowrap transition-all"
              style={{ opacity: hoveredScore === null || isHovered ? 1 : 0.4 }}
            >
              {count} ({pct}%)
            </span>
          </div>
        )
      })}
    </div>
  )
}
