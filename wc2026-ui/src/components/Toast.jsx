import React, { useEffect } from 'react'

export default function Toast({ message, type = 'error', onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500)
    return () => clearTimeout(t)
  }, [message])

  const bg = type === 'success' ? 'bg-accent text-bg' : 'bg-red-500 text-white'

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg ${bg}`}
      style={{ maxWidth: '90vw' }}
    >
      {message}
    </div>
  )
}
