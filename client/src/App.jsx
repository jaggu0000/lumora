import React from 'react';
import CommunityPage from './pages/CommunityPage.jsx';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from './pages/LandingPage.jsx'
import AuthPage from './auth/AuthPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AdminLayout from './admin/AdminLayout.jsx'
import AchievementsPage from './admin/AchievementsPage.jsx'
import RulesPage from './admin/RulesPage.jsx'
import UserReportsPage from './admin/UserReportsPage.jsx'
import CommunityReportsPage from './admin/CommunityReportsPage.jsx'
import { TimerProvider } from './context/TimerContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { RequireAuth, RequireAdmin, GuestOnly } from './components/RouteGuards.jsx'
import FloatingTimerOverlay from './components/FloatingTimer/FloatingTimerOverlay.jsx'
import AICoach from './components/AICoach/AICoach.jsx'

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <TimerProvider>
          <div className="App">
            <Routes>
              {/* Guest-only: redirect logged-in users to their home */}
              <Route path="/" element={<GuestOnly><LandingPage /></GuestOnly>} />
              <Route path="/login" element={<GuestOnly><AuthPage /></GuestOnly>} />
              <Route path="/signup" element={<GuestOnly><AuthPage /></GuestOnly>} />

              {/* Regular authenticated users */}
              <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/community" element={<RequireAuth><CommunityPage /></RequireAuth>} />

              {/* Admin-only routes */}
              <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                <Route index element={<Navigate to="/admin/achievements" replace />} />
                <Route path="achievements" element={<AchievementsPage />} />
                <Route path="rules" element={<RulesPage />} />
                <Route path="user-reports" element={<UserReportsPage />} />
                <Route path="community-reports" element={<CommunityReportsPage />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <FloatingTimerOverlay />
            <AICoach />
          </div>
        </TimerProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
