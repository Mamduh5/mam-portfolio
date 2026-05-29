import { api } from "./api"

const ACCESS_TOKEN_KEY = "mam_access_token"
const ADMIN_KEY = "mam_admin_user"

export const saveSession = ({ accessToken, admin }) => {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  }

  if (admin) {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
  }
}

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY)

export const getAdminUser = () => {
  const value = localStorage.getItem(ADMIN_KEY)
  return value ? JSON.parse(value) : null
}

export const clearSession = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(ADMIN_KEY)
}

export const login = async (credentials) => {
  const res = await api.post("/auth/login", credentials)
  saveSession(res.data)
  return res.data
}
