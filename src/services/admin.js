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

export const syncGitHubProjectCatalog = async (payload = {}) => {
  const res = await api.post("/projects/sync/github", payload, authConfig())
  return res.data
}

export const fetchAssets = async (params = {}) => {
  const res = await api.get("/assets", {
    ...authConfig(),
    params
  })
  return res.data
}

export const updateAsset = async (assetId, payload) => {
  const res = await api.patch(`/assets/${assetId}`, payload, authConfig())
  return res.data
}

export const deleteAsset = async (assetId) => {
  const res = await api.delete(`/assets/${assetId}`, authConfig())
  return res.data
}

export const linkAsset = async (assetId, payload) => {
  const res = await api.post(`/assets/${assetId}/link`, payload, authConfig())
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

export const uploadImage = async (file, metadata = {}) => {
  const formData = new FormData()
  formData.append("image", file)

  Object.entries(metadata).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, value)
    }
  })

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

export const fetchVisitAnalyticsSummary = async (params = {}) => {
  const res = await api.get("/analytics/visits/summary", {
    ...authConfig(),
    params
  })
  return res.data
}

export const fetchVisitAnalyticsGeo = async (params = {}) => {
  const res = await api.get("/analytics/visits/geo", {
    ...authConfig(),
    params
  })
  return res.data
}

export const fetchVisitAnalyticsPaths = async (params = {}) => {
  const res = await api.get("/analytics/visits/paths", {
    ...authConfig(),
    params
  })
  return res.data
}

export const fetchVisitAnalyticsAgents = async (params = {}) => {
  const res = await api.get("/analytics/visits/agents", {
    ...authConfig(),
    params
  })
  return res.data
}

export const fetchSecuritySummary = async (params = {}) => {
  const res = await api.get("/security/summary", {
    ...authConfig(),
    params
  })
  return res.data
}

export const fetchSecurityEvents = async (params = {}) => {
  const res = await api.get("/security/events", {
    ...authConfig(),
    params
  })
  return res.data
}

export const fetchSecurityAttention = async (params = {}) => {
  const res = await api.get("/security/attention", {
    ...authConfig(),
    params
  })
  return res.data
}

const shouldTryAlternateAttentionRequest = (err) => {
  const status = err?.response?.status
  return [400, 404, 405, 422].includes(status)
}

const buildAttentionPayloadVariants = (payload = {}) => {
  const status = payload.attentionStatus ?? payload.attention_status

  if (!status) {
    return [payload]
  }

  const rest = Object.fromEntries(
    Object.entries(payload).filter(([key]) => !["attentionStatus", "attention_status"].includes(key))
  )

  return [
    payload,
    { ...rest, attention_status: status },
    { ...rest, attentionStatus: status }
  ]
}

export const updateSecurityAttention = async (eventId, payload = {}) => {
  const url = `/security/events/${eventId}/attention`
  const variants = buildAttentionPayloadVariants(payload)
  let lastError

  for (const nextPayload of variants) {
    try {
      const res = await api.patch(url, nextPayload, authConfig())
      return res.data
    } catch (err) {
      lastError = err

      if (!shouldTryAlternateAttentionRequest(err)) {
        throw err
      }
    }

    try {
      const res = await api.post(url, nextPayload, authConfig())
      return res.data
    } catch (err) {
      lastError = err

      if (!shouldTryAlternateAttentionRequest(err)) {
        throw err
      }
    }
  }

  throw lastError
}

export const fetchSecurityBlocks = async () => {
  const res = await api.get("/security/blocks", authConfig())
  return res.data
}

export const createSecurityBlock = async (payload) => {
  const res = await api.post("/security/blocks", payload, authConfig())
  return res.data
}

export const deleteSecurityBlock = async (blockId) => {
  const res = await api.delete(`/security/blocks/${blockId}`, authConfig())
  return res.data
}

export const fetchSecuritySettings = async () => {
  const res = await api.get("/security/settings", authConfig())
  return res.data
}

export const updateSecuritySettings = async (payload) => {
  const res = await api.patch("/security/settings", payload, authConfig())
  return res.data
}
