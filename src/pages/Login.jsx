import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import PublicHero from "../components/PublicHero"
import TurnstileWidget from "../components/TurnstileWidget"
import { login } from "../services/auth"

function Login() {
  const navigate = useNavigate()
  const turnstileRef = useRef(null)
  const [form, setForm] = useState({ username: "", password: "" })
  const [turnstileToken, setTurnstileToken] = useState("")
  const [status, setStatus] = useState("idle")
  const [error, setError] = useState("")

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus("submitting")
    setError("")

    try {
      await login({
        ...form,
        ...(turnstileToken ? { turnstileToken } : {})
      })
      setStatus("sent")
      turnstileRef.current?.reset()
      navigate("/admin", { replace: true })
    } catch (err) {
      const response = err.response?.data || {}

      setStatus("error")
      setTurnstileToken("")
      turnstileRef.current?.reset()
      setError(response.error === "turnstile_failed"
        ? response.message || "Verification failed. Please try again."
        : "Login failed. Check username and password.")
    }
  }

  return (
    <div className="page-stack login-page">
      <PublicHero
        eyebrow={<span className="static-chip">Private access</span>}
        title="Sign in"
        description="Private access for portfolio updates, uploads, messages, and focus notes."
      >
        <form className="secure-form login-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              name="username"
              placeholder="Admin username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </label>
          <TurnstileWidget action="admin-login" onToken={setTurnstileToken} ref={turnstileRef} />
          <button className="button button--primary" type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? "Signing in..." : "Sign in"}
          </button>
          {status === "error" && <p className="form-status form-status--error">{error}</p>}
        </form>
      </PublicHero>
    </div>
  )
}

export default Login
