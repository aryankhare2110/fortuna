import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:5001/api",
  headers: { "Content-Type": "application/json" },
})

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global error handler — redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login/player"
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  playerRegister: (data)  => api.post("/auth/player/register", data),
  playerLogin:    (data)  => api.post("/auth/player/login",    data),
  dealerLogin:    (data)  => api.post("/auth/dealer/login",    data),
  adminLogin:     (data)  => api.post("/auth/admin/login",     data),
}

// ── Player ────────────────────────────────────────────────────────────────────
export const playerAPI = {
  getProfile:     ()       => api.get("/player/profile"),
  updateProfile:  (data)   => api.patch("/player/profile", data),
  getStats:       ()       => api.get("/player/stats"),
  getBetHistory:  (page=1) => api.get(`/player/history?page=${page}`),
  deposit:        (amount) => api.post("/player/wallet/deposit",  { amount }),
  withdraw:       (amount) => api.post("/player/wallet/withdraw", { amount }),
  getTransactions:(page=1) => api.get(`/player/wallet/transactions?page=${page}`),
  redeemRewards:  (points) => api.post("/player/rewards/redeem", { points }),
}

// ── Games ─────────────────────────────────────────────────────────────────────
export const gameAPI = {
  listGames:     ()            => api.get("/game/list"),
  getGame:       (id)          => api.get(`/game/${id}`),
  getLeaderboard:(metric)      => api.get(`/game/leaderboard?metric=${metric}`),
  placeBet:      (data)        => api.post("/game/bet", data),
  getSession:    (id)          => api.get(`/game/session/${id}`),
  startSession:  (game_id)     => api.post("/game/session/start", { game_id }),
  endSession:    (id, outcome) => api.patch(`/game/session/${id}/end`, { outcome }),
}

// ── Dealer ────────────────────────────────────────────────────────────────────
export const dealerAPI = {
  getDashboard:     ()        => api.get("/dealer/dashboard"),
  getSessions:      (page=1)  => api.get(`/dealer/sessions?page=${page}`),
  getActiveSession: ()        => api.get("/dealer/sessions/active"),
  setAvailability:  (val)     => api.patch("/dealer/availability", { is_available: val }),
  banPlayer:        (id, reason) => api.post(`/dealer/ban/${id}`,   { reason }),
  unbanPlayer:      (id)         => api.post(`/dealer/unban/${id}`),
  getBanLog:        ()           => api.get("/dealer/ban-log"),
  getFlaggedPlayers:()           => api.get("/dealer/flagged-players"),
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard:     ()           => api.get("/admin/dashboard"),
  getDailyRevenue:  (days=30)    => api.get(`/admin/revenue/daily?days=${days}`),
  getRevenueByGame: ()           => api.get("/admin/revenue/by-game"),
  getPlayers:       (page=1)     => api.get(`/admin/players?page=${page}`),
  getPlayer:        (id)         => api.get(`/admin/players/${id}`),
  createPlayer:     (data)       => api.post("/admin/players", data),
  banPlayer:        (id)         => api.post(`/admin/players/${id}/ban`),
  getTopSpenders:   ()           => api.get("/admin/players/top-spenders"),
  getDealers:       ()           => api.get("/admin/dealers"),
  createDealer:     (data)       => api.post("/admin/dealers", data),
  deleteDealer:     (id)         => api.delete(`/admin/dealers/${id}`),
  getGames:         ()           => api.get("/admin/games"),
  updateGame:       (id, data)   => api.patch(`/admin/games/${id}`, data),
  getConfigLog:     (id)         => api.get(`/admin/games/${id}/config-log`),
  refreshLeaderboard: ()         => api.post("/admin/leaderboard/refresh"),
  getFullLeaderboard: (metric)   => api.get(`/admin/leaderboard?metric=${metric}`),
}