import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import CommandHero from "../components/CommandHero"
import { login } from "../services/auth"

function Login() {
  const navigate = useNavigate()
  const turnstileRef = useRef(null)
  const turnstileWidgetId = useRef(null)
  const [form, setForm] = useState({ username: "", password: "" })
  const [captchaRequired, setCaptchaRequired] = useState(false)
  const [captchaSiteKey, setCaptchaSiteKey] = useState("")
  const [captchaToken, setCaptchaToken] = useState("")
  const [status, setStatus] = useState("idle")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!captchaRequired || !captchaSiteKey) {
      return undefined
    }

    let active = true

    const renderTurnstile = () => {
      if (!active || !window.turnstile || !turnstileRef.current || turnstileWidgetId.current !== null) {
        return
      }

      turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
        sitekey: captchaSiteKey,
        action: "admin-login",
        callback: (token) => setCaptchaToken(token),
        "expired-callback": () => setCaptchaToken(""),
        "error-callback": () => setCaptchaToken("")
      })
    }

    const existingScript = document.querySelector("script[data-turnstile-script='true']")

    if (!existingScript) {
      const script = document.createElement("script")
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      script.async = true
      script.defer = true
      script.dataset.turnstileScript = "true"
      script.onload = renderTurnstile
      document.head.appendChild(script)
    } else {
      if (window.turnstile) {
        renderTurnstile()
      } else {
        existingScript.addEventListener("load", renderTurnstile, { once: true })
      }
    }

    return () => {
      active = false

      if (existingScript) {
        existingScript.removeEventListener("load", renderTurnstile)
      }

      if (window.turnstile && turnstileWidgetId.current !== null) {
        window.turnstile.remove(turnstileWidgetId.current)
        turnstileWidgetId.current = null
      }
    }
  }, [captchaRequired, captchaSiteKey])

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
        ...(captchaRequired && captchaToken ? { captchaToken } : {})
      })
      setStatus("sent")
      navigate("/admin", { replace: true })
    } catch (err) {
      const response = err.response?.data || {}

      if (response.captchaRequired) {
        setCaptchaRequired(true)
        setCaptchaSiteKey(response.captchaSiteKey || "")
        setCaptchaToken("")

        if (window.turnstile && turnstileWidgetId.current !== null) {
          window.turnstile.reset(turnstileWidgetId.current)
        }
      }

      setStatus("error")
      setError(response.captchaRequired ? "Login failed. Complete verification and try again." : "Login failed. Check username and password.")
    }
  }

  return (
    <div className="page-stack login-page">
      <CommandHero
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
          {captchaRequired && captchaSiteKey && (
            <div className="turnstile-slot" ref={turnstileRef} />
          )}
          {captchaRequired && !captchaSiteKey && (
            <p className="form-status form-status--error">Verification is required but not configured.</p>
          )}
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
