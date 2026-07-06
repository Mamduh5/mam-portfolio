import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { logVisit } from "../services/visit"

const VISIT_FREE_PATHS = new Set(["/login"])

export const useVisit = () => {
  const location = useLocation()

  useEffect(() => {
    if (VISIT_FREE_PATHS.has(location.pathname)) {
      return
    }

    logVisit(location.pathname)
  }, [location])
}
