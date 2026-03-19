import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { gameAPI, playerAPI } from "../../api/axios"
import { Button, Card } from "../../components/ui/index"

// ── Deck helpers ──────────────────────────────────────────────
const SUITS  = ["♠","♥","♦","♣"]
const VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"]
const RED    = new Set(["♥","♦"])

function buildDeck() {
  const deck = []
  for (const suit of SUITS)
    for (const val of VALUES)
      deck.push({ suit, val })
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

function cardValue(card) {
  if (["J","Q","K"].includes(card.val)) return 10
  if (card.val === "A") return 11
  return parseInt(card.val)
}

function handTotal(hand) {
  let total = hand.reduce((s, c) => s + cardValue(c), 0)
  let aces  = hand.filter(c => c.val === "A").length
  while (total > 21 && aces > 0) { total -= 10; aces-- }
  return total
}

// ── Playing card ──────────────────────────────────────────────
function PlayingCard({ card, hidden = false, delay = 0 }) {
  const style = { animationDelay: `${delay}ms` }
  if (hidden) return <div className="playing-card back animate-deal" style={style} />
  return (
    <div className={`playing-card ${RED.has(card.suit) ? "red" : "black"} animate-deal`} style={style}>
      <div className="leading-none">{card.val}<br />{card.suit}</div>
      <div className="text-lg text-center leading-none">{card.suit}</div>
      <div className="leading-none self-end rotate-180">{card.val}<br />{card.suit}</div>
    </div>
  )
}

function Hand({ cards, label, total, hideSecond = false, delayBase = 0 }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs text-casino-text-secondary uppercase tracking-wider h-4">{label}</div>
      <div className="flex gap-2 flex-wrap justify-center min-h-[6rem] sm:min-h-[7rem]">
        {cards.map((c, i) => (
          <PlayingCard key={`${c.val}-${c.suit}-${i}`} card={c} hidden={hideSecond && i === 1} delay={(delayBase + i) * 150} />
        ))}
      </div>
      {!hideSecond ? (
        <div className="text-sm font-bold text-casino-gold h-5 block">{total}</div>
      ) : (
        <div className="h-5 block"></div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
const STATES = { IDLE: "idle", PLAYING: "playing", DONE: "done" }
const CHIPS  = [50, 100, 500, 1000]

export default function Blackjack() {
  const navigate = useNavigate()
  const [gameInfo,  setGameInfo]  = useState(null)
  const [session,   setSession]   = useState(null)
  const [profile,   setProfile]   = useState(null)
  const [deck,      setDeck]      = useState([])
  const [player,    setPlayer]    = useState([])
  const [dealer,    setDealer]    = useState([])
  const [betAmount, setBetAmount] = useState(100)
  const [gameState, setGameState] = useState(STATES.IDLE)
  const [result,    setResult]    = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState("")

  useEffect(() => {
    gameAPI.listGames().then(r => setGameInfo(r.data.find(g => g.gamename === "Blackjack")))
    playerAPI.getProfile().then(r => setProfile(r.data))
  }, [])

  const refreshProfile = () => playerAPI.getProfile().then(r => setProfile(r.data))

  const startGame = useCallback(async () => {
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
    setError(""); setLoading(true)
    try {
      const res  = await gameAPI.startSession(gameInfo.gameid)
      setSession(res.data)
      const d    = buildDeck()
      const p    = [d.pop(), d.pop()]
      const dlr  = [d.pop(), d.pop()]
      setDeck(d); setPlayer(p); setDealer(dlr)
      setResult(null); setGameState(STATES.PLAYING)
    } catch (e) {
      setError(e.response?.data?.error || "Could not start game")
    } finally { setLoading(false) }
  }, [gameInfo])

  const hit = () => {
    const d    = [...deck]
    const card = d.pop()
    const hand = [...player, card]
    setDeck(d); setPlayer(hand)
    if (handTotal(hand) > 21) finishGame(hand, dealer, true)
  }

  const stand = () => {
    let d   = [...dealer]
    let dk  = [...deck]
    while (handTotal(d) < 17) d.push(dk.pop())
    setDealer(d); setDeck(dk)
    finishGame(player, d, false)
  }

  const finishGame = async (pHand, dHand, busted) => {
    const pt  = handTotal(pHand)
    const dt  = handTotal(dHand)
    const bet = Number(betAmount)
    let outcome, payout, message

    if (busted || pt > 21)   { outcome="loss"; payout=0;       message="Bust! Over 21."         }
    else if (dt > 21)        { outcome="win";  payout=bet*2;   message="Dealer busts! You win!" }
    else if (pt > dt)        { outcome="win";  payout=bet*2;   message="You win!"               }
    else if (pt < dt)        { outcome="loss"; payout=0;       message="Dealer wins."           }
    else                     { outcome="draw"; payout=bet;     message="Push — it's a tie."     }

    setResult({ outcome, payout, message })
    setGameState(STATES.DONE)

    try {
      await gameAPI.placeBet({ session_id: session.sessionid, amount: bet, result: outcome, payout })
      await gameAPI.endSession(
        session.sessionid,
        outcome === "win" ? "player_win" : outcome === "loss" ? "dealer_win" : "draw"
      )
      await refreshProfile()
    } catch (e) { setError(e.response?.data?.error || "Failed to record bet") }
  }

  const reset = () => {
    setGameState(STATES.IDLE); setSession(null)
    setResult(null); setPlayer([]); setDealer([]); setDeck([]); setError("")
  }

  return (
    <div className="min-h-[88vh] felt-bg flex flex-col items-center py-2 sm:py-3 px-2 sm:px-4">

      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-2xl mb-2 sm:mb-3">
        <button onClick={() => navigate("/games")} className="text-casino-text-secondary hover:text-casino-gold text-sm transition-colors">
          ← Back
        </button>
        <h1 className="text-2xl font-bold gold-text">Blackjack</h1>
        <div className="text-right text-sm">
          <div className="text-casino-muted text-xs">Balance</div>
          <div className="font-bold text-casino-text">
            ₹{Number(profile?.walletbalance ?? 0).toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-2 bg-casino-danger/20 border border-casino-danger/40 rounded-lg text-casino-danger text-sm w-full max-w-2xl">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="w-full max-w-2xl bg-black/30 rounded-3xl border border-white/10 p-2 flex flex-col justify-between items-center sm:p-3 h-[280px] sm:h-[340px]">
        {/* Dealer Area */}
        <div className="w-full h-[40%] flex justify-center items-start">
          {gameState !== STATES.IDLE && (
            <Hand
              cards={dealer}
              label="Dealer"
              total={gameState === STATES.PLAYING ? "?" : handTotal(dealer)}
              hideSecond={gameState === STATES.PLAYING}
              delayBase={1}
            />
          )}
        </div>

        {/* Center / Message Area */}
        <div className="w-full min-h-[4rem] flex justify-center items-center z-20 relative">
          {result ? (
            <div className={`text-center py-2 px-6 sm:py-3 sm:px-8 rounded-2xl font-bold text-base sm:text-lg animate-fade-in shadow-2xl relative z-30 ${
              result.outcome === "win"  ? "bg-green-900 text-white border-2 border-green-500" :
              result.outcome === "loss" ? "bg-red-900 text-white border-2 border-red-500"   :
                                          "bg-yellow-900 text-white border-2 border-yellow-500"
            }`}>
              {result.message}
              {result.outcome === "win" && (
                <div className="text-sm font-normal mt-1">+₹{Number(result.payout).toLocaleString("en-IN")}</div>
              )}
            </div>
          ) : gameState === STATES.IDLE ? (
            <div className="text-casino-muted text-sm sm:text-base text-center">Place your bet and deal to start</div>
          ) : null}
        </div>

        {/* Player Area */}
        <div className="w-full h-[40%] flex justify-center items-end">
          {gameState !== STATES.IDLE && (
            <Hand cards={player} label="You" total={handTotal(player)} delayBase={0} />
          )}
        </div>
      </div>

      {/* Controls Dashboard */}
      <div className="w-full max-w-2xl bg-black/40 rounded-3xl border border-white/10 p-4 sm:p-5 flex flex-col gap-4 shadow-2xl relative z-20 mt-3 sm:mt-4">
        
        {(gameState === STATES.IDLE || gameState === STATES.DONE) && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/50 p-3 sm:p-4 rounded-2xl border border-white/5 shadow-inner">
            <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
              {CHIPS.map(c => (
                <button
                  key={c}
                  onClick={() => setBetAmount(c)}
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
                className="bg-black/80 border-2 border-white/20 rounded-xl pl-9 pr-2 py-2.5 text-white w-full font-bold outline-none focus:border-casino-gold hover:border-white/40 transition-colors text-sm text-center shadow-inner"
                value={betAmount === 0 ? "" : betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center mt-1">
          {gameState === STATES.IDLE && (
            <Button variant="gold" className="w-full py-4 text-lg tracking-widest uppercase font-black shadow-xl" onClick={startGame} loading={loading}>
              Deal — ₹{Number(betAmount).toLocaleString("en-IN")}
            </Button>
          )}
          {gameState === STATES.PLAYING && (
            <div className="flex gap-4 w-full">
              <Button variant="gold" className="flex-1 py-4 text-base tracking-widest uppercase font-black shadow-xl" onClick={hit}>Hit</Button>
              <Button variant="outline" className="flex-1 py-4 text-base tracking-widest uppercase font-black shadow-xl bg-black/40 hover:bg-black" onClick={stand}>Stand</Button>
            </div>
          )}
          {gameState === STATES.DONE && (
            <Button variant="gold" className="w-full py-4 text-lg tracking-widest uppercase font-black shadow-xl" onClick={reset}>Play Again</Button>
          )}
        </div>
      </div>

      {gameInfo && (
        <div className="mt-6 flex gap-4 text-xs text-casino-muted">
          <span>Min ₹{Number(gameInfo.minbet).toLocaleString("en-IN")}</span>
          <span>·</span>
          <span>Max ₹{Number(gameInfo.maxbet).toLocaleString("en-IN")}</span>
          <span>·</span>
          <span>Dealer stands on 17</span>
        </div>
      )}
    </div>
  )
}
