import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider }   from "./context/AuthContext"
import Navbar             from "./components/navbar"
import ProtectedRoute     from "./components/ProtectedRoute"

import Landing            from "./pages/Landing"
import Leaderboard        from "./pages/Leaderboard"

import PlayerLogin        from "./pages/player/Login"
import DealerLogin        from "./pages/dealer/Login"
import AdminLogin         from "./pages/admin/Login"
import PlayerRegister     from "./pages/player/Register"

import PlayerDashboard    from "./pages/player/Dashboard"
import PlayerWallet       from "./pages/player/Wallet"

import GameLobby          from "./pages/games/GameLobby"
import Blackjack          from "./pages/games/Blackjack"
import Roulette           from "./pages/games/Roulette"
import CoinToss           from "./pages/games/CoinToss"

import DealerDashboard    from "./pages/dealer/Dashboard"
import AdminDashboard     from "./pages/admin/Dashboard"

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-casino-black">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public */}
              <Route path="/"            element={<Landing />} />
              <Route path="/leaderboard" element={<Leaderboard />} />

              {/* Auth */}
              <Route path="/login/player" element={<PlayerLogin />} />
              <Route path="/login/dealer" element={<DealerLogin />} />
              <Route path="/login/admin"  element={<AdminLogin />} />
              <Route path="/register"     element={<PlayerRegister />} />

              {/* Player */}
              <Route path="/player/dashboard" element={
                <ProtectedRoute allowedRole="player"><PlayerDashboard /></ProtectedRoute>
              }/>
              <Route path="/player/wallet" element={
                <ProtectedRoute allowedRole="player"><PlayerWallet /></ProtectedRoute>
              }/>

              {/* Games */}
              <Route path="/games" element={
                <ProtectedRoute allowedRole="player"><GameLobby /></ProtectedRoute>
              }/>
              <Route path="/games/blackjack" element={
                <ProtectedRoute allowedRole="player"><Blackjack /></ProtectedRoute>
              }/>
              <Route path="/games/roulette" element={
                <ProtectedRoute allowedRole="player"><Roulette /></ProtectedRoute>
              }/>
              <Route path="/games/cointoss" element={
                <ProtectedRoute allowedRole="player"><CoinToss /></ProtectedRoute>
              }/>

              {/* Dealer */}
              <Route path="/dealer/dashboard" element={
                <ProtectedRoute allowedRole="dealer"><DealerDashboard /></ProtectedRoute>
              }/>

              {/* Admin */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>
              }/>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
