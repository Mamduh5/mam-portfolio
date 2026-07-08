import axios from "axios"
import { saveAccessToken } from "./sessionStore.js"

const viteEnv = import.meta.env || {}

const baseURL = viteEnv.DEV && viteEnv.VITE_API_URL
  ? viteEnv.VITE_API_URL
  : "/api"

export const api = axios.create({
  baseURL
})

const readHeader = (headers, name) => {
  if (!headers) {
    return null
  }

  if (typeof headers.get === "function") {
    return headers.get(name) ?? headers.get(name.toLowerCase())
  }

  return headers[name] ?? headers[name.toLowerCase()] ?? null
}

const requestHadAuthHeader = (response) => {
  const authorization = readHeader(response?.config?.headers, "Authorization")
  return Boolean(authorization)
}

export const handleAccessTokenRenewal = (response) => {
  if (!requestHadAuthHeader(response)) {
    return response
  }

  const renewed = readHeader(response.headers, "X-Access-Token-Renewed")
  const nextAccessToken = readHeader(response.headers, "X-Access-Token")

  if (String(renewed).trim().toLowerCase() === "true" && nextAccessToken) {
    saveAccessToken(nextAccessToken)
  }

  return response
}

export const passThroughAuthError = (error) => Promise.reject(error)

api.interceptors.response.use(handleAccessTokenRenewal, passThroughAuthError)
