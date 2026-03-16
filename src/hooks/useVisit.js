import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { logVisit } from "../services/visit"

export const useVisit = () => {

  const location = useLocation()

  useEffect(() => {
    logVisit(location.pathname)
  }, [location])

}