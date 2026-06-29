// In production VITE_API_BASE is set explicitly. In dev, derive the API host
// from whatever host loaded the page so it works over the LAN (e.g. a phone
// hitting http://192.168.x.x:5173 will call http://192.168.x.x:8000).
const BASE =
  import.meta.env.VITE_API_BASE ||
  `${window.location.protocol}//${window.location.hostname}:8000`

function getToken() {
  return localStorage.getItem('wc_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    window.dispatchEvent(new Event('wc:logout'))
    throw new Error('Login Failed!')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed: ${res.status}`)
  }
  return res.json()
}

export function register(username, password, favoriteTeam) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, favorite_team: favoriteTeam }),
  })
}

export function login(username, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function getMe() {
  return request('/me')
}

export function saveTheme(theme) {
  return request('/me/theme', {
    method: 'PUT',
    body: JSON.stringify({ theme }),
  })
}

export function updateProfile({ username, favoriteTeam } = {}) {
  const body = {}
  if (username !== undefined) body.username = username
  if (favoriteTeam !== undefined) body.favorite_team = favoriteTeam
  return request('/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function getFixtures() {
  return request('/fixtures')
}

export function getPredictionsMe() {
  return request('/predictions/me')
}

export function putPrediction(matchId, predHome, predAway, predPenaltyWinner = null) {
  return request(`/predictions/${matchId}`, {
    method: 'PUT',
    body: JSON.stringify({
      pred_home: predHome,
      pred_away: predAway,
      pred_penalty_winner: predPenaltyWinner,
    }),
  })
}

export function getMatchPredictions(matchId) {
  return request(`/predictions/match/${matchId}`)
}

export function getLeaderboard(leagueId = null) {
  const qs = leagueId ? `?league_id=${encodeURIComponent(leagueId)}` : ''
  return request(`/leaderboard${qs}`)
}

export function getMyLeagues() {
  return request('/leagues/me')
}

export function getUserPredictions(username, leagueId = null, { skip = 0, limit = 5 } = {}) {
  const params = new URLSearchParams()
  if (leagueId) params.set('league_id', leagueId)
  params.set('skip', skip)
  params.set('limit', limit)
  return request(`/predictions/user/${encodeURIComponent(username)}?${params}`)
}
