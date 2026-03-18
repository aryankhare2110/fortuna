// ── Button ────────────────────────────────────────────────────
export function Button({
  children, onClick, type = "button",
  variant = "gold", size = "md",
  disabled = false, loading = false, className = ""
}) {
  const base = "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"

  const variants = {
    gold:    "bg-gold-gradient text-casino-black hover:shadow-gold-lg",
    outline: "border border-casino-gold text-casino-gold hover:bg-casino-gold/10",
    ghost:   "text-casino-text-secondary hover:text-casino-text hover:bg-white/5",
    danger:  "bg-casino-danger text-white hover:bg-red-600",
    success: "bg-casino-success text-white hover:bg-green-600",
  }

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3 text-base",
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading…
        </span>
      ) : children}
    </button>
  )
}

// ── Card ──────────────────────────────────────────────────────
export function Card({ children, className = "", glow = false }) {
  return (
    <div className={`
      bg-casino-card border border-casino-border rounded-2xl
      ${glow ? "shadow-gold animate-pulse-gold" : "shadow-card"}
      ${className}
    `}>
      {children}
    </div>
  )
}

// ── Input ─────────────────────────────────────────────────────
export function Input({ label, id, error, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm text-casino-text-secondary font-medium">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          w-full bg-casino-black border rounded-lg px-4 py-2.5
          text-casino-text text-sm outline-none transition-all duration-200
          placeholder:text-casino-muted
          ${error
            ? "border-casino-danger focus:border-casino-danger"
            : "border-casino-border focus:border-casino-gold"
          }
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-casino-danger text-xs">{error}</p>}
    </div>
  )
}

// ── StatCard ──────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <span className="text-casino-text-secondary text-xs uppercase tracking-wider">
          {label}
        </span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-casino-text mt-2">{value}</div>
      {sub && <div className="text-casino-gold text-xs mt-1 font-semibold">{sub}</div>}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────
export function Badge({ children, variant = "default" }) {
  const variants = {
    default: "bg-casino-border  text-casino-text-secondary",
    gold:    "bg-casino-gold/20 text-casino-gold",
    success: "bg-green-900/40   text-green-400",
    danger:  "bg-red-900/40     text-red-400",
    warning: "bg-yellow-900/40  text-yellow-400",
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}

// ── GoldDivider ───────────────────────────────────────────────
export function GoldDivider() {
  return (
    <div className="w-full h-px bg-gradient-to-r from-transparent via-casino-gold/40 to-transparent my-4" />
  )
}
