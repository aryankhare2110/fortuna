import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { gameAPI, playerAPI } from "../../api/axios"
import { Card, Badge } from "../../components/ui/index"

const GAME_ROUTES = {
  "Blackjack": "/games/blackjack",
  "Roulette":  "/games/roulette",
  "Coin Toss": "/games/cointoss",
}

const GAME_GRADIENTS = {
  "Blackjack": "from-slate-900 via-blue-950 to-black",
  "Roulette":  "from-slate-900 via-rose-950 to-black",
  "Coin Toss": "from-slate-900 via-yellow-950 to-black",
}

const GAME_DESC = {
  "Blackjack": "Beat the dealer to 21",
  "Roulette":  "Spin the wheel of fate",
  "Coin Toss": "Fifty-fifty. Simple.",
}

export default function GameLobby() {
  const [games,   setGames]   = useState([])
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    gameAPI.listGames().then(r => setGames(r.data))
    playerAPI.getProfile().then(r => setProfile(r.data))
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold gold-text">Game Lobby</h1>
          <p className="text-casino-text-secondary text-sm mt-1">Choose your game</p>
        </div>
        {profile && (
          <div className="text-right">
            <div className="text-xs text-casino-muted">Balance</div>
            <div className="font-bold text-casino-text">
              ₹{Number(profile.walletbalance).toLocaleString("en-IN")}
            </div>
          </div>
        )}
      </div>

      {/* Game cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {games.map(g => (
          <Link key={g.gameid} to={GAME_ROUTES[g.gamename] || "/games"}>
            <Card className={`p-8 hover:border-casino-gold/40 transition-colors duration-300 cursor-pointer group h-[350px] sm:h-[400px] flex flex-col justify-between bg-gradient-to-b ${GAME_GRADIENTS[g.gamename] || 'from-gray-900 to-black'} border-white/10`}>
              <div className="pt-4">
                <h2 className="text-2xl lg:text-3xl font-black text-white tracking-wide uppercase mb-3 drop-shadow-md">{g.gamename}</h2>
                <div className="w-12 h-1 bg-casino-gold mb-4 opactiy-80"></div>
                <p className="text-casino-text-secondary text-sm sm:text-base font-light tracking-wide opacity-90">
                  {GAME_DESC[g.gamename]}
                </p>
              </div>
              
              <div className="flex flex-col gap-4">
                <div className="w-full h-[1px] bg-white/10 mb-2"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-casino-muted uppercase tracking-widest font-semibold">Min Bet</span>
                  <span className="text-sm font-bold text-white tracking-wider">₹{Number(g.minbet).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-casino-muted uppercase tracking-widest font-semibold">Max Bet</span>
                  <span className="text-sm font-bold text-white tracking-wider">₹{Number(g.maxbet).toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-4 w-full bg-white/5 border border-white/10 py-3.5 rounded-lg text-center text-sm font-bold text-casino-gold group-hover:bg-white/10 transition-colors uppercase tracking-widest">
                  Play
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
