const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

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
    throw new Error('Session expired')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed: ${res.status}`)
  }
  return res.json()
}

export function register(username, password) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
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

export function getFixtures() {
  return request('/fixtures')
}

export function getPredictionsMe() {
  return request('/predictions/me')
}

export function putPrediction(matchId, predHome, predAway) {
  return request(`/predictions/${matchId}`, {
    method: 'PUT',
    body: JSON.stringify({ pred_home: predHome, pred_away: predAway }),
  })
}

export function getLeaderboard() {
  return request('/leaderboard')
}
