// Canonical colors for prediction points across the app.
//   5,7 = exact          → bright green (7 = exact + correct penalty bonus)
//   3   = goal difference → lighter green
//   2,4 = correct outcome → blue (4 = correct + correct penalty bonus)
//   0   = wrong           → red
//   pending (no score)    → yellow

export function pointTextClass(points) {
  switch (points) {
    case 5: case 7: return 'text-green-400'
    case 3: return 'text-green-300'
    case 2: case 4: return 'text-sky-400'
    case 0: return 'text-red-400'
    default: return 'text-yellow-400' // not yet scored
  }
}

export function pointBadgeClass(points) {
  switch (points) {
    case 5: case 7: return 'bg-green-500/15 text-green-400'
    case 3: return 'bg-green-500/10 text-green-300'
    case 2: case 4: return 'bg-sky-500/15 text-sky-400'
    case 0: return 'bg-red-500/15 text-red-400'
    default: return 'bg-yellow-500/15 text-yellow-400'
  }
}
