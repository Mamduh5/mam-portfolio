import { api } from "./api.js"
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveSession
} from "./sessionStore.js"

export {
  clearSession,
  getAccessToken,
  getAdminUser,
  getRefreshToken,
  saveSession
} from "./sessionStore.js"

export const getAuthHeaders = () => {
  const accessToken = getAccessToken()

  return accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {}
}

export const isAuthenticated = () => Boolean(getAccessToken())

export const login = async (credentials) => {
  const res = await api.post("/auth/login", credentials)
  saveSession(res.data)
  return res.data
}

export const refreshSession = async () => {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    clearSession()
    throw new Error("Missing refresh token")
  }

  const res = await api.post("/auth/refresh", { refreshToken })
  saveSession(res.data)
  return res.data
}

export const logout = async () => {
  const refreshToken = getRefreshToken()

  try {
    await api.post(
      "/auth/logout",
      refreshToken ? { refreshToken } : {},
      { headers: getAuthHeaders() }
    )
  } finally {
    clearSession()
  }
}
