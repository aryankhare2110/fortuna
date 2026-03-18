import { useState, useEffect } from "react"
import { playerAPI } from "../../api/axios"
import { Card, StatCard, Badge, Button, Input } from "../../components/ui/index"

export default function PlayerWallet() {
  const [profile, setProfile] = useState(null)
  const [txns,    setTxns]    = useState([])
  const [amount,  setAmount]  = useState("")
  const [points,  setPoints]  = useState("")
  const [tab,     setTab]     = useState("deposit") // deposit | withdraw | redeem
  const [msg,     setMsg]     = useState(null)
  const [loading, setLoading] = useState(false)

  const load = () => {
    playerAPI.getProfile().then(r => setProfile(r.data))
    playerAPI.getTransactions(1).then(r => setTxns(r.data))
  }

  useEffect(() => { load() }, [])

  const flash = (text, type = "success") => {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 3500)
  }

  const handleDeposit = async () => {
    if (!amount || Number(amount) <= 0) return
    setLoading(true)
    try {
      await playerAPI.deposit(Number(amount))
      flash(`₹${Number(amount).toLocaleString("en-IN")} deposited successfully`)
      setAmount("")
      load()
    } catch (e) { flash(e.response?.data?.error || "Failed", "error") }
    finally { setLoading(false) }
  }

  const handleWithdraw = async () => {
    if (!amount || Number(amount) <= 0) return
    setLoading(true)
    try {
      await playerAPI.withdraw(Number(amount))
      flash(`₹${Number(amount).toLocaleString("en-IN")} withdrawn successfully`)
      setAmount("")
      load()
    } catch (e) { flash(e.response?.data?.error || "Failed", "error") }
    finally { setLoading(false) }
  }

  const handleRedeem = async () => {
    const p = Number(points)
    if (!p || p < 100 || p % 100 !== 0) {
      flash("Enter a multiple of 100 points (min 100)", "error")
      return
    }
    setLoading(true)
    try {
      const r = await playerAPI.redeemRewards(p)
      flash(r.data.message)
      setPoints("")
      load()
    } catch (e) { flash(e.response?.data?.error || "Failed", "error") }
    finally { setLoading(false) }
  }

  const txnColor = (type) =>
    ["deposit", "bet_credit", "reward_redemption"].includes(type)
      ? "text-casino-success"
      : "text-casino-danger"

  const txnSign = (type) =>
    ["deposit", "bet_credit", "reward_redemption"].includes(type) ? "+" : "-"

  const txnBadgeVariant = (type) => ({
    deposit:           "success",
    withdrawal:        "danger",
    bet_debit:         "warning",
    bet_credit:        "success",
    reward_redemption: "gold",
  }[type] || "default")

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold gold-text mb-6">Wallet</h1>

      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard
          label="Available Balance"
          value={`₹${Number(profile?.walletbalance ?? 0).toLocaleString("en-IN")}`}
          icon={<svg className="w-5 h-5 text-casino-gold opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Reward Points"
          value={profile?.rewardpoints ?? 0}
          sub="100 pts = ₹50"
          icon={<svg className="w-5 h-5 text-casino-gold opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
        />
      </div>

      {/* Action panel */}
      <Card className="p-6 mb-6">

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {["deposit", "withdraw", "redeem"].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setAmount(""); setPoints("") }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                tab === t
                  ? "bg-gold-gradient text-casino-black"
                  : "border border-casino-border text-casino-text-secondary hover:border-casino-gold/50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Flash message */}
        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            msg.type === "error"
              ? "bg-casino-danger/10 border border-casino-danger/30 text-casino-danger"
              : "bg-green-900/20 border border-green-700/30 text-green-400"
          }`}>
            {msg.text}
          </div>
        )}

        {/* Redeem tab */}
        {tab === "redeem" ? (
          <div className="flex gap-3 items-end">
            <Input
              label="Points to redeem (multiples of 100)"
              id="points"
              type="number"
              min="100"
              step="100"
              value={points}
              onChange={e => setPoints(e.target.value)}
              placeholder="e.g. 200"
              className="flex-1"
            />
            <Button onClick={handleRedeem} loading={loading} className="shrink-0">
              Redeem
            </Button>
          </div>
        ) : (
          /* Deposit / Withdraw tab */
          <div className="flex gap-3 items-end">
            <Input
              label={tab === "deposit" ? "Amount to deposit (₹)" : "Amount to withdraw (₹)"}
              id="amount"
              type="number"
              min="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 1000"
              className="flex-1"
            />
            <Button
              onClick={tab === "deposit" ? handleDeposit : handleWithdraw}
              loading={loading}
              variant={tab === "withdraw" ? "outline" : "gold"}
              className="shrink-0"
            >
              {tab === "deposit" ? "Deposit" : "Withdraw"}
            </Button>
          </div>
        )}
      </Card>

      {/* Transaction history */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-casino-text-secondary uppercase tracking-wider mb-4">
          Transaction History
        </h2>
        {txns.length === 0 ? (
          <p className="text-casino-muted text-sm py-4 text-center">No transactions yet</p>
        ) : (
          <div className="divide-y divide-casino-border">
            {txns.map(t => (
              <div key={t.txnid} className="flex items-center justify-between py-3">
                <div>
                  <Badge variant={txnBadgeVariant(t.type)}>
                    {t.type.replace(/_/g, " ").toUpperCase()}
                  </Badge>
                  <div className="text-xs text-casino-muted mt-1">
                    {new Date(t.txntime).toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold text-sm ${txnColor(t.type)}`}>
                    {txnSign(t.type)}₹{Number(t.amount).toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-casino-muted">
                    Balance: ₹{Number(t.balanceafter).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
