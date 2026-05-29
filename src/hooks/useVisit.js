import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { logVisit } from "../services/visit"

const API_FREE_PATHS = new Set(["/", "/login"])

export const useVisit = () => {
  const location = useLocation()

  useEffect(() => {
    if (API_FREE_PATHS.has(location.pathname)) {
      return
    }

    const key = "last_visit_log"
    const now = Date.now()
    const last = Number(localStorage.getItem(key))

    if (last && now - last < 10000) {
      return
    }

    localStorage.setItem(key, String(now))
    logVisit(location.pathname)
  }, [location])
}
