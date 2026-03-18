import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function Navbar() {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => { logout(); navigate("/") }

  const isActive = (path) =>
    location.pathname.startsWith(path)
      ? "text-casino-gold border-b border-casino-gold pb-0.5"
      : "text-casino-text-secondary hover:text-casino-gold transition-colors"

  const playerLinks = [
    { to: "/player/dashboard", label: "Dashboard" },
    { to: "/games",            label: "Play"      },
    { to: "/player/wallet",    label: "Wallet"    },
    { to: "/leaderboard",      label: "Rankings"  },
  ]
  const dealerLinks = [{ to: "/dealer/dashboard", label: "Dashboard" }]
  const adminLinks  = [{ to: "/admin/dashboard",  label: "Dashboard" }]

  const links = role === "player" ? playerLinks
              : role === "dealer" ? dealerLinks
              : role === "admin"  ? adminLinks
              : []

  return (
    <nav className="sticky top-0 z-50 bg-casino-darkbg border-b border-casino-border backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl select-none">♠</span>
          <span className="font-bold text-lg gold-text tracking-wider">FORTUNA</span>
        </Link>

        {/* Nav links */}
        {user && (
          <div className="hidden md:flex items-center gap-6">
            {links.map(({ to, label }) => (
              <Link key={to} to={to} className={`text-sm font-medium ${isActive(to)}`}>
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-casino-text">
                  {user.username || user.first_name}
                </span>
                <span className="text-xs text-casino-gold capitalize">{role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-casino-text-secondary hover:text-casino-danger transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login/player"
                className="text-sm text-casino-text-secondary hover:text-casino-gold transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="text-sm bg-gold-gradient text-casino-black font-semibold px-4 py-1.5 rounded-lg"
              >
                Join
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  )
}
