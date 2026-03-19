import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { gameAPI, playerAPI } from "../../api/axios"
import { Button, Badge } from "../../components/ui/index"

const RED_NUMS   = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36])
const BLACK_NUMS = new Set([2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35])
const WHEEL      = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26]

const BET_TYPES = [
  { key: "red",   label: "Red",    payout: 2, check: n => RED_NUMS.has(n)              },
  { key: "black", label: "Black",  payout: 2, check: n => BLACK_NUMS.has(n)            },
  { key: "even",  label: "Even",   payout: 2, check: n => n !== 0 && n % 2 === 0       },
  { key: "odd",   label: "Odd",    payout: 2, check: n => n !== 0 && n % 2 !== 0       },
  { key: "low",   label: "1–18",   payout: 2, check: n => n >= 1  && n <= 18           },
  { key: "high",  label: "19–36",  payout: 2, check: n => n >= 19 && n <= 36           },
]

const CHIPS = [25, 100, 500, 1000]

function numTextColor(n) {
  if (n === 0)          return "text-green-400"
  if (RED_NUMS.has(n))  return "text-red-400"
  return                       "text-casino-text"
}

export default function Roulette() {
  const navigate  = useNavigate()
  const wheelRef  = useRef(null)

  const [gameInfo,  setGameInfo]  = useState(null)
  const [profile,   setProfile]   = useState(null)
  const [betType,   setBetType]   = useState(null)
  const [betAmount, setBetAmount] = useState(100)
  const [spinning,  setSpinning]  = useState(false)
  const [landed,    setLanded]    = useState(null)
  const [result,    setResult]    = useState(null)
  const [error,     setError]     = useState("")

  useEffect(() => {
    gameAPI.listGames().then(r => setGameInfo(r.data.find(g => g.gamename === "Roulette")))
    playerAPI.getProfile().then(r => setProfile(r.data))
  }, [])

  const spin = async () => {
    if (!betType) { setError("Select a bet type first"); return }
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
    setError(""); setSpinning(true); setLanded(null); setResult(null)

    const num    = WHEEL[Math.floor(Math.random() * WHEEL.length)]
    const betObj = BET_TYPES.find(b => b.key === betType)
    const won    = betObj.check(num)
    const payout = won ? Number(betAmount) * betObj.payout : 0
    const outcome = won ? "win" : "loss"

    // Spin animation
    if (wheelRef.current) {
      const idx        = WHEEL.indexOf(num)
      const degPerSlot = 360 / WHEEL.length
      const targetDeg  = 360 * 6 - (idx * degPerSlot)
      wheelRef.current.style.transition = "transform 3.5s cubic-bezier(0.17,0.67,0.35,1)"
      wheelRef.current.style.transform  = `rotate(${targetDeg}deg)`
    }

    await new Promise(r => setTimeout(r, 3700))
    setLanded(num); setSpinning(false)

    try {
      const sess = await gameAPI.startSession(gameInfo.gameid)
      await gameAPI.placeBet({ session_id: sess.data.sessionid, amount: Number(betAmount), result: outcome, payout })
      await gameAPI.endSession(sess.data.sessionid, won ? "player_win" : "dealer_win")
      const updated = await playerAPI.getProfile()
      setProfile(updated.data)
      setResult({ outcome, payout, num, message: won ? `${num} — You win!` : `${num} — Better luck next time.` })
    } catch (e) { setError(e.response?.data?.error || "Failed to record bet") }
  }

  const reset = () => {
    setLanded(null); setResult(null)
    if (wheelRef.current) {
      wheelRef.current.style.transition = "none"
      wheelRef.current.style.transform  = "rotate(0deg)"
    }
  }

  return (
    <div className="min-h-[88vh] felt-bg flex flex-col items-center py-2 px-2 sm:px-4">

      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-2xl mb-3">
        <button onClick={() => navigate("/games")} className="text-casino-text-secondary hover:text-casino-gold text-sm transition-colors">
          ← Back
        </button>
        <h1 className="text-2xl font-bold gold-text">Roulette</h1>
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

      {/* Premium Wheel */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 mt-8 mb-10 sm:mt-10 sm:mb-12 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-full perspective-[1000px]">
        {/* Outer wood/gold bezel */}
        <div className="absolute inset-[-16px] rounded-full border-[10px] border-[#4a2406] bg-[#3a1d04] shadow-[inset_0_0_30px_rgba(0,0,0,1),0_10px_20px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 rounded-full border-[2px] border-yellow-600/50"></div>
        </div>

        {/* The Spinner */}
        <div
          ref={wheelRef}
          className="relative w-full h-full rounded-full overflow-hidden bg-black shadow-[inset_0_0_40px_rgba(0,0,0,1)]"
        >
          {WHEEL.map((n, i) => {
            const angle = (i / 37) * 360;
            return (
              <div
                key={n}
                className="absolute top-0 left-1/2 origin-bottom flex justify-center pt-1.5 sm:pt-2 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] box-border"
                style={{
                  width: '8.8%', 
                  marginLeft: '-4.4%',
                  height: '50%',
                  transform: `rotate(${angle}deg)`,
                  backgroundColor: n === 0 ? '#166534' : RED_NUMS.has(n) ? '#B91C1C' : '#111827',
                  borderRight: '1px solid rgba(255,255,255,0.15)',
                  borderLeft: '1px solid rgba(0,0,0,0.3)'
                }}
              >
                <span className="text-[10px] sm:text-[12px] font-black text-white/90 drop-shadow-md">{n}</span>
              </div>
            )
          })}
          
          {/* Inner metallic dome */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45%] h-[45%] rounded-full border-[6px] border-yellow-700/90 shadow-[0_0_30px_rgba(0,0,0,0.9),inset_0_0_15px_rgba(255,255,255,0.4)] bg-gradient-to-tr from-gray-800 via-gray-300 to-gray-900 z-10 flex items-center justify-center">
            {/* Spinning decorative spokes */}
            <div className="w-1/2 h-1/2 rounded-full border-[3px] border-yellow-600/70 flex items-center justify-center rotate-45 shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
              <div className="w-1 h-full bg-yellow-600/60 rounded-full"></div>
              <div className="w-full h-1 bg-yellow-600/60 absolute rounded-full"></div>
            </div>
          </div>
        </div>

        {/* The pointer at the top */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 drop-shadow-xl">
          <div className="w-7 h-9 bg-gradient-to-b from-yellow-200 to-yellow-600 border border-yellow-100" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>
        </div>

        {/* Center Display Badge */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/90 border border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.4)] flex items-center justify-center backdrop-blur-md">
            {landed !== null
              ? <span className={`text-2xl font-black filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] ${numTextColor(landed)}`}>{landed}</span>
              : <span className="text-casino-muted text-sm font-bold">{spinning ? "..." : "?"}</span>
            }
          </div>
        </div>
      </div>

      {/* Result banner */}
      {result && (
        <div className={`mb-3 py-2 px-8 rounded-2xl font-bold text-base shadow-2xl animate-fade-in text-center z-10 ${
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

      {/* Betting Controls Dashboard */}
      <div className="w-full max-w-md bg-black/40 rounded-3xl border border-white/10 p-4 sm:p-5 flex flex-col gap-5 shadow-2xl relative z-20">
        
        {/* Bet Types Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
          {BET_TYPES.map(b => (
            <button
              key={b.key}
              onClick={() => setBetType(b.key)}
              disabled={spinning}
              className={`py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all shadow-md ${
                betType === b.key
                  ? b.key === "red"   ? "bg-red-600  text-white border-2 border-red-400"
                  : b.key === "black" ? "bg-gray-900 text-white border-2 border-white/40"
                  :                    "bg-gold-gradient text-casino-black border-2 border-yellow-300"
                  : "bg-black/40 border-2 border-white/20 text-casino-text-secondary hover:border-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Chips & Input Panel */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/50 p-3 sm:p-4 rounded-2xl border border-white/5 shadow-inner">
          
          <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
            {CHIPS.map(c => (
              <button
                key={c}
                onClick={() => setBetAmount(c)}
                disabled={spinning}
                className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full font-black text-xs sm:text-sm border-[3px] shadow-lg transition-transform active:scale-95 ${betAmount === c
                  ? "bg-gradient-to-br from-yellow-300 to-yellow-600 text-casino-black border-yellow-200 scale-110"
                  : "bg-gradient-to-br from-gray-800 to-black text-white border-gray-600 hover:border-gray-400"
                }`}
              >
                {c >= 1000 ? `${c/1000}k` : c}
              </button>
            ))}
          </div>
            
          <div className="relative w-full sm:w-32 shrink-0">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-casino-gold font-bold text-lg">₹</span>
            <input 
              type="number" 
              disabled={spinning}
              className="bg-black/80 border-2 border-white/20 rounded-xl pl-9 pr-2 py-2.5 text-white w-full font-bold outline-none focus:border-casino-gold hover:border-white/40 transition-colors text-sm disabled:opacity-50 text-center shadow-inner"
              value={betAmount === 0 ? "" : betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
            />
          </div>

        </div>

        {/* Action Button */}
        <div className="mt-1">
          {!result
            ? <Button variant="gold" className="w-full py-4 text-lg tracking-widest uppercase font-black shadow-xl" onClick={spin} loading={spinning} disabled={!betType}>
                {spinning ? "Spinning…" : `Spin — ₹${Number(betAmount).toLocaleString("en-IN")}`}
              </Button>
            : <Button variant="gold" className="w-full py-4 text-lg tracking-widest uppercase font-black shadow-xl" onClick={reset}>Spin Again</Button>
          }
        </div>

      </div>

      {betType && !spinning && !result && (
        <p className="mt-3 text-casino-muted text-xs text-center">
          Betting ₹{betAmount.toLocaleString("en-IN")} on <strong className="text-casino-text">{betType}</strong> · 2× payout
        </p>
      )}
    </div>
  )
}
