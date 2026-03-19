import { useEffect, useState } from "react"
import { api } from "../services/api"

export function useApiData(url, initialData = null) {
  const [data, setData] = useState(initialData)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      setIsLoading(true)
      setError("")

      try {
        const response = await api.get(url)

        if (isMounted) {
          setData(response.data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Something went wrong while loading data.")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [url])

  return { data, isLoading, error }
}
