import { useState, useEffect } from "react"
import { gameAPI } from "../api/axios"
import { Card } from "../components/ui/index"

export default function Leaderboard() {
  const [metric,  setMetric]  = useState("total_winnings")
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    gameAPI.getLeaderboard(metric)
      .then(r => setRows(r.data))
      .finally(() => setLoading(false))
  }, [metric])

  const metrics = [
    { key: "total_winnings", label: "Total Winnings" },
    { key: "net_profit",     label: "Net Profit"     },
    { key: "games_played",   label: "Games Played"   },
  ]

  const medals = ["🥇", "🥈", "🥉"]

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-fade-in">
      <h1 className="text-3xl font-bold gold-text mb-2 text-center">Rankings</h1>
      <p className="text-casino-text-secondary text-sm text-center mb-8">
        The elite players of Fortuna
      </p>

      {/* Metric tabs */}
      <div className="flex gap-2 justify-center mb-6 flex-wrap">
        {metrics.map(m => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              metric === m.key
                ? "bg-gold-gradient text-casino-black"
                : "border border-casino-border text-casino-text-secondary hover:border-casino-gold/50"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <div className="text-center py-12 text-casino-muted animate-pulse">
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-casino-muted">No data yet</div>
        ) : (
          <div className="divide-y divide-casino-border">
            {rows.map((r, i) => (
              <div
                key={r.username}
                className={`flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors ${
                  i === 0 ? "bg-casino-gold/5" : ""
                }`}
              >
                <span className="text-xl w-8 text-center font-bold text-casino-muted">
                  {medals[i] ?? `#${r.rank}`}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-casino-text truncate">{r.username}</div>
                  <div className="text-xs text-casino-muted">{r.gamesplayed} games played</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold gold-text">
                    {metric === "games_played"
                      ? r.gamesplayed
                      : `₹${Number(r.totalwinnings).toLocaleString("en-IN")}`}
                  </div>
                  <div className="text-xs text-casino-muted">{r.rewardpoints} pts</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
