import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { playerAPI } from "../../api/axios"
import { Card, StatCard, Badge, Button, GoldDivider } from "../../components/ui/index"

export default function PlayerDashboard() {
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      playerAPI.getProfile(),
      playerAPI.getStats()
    ])
      .then(([profRes, statsRes]) => {
        setProfile(profRes.data)
        setStats(statsRes.data)
      })
      .catch(err => console.error("Error loading dashboard", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <svg className="animate-spin h-10 w-10 text-casino-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-casino-gold">Welcome back, {profile?.username}</h1>
          <p className="text-casino-text-secondary mt-1">Ready to test your luck today?</p>
        </div>
        <div className="text-right">
          <Badge variant="gold" className="text-lg py-1 px-3">
            ₹{Number(profile?.walletbalance || 0).toLocaleString("en-IN")}
          </Badge>
          <div className="text-xs text-casino-muted mt-1">Available Balance</div>
        </div>
      </div>

      {/* Action shortcuts */}
      <div className="flex gap-4 mb-8">
        <Link to="/games">
          <Button variant="gold" size="lg">Play Games</Button>
        </Link>
        <Link to="/player/wallet">
          <Button variant="outline" size="lg">Manage Wallet</Button>
        </Link>
      </div>

      <GoldDivider />

      {/* Quick Stats */}
      <h2 className="text-xl font-bold text-casino-text mb-4 mt-6">Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Games Played" value={profile?.gamesplayed} icon={<svg className="w-5 h-5 text-casino-gold opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Total Winnings" value={`₹${Number(profile?.totalwinnings).toLocaleString("en-IN")}`} icon={<svg className="w-5 h-5 text-casino-gold opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Reward Points" value={profile?.rewardpoints} icon={<svg className="w-5 h-5 text-casino-gold opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>} />
        <StatCard label="Net Profit" value={`₹${Number(stats?.overall?.net_profit || 0).toLocaleString("en-IN")}`} icon={<svg className="w-5 h-5 text-casino-gold opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
      </div>

      {/* Detailed Stats */}
      {stats?.overall?.total_bets > 0 && (
        <>
          <h2 className="text-xl font-bold text-casino-text mb-4">Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 border border-white/10">
              <h3 className="text-lg text-casino-text-secondary mb-4">Betting Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Bets</span>
                  <span className="font-bold">{stats.overall.total_bets}</span>
                </div>
                <div className="flex justify-between">
                  <span>Wins / Losses / Draws</span>
                  <span className="font-bold text-casino-gold">{stats.overall.wins} / {stats.overall.losses} / {stats.overall.draws}</span>
                </div>
                <div className="flex justify-between">
                  <span>Win Rate</span>
                  <span className="font-bold text-green-400">{stats.overall.win_rate_pct}%</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-white/10">
              <h3 className="text-lg text-casino-text-secondary mb-4">Financials</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Wagered</span>
                  <span className="font-bold">₹{Number(stats.overall.total_wagered).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Bet Size</span>
                  <span className="font-bold">₹{Number(stats.overall.avg_bet_size).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Biggest Payout</span>
                  <span className="font-bold text-casino-gold">₹{Number(stats.overall.biggest_payout).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
