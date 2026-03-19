import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { Button, Input, Card, GoldDivider } from "../../components/ui/index"

function LoginForm({ title, subtitle, icon, loginFn, redirectTo, registerLink }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await loginFn(form.email, form.password)
      navigate(redirectTo)
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[88vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-slide-up">

        <div className="text-center mb-8">
          <div className="text-5xl mb-3">{icon}</div>
          <h1 className="text-3xl font-bold text-casino-text">{title}</h1>
          <p className="text-casino-text-secondary text-sm mt-2">{subtitle}</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Email address"
              id="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
            <Input
              label="Password"
              id="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />

            {error && (
              <div className="bg-casino-danger/10 border border-casino-danger/30 rounded-lg px-4 py-3 text-casino-danger text-sm">
                {error}
              </div>
            )}

            <Button type="submit" variant="gold" size="lg" loading={loading} className="w-full mt-1">
              Sign in
            </Button>
          </form>

          {registerLink && (
            <>
              <GoldDivider />
              <p className="text-center text-sm text-casino-text-secondary">
                Don't have an account?{" "}
                <Link to={registerLink} className="text-casino-gold hover:underline font-medium">
                  Create one
                </Link>
              </p>
            </>
          )}
        </Card>

      </div>
    </div>
  )
}

export default function PlayerLogin() {
  const { playerLogin } = useAuth()
  return (
    <LoginForm
      title="Welcome back"
      subtitle="Sign in to your Fortuna account"
      icon="🃏"
      loginFn={playerLogin}
      redirectTo="/player/dashboard"
      registerLink="/register"
    />
  )
}

export function DealerLogin() {
  const { dealerLogin } = useAuth()
  return (
    <LoginForm
      title="Dealer portal"
      subtitle="Sign in to manage your sessions"
      icon="🎰"
      loginFn={dealerLogin}
      redirectTo="/dealer/dashboard"
    />
  )
}

export function AdminLogin() {
  const { adminLogin } = useAuth()
  return (
    <LoginForm
      title="Admin portal"
      subtitle="Full system access"
      icon="⚙️"
      loginFn={adminLogin}
      redirectTo="/admin/dashboard"
    />
  )
}
