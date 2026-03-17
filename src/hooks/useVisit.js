import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { logVisit } from "../services/visit"

export const useVisit = () => {

  const location = useLocation()

  useEffect(() => {

    const key = "last_visit_log"
    const now = Date.now()

    const last = localStorage.getItem(key)

    // 10 seconds cooldown
    if (last && now - last < 10000) {
      return
    }

    localStorage.setItem(key, now)

    logVisit(location.pathname)

  }, [location])

}