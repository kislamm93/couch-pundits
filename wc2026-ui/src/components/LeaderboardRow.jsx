import React from 'react'

const MEDAL = { 1: { color: '#FFD700', label: '🥇' }, 2: { color: '#C0C0C0', label: '🥈' }, 3: { color: '#CD7F32', label: '🥉' } }

export default function LeaderboardRow({ rank, username, total_points, exact_count, correct_count, played, isMe }) {
  const medal = MEDAL[rank]

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-border ${isMe ? 'border-l-2 border-l-accent' : ''}`}
      style={isMe ? { backgroundColor: 'rgba(0,224,122,0.07)' } : {}}
    >
      <span
        className="w-7 text-center font-bold text-sm"
        style={{ color: medal ? medal.color : '#8A93A3' }}
      >
        {medal ? medal.label : rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold truncate ${isMe ? 'text-accent' : 'text-white'}`}>
          {username} {isMe && <span className="text-xs font-normal text-muted">(you)</span>}
        </p>
        <p className="text-xs text-muted">
          {exact_count} exact · {correct_count} correct · {played} played
        </p>
      </div>
      <span className="text-2xl font-bold tabular-nums text-accent">{total_points}</span>
    </div>
  )
}
