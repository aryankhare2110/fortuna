import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { Button, Input, Card, GoldDivider } from "../../components/ui/index"

export default function Register() {
  const { playerRegister } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username: "", first_name: "", last_name: "",
    dob: "", email: "", password: "", confirm: ""
  })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.username.trim())    e.username   = "Username is required"
    if (!form.first_name.trim())  e.first_name = "First name is required"
    if (!form.dob)                e.dob        = "Date of birth is required"
    if (!form.email.trim())       e.email      = "Email is required"
    if (form.password.length < 6) e.password   = "Minimum 6 characters"
    if (form.password !== form.confirm) e.confirm = "Passwords do not match"
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      await playerRegister({
        username:   form.username,
        first_name: form.first_name,
        last_name:  form.last_name,
        dob:        form.dob,
        email:      form.email,
        password:   form.password,
      })
      navigate("/player/dashboard")
    } catch (err) {
      setErrors({ api: err.response?.data?.error || "Registration failed" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[88vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-slide-up">

        <div className="text-center mb-8">
          <div className="text-5xl mb-3">♠</div>
          <h1 className="text-3xl font-bold text-casino-text">Join Fortuna</h1>
          <p className="text-casino-text-secondary text-sm mt-2">Create your player account</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name" id="first_name"
                value={form.first_name} onChange={set("first_name")}
                error={errors.first_name} required
              />
              <Input
                label="Last name" id="last_name"
                value={form.last_name} onChange={set("last_name")}
                placeholder="Optional"
              />
            </div>

            <Input
              label="Username" id="username"
              value={form.username} onChange={set("username")}
              error={errors.username} placeholder="ace_aryan" required
            />

            <Input
              label="Email" id="email" type="email"
              value={form.email} onChange={set("email")}
              error={errors.email} placeholder="you@example.com" required
            />

            <Input
              label="Date of birth" id="dob" type="date"
              value={form.dob} onChange={set("dob")}
              error={errors.dob} required
            />

            <Input
              label="Password" id="password" type="password"
              value={form.password} onChange={set("password")}
              error={errors.password} placeholder="Min. 6 characters" required
            />

            <Input
              label="Confirm password" id="confirm" type="password"
              value={form.confirm} onChange={set("confirm")}
              error={errors.confirm} placeholder="Repeat password" required
            />

            {errors.api && (
              <div className="bg-casino-danger/10 border border-casino-danger/30 rounded-lg px-4 py-3 text-casino-danger text-sm">
                {errors.api}
              </div>
            )}

            <Button type="submit" variant="gold" size="lg" loading={loading} className="w-full mt-1">
              Create account
            </Button>
          </form>

          <GoldDivider />
          <p className="text-center text-sm text-casino-text-secondary">
            Already have an account?{" "}
            <Link to="/login/player" className="text-casino-gold hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </Card>

      </div>
    </div>
  )
}
