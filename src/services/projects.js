import { api } from "./api"

export const fetchProjects = async (params = {}) => {
  const res = await api.get("/projects", { params })
  return res.data
}

export const fetchProject = async (projectId) => {
  const res = await api.get(`/projects/${projectId}`)
  return res.data
}
