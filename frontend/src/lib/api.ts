import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8787',
  timeout: 15000,
})

// Example API wrappers — wire these to your real endpoints later
export const fetchPortfolio = () => api.get('/portfolio').then(r => r.data)
export const fetchRecommendations = (risk: number) =>
  api.get('/optimizer/recommendations', { params: { risk } }).then(r => r.data)
export const simulateAllocation = (payload: any) =>
  api.post('/optimizer/simulate', payload).then(r => r.data)

export default api
