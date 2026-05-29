import { useState } from "react"
import { useNavigate } from "react-router-dom"
import CommandHero from "../components/CommandHero"
import RouteChip from "../components/RouteChip"
import { login } from "../services/auth"

function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: "", password: "" })
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
      await login(form)
      setStatus("sent")
      navigate("/projects")
    } catch (err) {
      console.error(err)
      setStatus("error")
      setError("Login failed. Check username and password.")
    }
  }

  return (
    <div className="page-stack login-page">
      <CommandHero
        eyebrow={<RouteChip method="POST" path="/auth/login" />}
        title="Owner sign in"
        description="Optional private access for portfolio management. This route is intentionally not listed in public navigation."
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
          <button className="button button--primary" type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? "Signing in..." : "Sign in"}
          </button>
          {status === "error" && <p className="form-status form-status--error">{error}</p>}
        </form>
      </CommandHero>
    </div>
  )
}

export default Login
