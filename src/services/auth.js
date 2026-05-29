import { api } from "./api"

const ACCESS_TOKEN_KEY = "mam_access_token"
const REFRESH_TOKEN_KEY = "mam_refresh_token"
const ADMIN_KEY = "mam_admin_user"

export const saveSession = ({ accessToken, refreshToken, admin }) => {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }

  if (admin) {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
  }
}

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY)

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY)

export const getAdminUser = () => {
  const value = localStorage.getItem(ADMIN_KEY)

  if (!value) {
    return null
  }

  try {
    return JSON.parse(value)
  } catch {
    localStorage.removeItem(ADMIN_KEY)
    return null
  }
}

export const clearSession = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(ADMIN_KEY)
}

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
