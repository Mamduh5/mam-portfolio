import { api } from "./api"
import { getAuthHeaders } from "./auth"

const authConfig = () => ({ headers: getAuthHeaders() })

export const fetchAdminMessages = async () => {
  const res = await api.get("/messages", authConfig())
  return res.data
}

export const markMessageRead = async (messageId) => {
  const res = await api.patch(`/messages/${messageId}/read`, {}, authConfig())
  return res.data
}

export const deleteMessage = async (messageId) => {
  const res = await api.delete(`/messages/${messageId}`, authConfig())
  return res.data
}

export const fetchProjects = async () => {
  const res = await api.get("/projects")
  return res.data
}

export const createProject = async (payload) => {
  const res = await api.post("/projects", payload, authConfig())
  return res.data
}

export const updateProject = async (projectId, payload) => {
  const res = await api.patch(`/projects/${projectId}`, payload, authConfig())
  return res.data
}

export const deleteProject = async (projectId) => {
  const res = await api.delete(`/projects/${projectId}`, authConfig())
  return res.data
}

export const fetchProfile = async () => {
  const res = await api.get("/profile")
  return res.data
}

export const updateProfile = async (payload) => {
  const res = await api.patch("/profile", payload, authConfig())
  return res.data
}

export const uploadImage = async (file) => {
  const formData = new FormData()
  formData.append("image", file)

  const res = await api.post("/upload", formData, {
    headers: getAuthHeaders()
  })

  return res.data
}

export const fetchFocusCurrent = async () => {
  const res = await api.get("/focus/current", authConfig())
  return res.data
}

export const updateFocusCurrent = async (payload) => {
  const res = await api.patch("/focus/current", payload, authConfig())
  return res.data
}

export const fetchFocusSnapshots = async (params = {}) => {
  const res = await api.get("/focus/snapshots", {
    ...authConfig(),
    params
  })
  return res.data
}

export const createFocusSnapshot = async (payload) => {
  const res = await api.post("/focus/snapshots", payload, authConfig())
  return res.data
}

export const fetchActivityEvents = async (params = {}) => {
  const res = await api.get("/activity/events", {
    ...authConfig(),
    params
  })
  return res.data
}

export const syncGitHubActivity = async (payload = {}) => {
  const res = await api.post("/activity/sync/github", payload, authConfig())
  return res.data
}
