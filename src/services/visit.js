import { api } from "./api"

export const logVisit = async (path) => {
  try {
    await api.post("/visit", {
      path: path
    })
  } catch (err) {
    console.error("visit log failed", err)
  }
}