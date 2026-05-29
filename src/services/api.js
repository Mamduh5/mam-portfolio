import axios from "axios"

const proxyPath = ["", "api"].join("/")
const baseURL = import.meta.env.VITE_API_URL || proxyPath

export const api = axios.create({
  baseURL
})
