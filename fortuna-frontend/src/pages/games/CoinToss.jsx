import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { gameAPI, playerAPI } from "../../api/axios"
import { Button } from "../../components/ui/index"

const CHIPS = [10, 50, 100, 500]

export default function CoinToss() {
  const navigate = useNavigate()

  const [gameInfo,  setGameInfo]  = useState(null)
  const [profile,   setProfile]   = useState(null)
  const [choice,    setChoice]    = useState(null)   // "heads" | "tails"
  const [betAmount, setBetAmount] = useState(100)
  const [flipping,  setFlipping]  = useState(false)
  const [landed,    setLanded]    = useState(null)
  const [result,    setResult]    = useState(null)
  const [flipClass, setFlipClass] = useState("")
  const [error,     setError]     = useState("")

  useEffect(() => {
    gameAPI.listGames().then(r => setGameInfo(r.data.find(g => g.gamename === "Coin Toss")))
    playerAPI.getProfile().then(r => setProfile(r.data))
  }, [])

  const toss = async () => {
    if (!choice)   { setError("Pick Heads or Tails first"); return }
    if (!gameInfo) return
    const amt = Number(betAmount)
    if (isNaN(amt) || amt <= 0) {
      setError("Please enter a valid bet amount"); return;
    }
    if (amt < Number(gameInfo.minbet)) {
      setError(`Minimum bet is ₹${Number(gameInfo.minbet).toLocaleString("en-IN")}`); return;
    }
    if (amt > Number(gameInfo.maxbet)) {
      setError(`Maximum bet is ₹${Number(gameInfo.maxbet).toLocaleString("en-IN")}`); return;
    }
    if (amt > Number(profile?.walletbalance || 0)) {
      setError("Insufficient wallet balance"); return;
    }
    setError(""); setFlipping(true); setLanded(null); setResult(null)

    // Flip animation loop
    for (let i = 0; i < 5; i++) {
      setFlipClass("animate-flip")
      await new Promise(r => setTimeout(r, 400))
      setFlipClass("")
      await new Promise(r => setTimeout(r, 50))
    }

    const outcome = Math.random() < 0.5 ? "heads" : "tails"
    const won     = outcome === choice
    const payout  = won ? Number(betAmount) * 2 : 0

    setLanded(outcome)
    setFlipClass("")
    setFlipping(false)

    try {
      const sess = await gameAPI.startSession(gameInfo.gameid)
      await gameAPI.placeBet({
        session_id: sess.data.sessionid,
        amount:     Number(betAmount),
        result:     won ? "win" : "loss",
        payout,
      })
      await gameAPI.endSession(sess.data.sessionid, won ? "player_win" : "dealer_win")
      const updated = await playerAPI.getProfile()
      setProfile(updated.data)
      setResult({
        outcome: won ? "win" : "loss",
        payout,
        message: won ? "Correct! You win!" : `It's ${outcome}. Better luck next time.`
      })
    } catch (e) {
      setError(e.response?.data?.error || "Failed to record bet")
    }
  }

  const reset = () => {
    setLanded(null); setResult(null); setChoice(null); setError("")
  }

  // Coin face
  const coinFace = flipping ? "🪙"
    : landed === "heads" ? "👑"
    : landed === "tails" ? "★"
    : "🪙"

  return (
    <div className="min-h-[88vh] felt-bg flex flex-col items-center py-8 px-4">

      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-md mb-8">
        <button onClick={() => navigate("/games")} className="text-casino-text-secondary hover:text-casino-gold text-sm transition-colors">
          ← Back
        </button>
        <h1 className="text-2xl font-bold gold-text">Coin Toss</h1>
        <div className="text-right text-sm">
          <div className="text-casino-muted text-xs">Balance</div>
          <div className="font-bold text-casino-text">
            ₹{Number(profile?.walletbalance ?? 0).toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-2 bg-casino-danger/20 border border-casino-danger/40 rounded-lg text-casino-danger text-sm">
          {error}
        </div>
      )}

      {/* Premium Coin */}
      <div className="relative mb-12" style={{ perspective: '1000px' }}>
        <div className={`w-40 h-40 relative rounded-full ${flipClass}`} style={{ transformStyle: 'preserve-3d' }}>
          
          {/* Coin Body (Thickness + Gradients) */}
          <div className="absolute inset-0 rounded-full border-8 border-yellow-400/90 shadow-[0_15px_35px_rgba(234,179,8,0.5),inset_0_0_20px_rgba(161,98,7,0.8)] bg-gradient-to-br from-yellow-200 via-yellow-500 to-yellow-800 flex items-center justify-center">
            {/* Inner Etched Ring */}
            <div className="absolute inset-2 rounded-full border-[2px] border-yellow-300/60 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] bg-gradient-to-tr from-yellow-600 via-yellow-400 to-amber-200 flex items-center justify-center">
              {/* Coin Icon/Face */}
              <span className="text-6xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)] filter pb-1">
                {coinFace}
              </span>
            </div>
          </div>

        </div>
        
        {landed && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-black gold-text uppercase tracking-widest whitespace-nowrap animate-fade-in bg-black/60 px-4 py-1.5 rounded-full border border-yellow-500/30">
            {landed}
          </div>
        )}
      </div>

      {/* Result banner */}
      {result && (
        <div className={`mb-4 py-3 px-8 rounded-2xl font-bold text-lg shadow-2xl animate-fade-in text-center z-10 relative ${
          result.outcome === "win"
            ? "bg-green-900 text-white border-2 border-green-500"
            : "bg-red-900   text-white border-2 border-red-500"
        }`}>
          {result.message}
          {result.outcome === "win" && (
            <div className="text-sm font-normal mt-1">+₹{Number(result.payout).toLocaleString("en-IN")}</div>
          )}
        </div>
      )}

      {/* Heads / Tails choice */}
      {!result && (
        <div className="flex gap-4 mb-6">
          {["heads","tails"].map(side => (
            <button
              key={side}
              onClick={() => setChoice(side)}
              disabled={flipping}
              className={`w-28 py-3 rounded-xl font-bold capitalize transition-all ${
                choice === side
                  ? "bg-gold-gradient text-casino-black shadow-gold"
                  : "border border-casino-border text-casino-text-secondary hover:border-casino-gold/50"
              }`}
            >
              {side === "heads" ? "👑 Heads" : "★ Tails"}
            </button>
          ))}
        </div>
      )}

      {/* Chips & Custom Bet */}
      {!result && (
        <div className="flex flex-col items-center gap-4 mb-3">
          <div className="flex gap-3 flex-wrap justify-center">
            {CHIPS.map(c => (
              <button
                key={c}
                onClick={() => setBetAmount(c)}
                disabled={flipping}
                className={`chip text-xs ${betAmount === c
                  ? "bg-casino-gold text-casino-black border-casino-gold shadow-gold"
                  : "bg-casino-card text-casino-text border-casino-border"
                }`}
              >
                {c >= 1000 ? `${c/1000}k` : c}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-white/10 shadow-inner">
            <span className="text-[11px] text-casino-text-secondary uppercase tracking-widest font-bold">Custom</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-casino-gold font-bold">₹</span>
              <input 
                type="number" 
                disabled={flipping}
                className="bg-black/60 border border-white/20 rounded-lg pl-8 pr-3 py-1.5 text-white w-28 font-bold outline-none focus:border-casino-gold hover:border-white/40 transition-colors disabled:opacity-50"
                value={betAmount === 0 ? "" : betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Action */}
      <div className="flex gap-3 justify-center mt-6">
        {!result
          ? <Button variant="gold" size="lg" onClick={toss} loading={flipping} disabled={!choice}>
              {flipping ? "Flipping…" : `Toss — ₹${betAmount.toLocaleString("en-IN")}`}
            </Button>
          : <Button variant="gold" size="lg" onClick={reset}>Toss Again</Button>
        }
      </div>

      <p className="mt-6 text-casino-muted text-xs">50 / 50 odds · 2× payout on win</p>
    </div>
  )
}
