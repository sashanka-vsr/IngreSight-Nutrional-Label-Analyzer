import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
})

export const analyzeLabel = async (imageFile, forceNew = false) => {
  const formData = new FormData()
  formData.append('file', imageFile)
  formData.append('force_new', forceNew)

  const response = await api.post('/api/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const getHistory = async (limit = 10, skip = 0) => {
  const response = await api.get('/api/history', {
    params: { limit, skip }
  })
  return response.data
}

export const getProductById = async (productId) => {
  const response = await api.get(`/api/history/${productId}`)
  return response.data
}

export const deleteProduct = async (productId) => {
  const response = await api.delete(`/api/history/${productId}`)
  return response.data
}