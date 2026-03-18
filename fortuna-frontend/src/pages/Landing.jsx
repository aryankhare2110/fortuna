import { Link, Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function Landing() {
  const { user } = useAuth()

  if (user) {
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />
    if (user.role === "dealer") return <Navigate to="/dealer/dashboard" replace />
    return <Navigate to="/player/dashboard" replace />
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[88vh] px-4 text-center">

      {/* Hero */}
      <div className="animate-fade-in">
        <div className="text-6xl mb-6 select-none tracking-widest">♠ ♥ ♦ ♣</div>
        <h1 className="text-5xl md:text-7xl font-bold mb-4">
          <span className="gold-text">FORTUNA</span>
        </h1>
        <p className="text-casino-text-secondary text-sm md:text-base max-w-[95vw] sm:max-w-lg mx-auto mb-10 whitespace-nowrap overflow-hidden text-ellipsis px-2">
          The house always wins but today, fortune favours the bold.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
          <Link
            to="/register"
            className="bg-gold-gradient text-casino-black font-bold px-10 py-3 rounded-xl text-lg hover:shadow-gold-lg transition-all"
          >
            Play Now
          </Link>
          <Link
            to="/leaderboard"
            className="border border-casino-gold text-casino-gold font-semibold px-8 py-3 rounded-xl text-lg hover:bg-casino-gold/10 transition-all"
          >
            Leaderboard
          </Link>
        </div>
      </div>

      {/* Gold divider */}
      <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-casino-gold/40 to-transparent my-10" />

      {/* Game previews */}
      <div className="grid grid-cols-3 gap-4 max-w-xl w-full">
        {[
          { icon: "🃏", name: "Blackjack", desc: "Beat the dealer to 21" },
          { icon: "🎰", name: "Roulette",  desc: "Spin the wheel of fate" },
          { icon: "🪙", name: "Coin Toss", desc: "Fifty-fifty. Simple."  },
        ].map((g) => (
          <div
            key={g.name}
            className="bg-casino-card border border-casino-border rounded-xl p-4 hover:border-casino-gold/50 transition-colors"
          >
            <div className="text-3xl mb-2">{g.icon}</div>
            <div className="font-semibold text-casino-text text-sm">{g.name}</div>
            <div className="text-casino-muted text-xs mt-1">{g.desc}</div>
          </div>
        ))}
      </div>

      {/* Dealer / admin links */}
      <div className="flex gap-6 mt-10 text-xs text-casino-muted">
        <Link to="/login/dealer" className="hover:text-casino-gold transition-colors">
          Dealer login
        </Link>
        <Link to="/login/admin" className="hover:text-casino-gold transition-colors">
          Admin login
        </Link>
      </div>

    </div>
  )
}
