import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { api } from "../services/api"
import { clearSession, getAccessToken, getAuthHeaders } from "../services/auth"

function ProtectedRoute({ children }) {
  const [status, setStatus] = useState(getAccessToken() ? "checking" : "unauthorized")

  useEffect(() => {
    let active = true

    const verifySession = async () => {
      if (!getAccessToken()) {
        setStatus("unauthorized")
        return
      }

      try {
        await api.get("/auth/me", { headers: getAuthHeaders() })

        if (active) {
          setStatus("authorized")
        }
      } catch (err) {
        console.error("admin session check failed", err)
        clearSession()

        if (active) {
          setStatus("unauthorized")
        }
      }
    }

    verifySession()

    return () => {
      active = false
    }
  }, [])

  if (status === "checking") {
    return (
      <div className="admin-auth-check">
        <div className="skeleton skeleton--hero" />
      </div>
    )
  }

  if (status === "unauthorized") {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
