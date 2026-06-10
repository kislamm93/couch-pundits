import React from 'react'

export default function Stepper({ value, onChange, disabled }) {
  return (
    <div className="flex items-center gap-2">
      <button
        aria-label="Decrease"
        disabled={disabled || value <= 0}
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-10 h-10 rounded-full bg-border flex items-center justify-center text-white text-xl font-bold disabled:opacity-30 active:scale-95 transition-transform"
      >
        −
      </button>
      <span className="w-8 text-center text-2xl font-bold tabular-nums">{value}</span>
      <button
        aria-label="Increase"
        disabled={disabled}
        onClick={() => onChange(value + 1)}
        className="w-10 h-10 rounded-full bg-border flex items-center justify-center text-white text-xl font-bold disabled:opacity-30 active:scale-95 transition-transform"
      >
        +
      </button>
    </div>
  )
}
