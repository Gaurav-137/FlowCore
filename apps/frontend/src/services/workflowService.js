import api from './api'

export async function listWorkflows() {
  const res = await api.get('/workflows')
  return res.data.workflows || res.data
}

export async function getWorkflow(id) {
  const res = await api.get(`/workflows/${id}`)
  return res.data
}

export async function createWorkflow(payload) {
  const res = await api.post('/workflows', payload)
  return res.data
}

export async function updateWorkflow(id, payload) {
  const res = await api.put(`/workflows/${id}`, payload)
  return res.data
}

export async function publishWorkflow(id) {
  const res = await api.post(`/workflows/${id}/publish`)
  return res.data
}

export async function deleteWorkflow(id) {
  const res = await api.delete(`/workflows/${id}`)
  return res.data
}

export async function pauseWorkflow(id) {
  const res = await api.post(`/workflows/${id}/pause`)
  return res.data
}

export async function resumeWorkflow(id) {
  const res = await api.post(`/workflows/${id}/resume`)
  return res.data
}

export async function cloneWorkflow(id) {
  const res = await api.post(`/workflows/${id}/clone`)
  return res.data
}

export async function triggerWorkflow(id, payload = {}) {
  const res = await api.post(`/workflows/${id}/trigger`, payload)
  return res.data
}

export async function getRunDetails(runId) {
  const res = await api.get(`/runs/${runId}`)
  return res.data
}
