import { useState, useEffect } from "react"
import { adminAPI } from "../../api/axios"
import { Card, StatCard, Badge, Button } from "../../components/ui/index"

export default function AdminDashboard() {
  const [summary,  setSummary]  = useState(null)
  const [breakdown,setBreakdown]= useState([])
  const [players,  setPlayers]  = useState([])
  const [dealers,  setDealers]  = useState([])
  const [games,    setGames]    = useState([])
  const [daily,    setDaily]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState("overview")
  const [gameEdits,setGameEdits]= useState({})
  const [msg,      setMsg]      = useState(null)

  const load = async () => {
    const [d, p, de, g, rev] = await Promise.all([
      adminAPI.getDashboard(),
      adminAPI.getPlayers(),
      adminAPI.getDealers(),
      adminAPI.getGames(),
      adminAPI.getDailyRevenue(14),
    ])
    setSummary(d.data.summary)
    setBreakdown(d.data.game_breakdown)
    setPlayers(p.data)
    setDealers(de.data)
    setGames(g.data)
    setDaily(rev.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const flash = (text, type = "success") => {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 3500)
  }

  const handleBanPlayer = async (id, username) => {
    if (!window.confirm(`Ban ${username}? They will lose all access.`)) return
    try {
      await adminAPI.banPlayer(id)
      flash(`${username} banned`)
      load()
    } catch (e) { flash(e.response?.data?.error || "Failed", "error") }
  }

  const handleToggleGame = async (game) => {
    try {
      await adminAPI.updateGame(game.gameid, { is_active: !game.isactive })
      flash(`${game.gamename} ${game.isactive ? "deactivated" : "activated"}`)
      load()
    } catch (e) { flash(e.response?.data?.error || "Failed", "error") }
  }

  const handleUpdateLimits = async (game) => {
    const edits = gameEdits[game.gameid]
    if (!edits) return
    try {
      await adminAPI.updateGame(game.gameid, { min_bet: edits.min, max_bet: edits.max })
      flash(`${game.gamename} limits updated`)
      setGameEdits(prev => { const n = {...prev}; delete n[game.gameid]; return n })
      load()
    } catch (e) { flash(e.response?.data?.error || "Failed", "error") }
  }

  const handleRefreshLeaderboard = async () => {
    try {
      await adminAPI.refreshLeaderboard()
      flash("Leaderboard refreshed successfully")
    } catch (e) { flash("Failed to refresh", "error") }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-casino-gold animate-pulse">Loading admin panel…</div>
    </div>
  )

  const s = summary || {}
  const tabs = ["overview", "players", "dealers", "games"]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold gold-text">Admin Dashboard</h1>
          <p className="text-casino-text-secondary text-sm mt-1">Full platform control</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefreshLeaderboard}>
          ↻ Refresh Leaderboard
        </Button>
      </div>

      {/* Flash message */}
      {msg && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${
          msg.type === "error"
            ? "bg-casino-danger/10 border border-casino-danger/30 text-casino-danger"
            : "bg-green-900/20 border border-green-700/30 text-green-400"
        }`}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
              tab === t
                ? "bg-gold-gradient text-casino-black"
                : "border border-casino-border text-casino-text-secondary hover:border-casino-gold/50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Gross Revenue" value={`₹${Number(s.gross_revenue  ?? 0).toLocaleString("en-IN")}`} />
            <StatCard label="Total Wagered" value={`₹${Number(s.total_wagered  ?? 0).toLocaleString("en-IN")}`} />
            <StatCard label="House Edge"    value={`${s.house_edge_pct ?? 0}%`}                                  />
            <StatCard label="Total Players" value={s.total_players ?? 0} sub={`${s.blocked_players ?? 0} blocked`} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Bets"   value={s.total_bets   ?? 0} />
            <StatCard label="Player Wins"  value={s.total_wins   ?? 0} />
            <StatCard label="House Wins"   value={s.total_losses ?? 0} />
            <StatCard label="Wallet Funds" value={`₹${Number(s.total_wallet_funds ?? 0).toLocaleString("en-IN")}`} />
          </div>

          {/* Game breakdown */}
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-casino-text-secondary uppercase tracking-wider mb-4">
              Revenue by Game
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {breakdown.map(g => (
                <div key={g.gamename} className="bg-casino-black border border-casino-border rounded-xl p-4">
                  <div className="font-semibold text-casino-text mb-3">{g.gamename}</div>
                  <div className="space-y-1.5 text-xs">
                    {[
                      ["Sessions",  g.sessions],
                      ["Total bets", g.total_bets],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-casino-muted">{label}</span>
                        <span className="text-casino-text">{val}</span>
                      </div>
                    ))}
                    <div className="flex justify-between">
                      <span className="text-casino-muted">Revenue</span>
                      <span className="text-casino-success font-semibold">
                        ₹{Number(g.gross_revenue).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-casino-muted">Share</span>
                      <span className="gold-text">{g.revenue_share_pct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── PLAYERS ── */}
      {tab === "players" && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-casino-text-secondary uppercase tracking-wider mb-4">
            All Players ({players.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-casino-muted text-xs uppercase border-b border-casino-border">
                  <th className="text-left pb-3">Player</th>
                  <th className="text-right pb-3">Balance</th>
                  <th className="text-right pb-3">Winnings</th>
                  <th className="text-right pb-3">Games</th>
                  <th className="text-left pb-3 pl-4">Status</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-casino-border">
                {players.map(p => (
                  <tr key={p.playerid} className="hover:bg-white/5 transition-colors">
                    <td className="py-3">
                      <div className="font-medium text-casino-text">{p.username}</div>
                      <div className="text-xs text-casino-muted">{p.email}</div>
                    </td>
                    <td className="py-3 text-right">
                      ₹{Number(p.walletbalance).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 text-right gold-text">
                      ₹{Number(p.totalwinnings).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 text-right">{p.gamesplayed}</td>
                    <td className="py-3 pl-4">
                      <Badge variant={p.blockstatus ? "danger" : "success"}>
                        {p.blockstatus ? "Banned" : "Active"}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBanPlayer(p.playerid, p.username)}
                        className="text-casino-danger hover:text-red-400"
                      >
                        {p.blockstatus ? "Unban" : "Ban"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── DEALERS ── */}
      {tab === "dealers" && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-casino-text-secondary uppercase tracking-wider mb-4">
            All Dealers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dealers.map(d => (
              <div key={d.dealerid} className="bg-casino-black border border-casino-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-casino-text">{d.firstname} {d.lastname}</div>
                    <div className="text-xs text-casino-muted">{d.email}</div>
                  </div>
                  <Badge variant={d.isavailable ? "success" : "default"}>
                    {d.isavailable ? "Online" : "Offline"}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div>
                    <div className="font-bold text-casino-text">{d.roundsconducted}</div>
                    <div className="text-casino-muted">Rounds</div>
                  </div>
                  <div>
                    <div className="font-bold text-casino-text">{d.totalbetshandled}</div>
                    <div className="text-casino-muted">Bets</div>
                  </div>
                  <div>
                    <div className="font-bold text-casino-text">
                      ₹{Number(d.totalpayouts).toLocaleString("en-IN")}
                    </div>
                    <div className="text-casino-muted">Payouts</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── GAMES ── */}
      {tab === "games" && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-casino-text-secondary uppercase tracking-wider mb-4">
            Game Configuration
          </h2>
          <div className="space-y-3">
            {games.map(g => (
              <div
                key={g.gameid}
                className="flex items-center justify-between bg-casino-black border border-casino-border rounded-xl p-4"
              >
                <div>
                  <div className="font-semibold text-casino-text">{g.gamename}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-casino-muted">Min ₹</span>
                    <input 
                      type="number"
                      className="bg-black border border-casino-border rounded px-2 py-1 text-xs w-20 text-white outline-none focus:border-casino-gold"
                      value={gameEdits[g.gameid]?.min ?? g.minbet}
                      onChange={e => setGameEdits({...gameEdits, [g.gameid]: {...(gameEdits[g.gameid]||{min: g.minbet, max: g.maxbet}), min: e.target.value}})}
                    />
                    <span className="text-xs text-casino-muted ml-2">Max ₹</span>
                    <input 
                      type="number"
                      className="bg-black border border-casino-border rounded px-2 py-1 text-xs w-24 text-white outline-none focus:border-casino-gold"
                      value={gameEdits[g.gameid]?.max ?? g.maxbet}
                      onChange={e => setGameEdits({...gameEdits, [g.gameid]: {...(gameEdits[g.gameid]||{min: g.minbet, max: g.maxbet}), max: e.target.value}})}
                    />
                    {gameEdits[g.gameid] && (
                      <Button variant="gold" size="sm" onClick={() => handleUpdateLimits(g)} className="ml-2 py-1.5 px-3 text-xs">
                        Save
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={g.isactive ? "success" : "danger"}>
                    {g.isactive ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    variant={g.isactive ? "outline" : "gold"}
                    size="sm"
                    onClick={() => handleToggleGame(g)}
                  >
                    {g.isactive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}



    </div>
  )
}
