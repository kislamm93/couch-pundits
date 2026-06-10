import React, { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import BottomTabBar from './components/BottomTabBar'
import AuthScreen from './screens/AuthScreen'
import MatchesScreen from './screens/MatchesScreen'
import LeaderboardScreen from './screens/LeaderboardScreen'
import ProfileScreen from './screens/ProfileScreen'

function AppInner() {
  const { auth } = useAuth()
  const [tab, setTab] = useState('matches')

  if (!auth) return <AuthScreen />

  return (
    <div className="h-full flex flex-col bg-bg max-w-[430px] mx-auto relative">
      <div className="flex-1 overflow-hidden flex flex-col">
        {tab === 'matches' && <MatchesScreen />}
        {tab === 'leaderboard' && <LeaderboardScreen />}
        {tab === 'profile' && <ProfileScreen />}
      </div>
      <BottomTabBar active={tab} onChange={setTab} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
