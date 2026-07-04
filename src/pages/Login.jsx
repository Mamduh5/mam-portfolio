import { useState } from "react"
import { useNavigate } from "react-router-dom"
import CommandHero from "../components/CommandHero"
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
      navigate("/admin", { replace: true })
    } catch (err) {
      console.error(err)
      setStatus("error")
      setError("Login failed. Check username and password.")
    }
  }

  return (
    <div className="page-stack login-page">
      <CommandHero
        eyebrow={<span className="static-chip">Private access</span>}
        title="Owner sign in"
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
