import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"

const turnstileScriptUrl = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
const defaultSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || ""

let scriptPromise = null

const loadTurnstileScript = () => {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile)
  }

  if (scriptPromise) {
    return scriptPromise
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-turnstile-script='true']")

    if (existing) {
      existing.addEventListener("load", () => resolve(window.turnstile), { once: true })
      existing.addEventListener("error", () => reject(new Error("Turnstile script failed to load")), { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = turnstileScriptUrl
    script.async = true
    script.defer = true
    script.dataset.turnstileScript = "true"
    script.onload = () => resolve(window.turnstile)
    script.onerror = () => reject(new Error("Turnstile script failed to load"))
    document.head.appendChild(script)
  })

  return scriptPromise
}

const TurnstileWidget = forwardRef(function TurnstileWidget({
  siteKey = defaultSiteKey,
  action,
  onToken,
  onError
}, ref) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)
  const [status, setStatus] = useState(siteKey ? "loading" : "disabled")

  const clearToken = useCallback(() => {
    onToken?.("")
  }, [onToken])

  const reset = useCallback(() => {
    clearToken()

    if (window.turnstile && widgetIdRef.current !== null) {
      window.turnstile.reset(widgetIdRef.current)
    }
  }, [clearToken])

  useImperativeHandle(ref, () => ({ reset }), [reset])

  useEffect(() => {
    if (!siteKey) {
      clearToken()
      return undefined
    }

    let active = true

    loadTurnstileScript()
      .then((turnstile) => {
        if (!active || !turnstile || !containerRef.current || widgetIdRef.current !== null) {
          return
        }

        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          callback: (token) => {
            setStatus("ready")
            onToken?.(token)
          },
          "expired-callback": () => {
            clearToken()
            setStatus("expired")
          },
          "error-callback": () => {
            clearToken()
            setStatus("error")
            onError?.()
          }
        })
      })
      .catch(() => {
        if (!active) return
        clearToken()
        setStatus("error")
        onError?.()
      })

    return () => {
      active = false
      clearToken()

      if (window.turnstile && widgetIdRef.current !== null) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [action, clearToken, onError, onToken, siteKey])

  if (!siteKey) {
    return null
  }

  return (
    <div className="turnstile-field">
      <div
        className="turnstile-slot"
        data-action="turnstile-spin-v1"
        ref={containerRef}
      />
      {status === "loading" && <p className="form-status">Loading verification...</p>}
      {status === "expired" && <p className="form-status form-status--error">Verification expired. Please try again.</p>}
      {status === "error" && <p className="form-status form-status--error">Verification could not load. Please try again.</p>}
    </div>
  )
})

export default TurnstileWidget
