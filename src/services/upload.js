import { api } from "./api"

export const uploadImage = async (file) => {

  const formData = new FormData()

  formData.append("image", file)

  const res = await api.post("/upload", formData)

  return res.data.url
}