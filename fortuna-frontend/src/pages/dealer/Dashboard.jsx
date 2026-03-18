import { useState, useEffect } from "react"
import { dealerAPI } from "../../api/axios"
import { Card, StatCard, Badge, Button, GoldDivider } from "../../components/ui/index"

export default function DealerDashboard() {
  const [data,      setData]      = useState(null)
  const [flagged,   setFlagged]   = useState([])
  const [banLog,    setBanLog]    = useState([])
  const [banReason, setBanReason] = useState({})
  const [msg,       setMsg]       = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState("sessions")

  const load = () => {
    Promise.all([
      dealerAPI.getDashboard(),
      dealerAPI.getFlaggedPlayers(),
      dealerAPI.getBanLog(),
    ]).then(([d, f, b]) => {
      setData(d.data)
      setFlagged(f.data)
      setBanLog(b.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const flash = (text, type = "success") => {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 3500)
  }

  const handleBan = async (playerId, username) => {
    const reason = banReason[playerId]?.trim()
    if (!reason) { flash("Enter a reason before banning", "error"); return }
    try {
      await dealerAPI.banPlayer(playerId, reason)
      flash(`${username} has been banned`)
      load()
    } catch (e) { flash(e.response?.data?.error || "Failed", "error") }
  }

  const handleUnban = async (playerId, username) => {
    try {
      await dealerAPI.unbanPlayer(playerId)
      flash(`${username} has been unbanned`)
      load()
    } catch (e) { flash(e.response?.data?.error || "Failed", "error") }
  }

  const handleToggleAvailability = async () => {
    try {
      await dealerAPI.setAvailability(!data.summary.isavailable)
      load()
    } catch (e) { flash("Failed to update availability", "error") }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-casino-gold animate-pulse">Loading dashboard…</div>
    </div>
  )

  const s = data?.summary || {}

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-casino-text">
            Dealer: <span className="gold-text">{s.firstname} {s.lastname}</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={s.isavailable ? "success" : "danger"}>
              {s.isavailable ? "Available" : "Unavailable"}
            </Badge>
          </div>
        </div>
        <Button
          variant={s.isavailable ? "outline" : "gold"}
          onClick={handleToggleAvailability}
        >
          {s.isavailable ? "Go Offline" : "Go Online"}
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Rounds Conducted" value={s.roundsconducted   ?? 0} icon={<svg className="w-5 h-5 text-casino-gold opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Total Bets"        value={s.totalbetshandled ?? 0} icon={<svg className="w-5 h-5 text-casino-gold opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} />
        <StatCard
          label="Total Payouts"
          value={`₹${Number(s.totalpayouts ?? 0).toLocaleString("en-IN")}`}
          icon={<svg className="w-5 h-5 text-casino-gold opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["sessions", "flagged", "ban-log"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
              tab === t
                ? "bg-gold-gradient text-casino-black"
                : "border border-casino-border text-casino-text-secondary hover:border-casino-gold/50"
            }`}
          >
            {t.replace("-", " ")}
            {t === "flagged" && flagged.length > 0 && (
              <span className="ml-2 bg-casino-danger text-white text-xs rounded-full px-1.5 py-0.5">
                {flagged.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Sessions tab ── */}
      {tab === "sessions" && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-casino-text-secondary uppercase tracking-wider mb-4">
            Recent Sessions
          </h2>
          {!data?.recent_sessions?.length ? (
            <p className="text-casino-muted text-sm py-4 text-center">No sessions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-casino-muted text-xs uppercase border-b border-casino-border">
                    <th className="text-left pb-3">Game</th>
                    <th className="text-left pb-3">Date</th>
                    <th className="text-right pb-3">Bets</th>
                    <th className="text-right pb-3">Wagered</th>
                    <th className="text-right pb-3">House profit</th>
                    <th className="text-left pb-3 pl-4">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-casino-border">
                  {data.recent_sessions.map(s => (
                    <tr key={s.sessionid} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 font-medium text-casino-text">{s.gamename}</td>
                      <td className="py-3 text-casino-muted">
                        {new Date(s.starttime).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3 text-right">{s.bet_count}</td>
                      <td className="py-3 text-right">
                        ₹{Number(s.total_wagered).toLocaleString("en-IN")}
                      </td>
                      <td className={`py-3 text-right font-semibold ${
                        Number(s.house_profit) >= 0 ? "text-casino-success" : "text-casino-danger"
                      }`}>
                        ₹{Number(s.house_profit).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 pl-4">
                        <Badge variant={
                          s.outcome === "player_win" ? "success" :
                          s.outcome === "dealer_win" ? "danger"  : "warning"
                        }>
                          {s.outcome?.replace("_", " ") ?? "—"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── Flagged tab ── */}
      {tab === "flagged" && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-casino-text-secondary uppercase tracking-wider mb-4">
            Suspicious Activity
          </h2>
          {flagged.length === 0 ? (
            <p className="text-casino-muted text-sm py-4 text-center">No flagged players</p>
          ) : (
            <div className="space-y-4">
              {flagged.map(f => (
                <div
                  key={`${f.playerid}-${f.sessionid}`}
                  className="bg-casino-black border border-casino-border rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-casino-text">{f.username}</span>
                      <Badge variant={f.blockstatus ? "danger" : "warning"}>
                        {f.blockstatus ? "Banned" : "Active"}
                      </Badge>
                    </div>
                    <div className="text-xs text-casino-muted mt-1">
                      {f.bet_count} bets (Wagered: ₹{Number(f.total_wagered).toLocaleString("en-IN")}) in session #{f.sessionid}
                      {Number(f.total_payout) > 5000 && <span className="text-casino-danger ml-2 font-bold">· High Payout</span>}
                    </div>
                    {f.ban_reason && (
                      <div className="text-xs text-casino-danger mt-1">
                        Ban reason: {f.ban_reason}
                      </div>
                    )}
                  </div>
                  {!f.blockstatus ? (
                    <div className="flex gap-2 items-center">
                      <input
                        className="bg-casino-card border border-casino-border rounded-lg px-3 py-1.5 text-sm text-casino-text outline-none focus:border-casino-gold placeholder:text-casino-muted"
                        placeholder="Reason for ban"
                        value={banReason[f.playerid] || ""}
                        onChange={e => setBanReason(r => ({ ...r, [f.playerid]: e.target.value }))}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleBan(f.playerid, f.username)}
                      >
                        Ban
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleUnban(f.playerid, f.username)}
                    >
                      Unban
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Ban log tab ── */}
      {tab === "ban-log" && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-casino-text-secondary uppercase tracking-wider mb-4">
            Ban / Unban History
          </h2>
          {banLog.length === 0 ? (
            <p className="text-casino-muted text-sm py-4 text-center">No actions yet</p>
          ) : (
            <div className="divide-y divide-casino-border">
              {banLog.map((l, i) => (
                <div key={i} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-casino-text">{l.username}</span>
                      <Badge variant={l.action === "ban" ? "danger" : "success"}>
                        {l.action.toUpperCase()}
                      </Badge>
                    </div>
                    {l.reason && (
                      <div className="text-xs text-casino-muted mt-1">{l.reason}</div>
                    )}
                  </div>
                  <div className="text-xs text-casino-muted shrink-0">
                    {new Date(l.actiontime).toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
