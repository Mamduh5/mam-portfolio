import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { logVisit } from "../services/visit"

export const useVisit = () => {
  const location = useLocation()

  useEffect(() => {
    const path = location.pathname
    const key = `last_visit_log:${path}`
    const now = Date.now()
    const last = Number(localStorage.getItem(key))

    // 10 seconds cooldown
    if (last && now - last < 10000) {
      return
    }

    localStorage.setItem(key, String(now))
    logVisit(path)
  }, [location.pathname])
}
