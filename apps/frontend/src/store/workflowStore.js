import create from 'zustand'
import api from '../services/api'
import { addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow'

const useWorkflowStore = create((set, get) => ({
  workflows: [],
  activeWorkflow: null,
  nodes: [],
  edges: [],
  isDirty: false,
  isSaving: false,
  isLoading: false,
  totalWorkflows: 0,

  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges, isDirty: true }),
  setActiveWorkflow: (workflow) => set({ activeWorkflow: workflow, isDirty: true }),

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
      isDirty: true
    }))
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      isDirty: true
    }))
  },

  onConnect: (connection) => {
    set((state) => ({
      edges: addEdge({ ...connection, type: 'deletable' }, state.edges),
      isDirty: true
    }))
  },

  fetchWorkflows: async ({ status, page = 1, limit = 12 } = {}) => {
    set({ isLoading: true })
    try {
      const res = await api.get('/workflows', { params: { status, page, limit } })
      set({ 
        workflows: res.data.workflows || [], 
        totalWorkflows: res.data.total || 0,
        isLoading: false 
      })
    } catch (e) {
      set({ isLoading: false })
      console.error(e)
    }
  },

  loadWorkflow: async (id) => {
    set({ isLoading: true, isDirty: false })
    try {
      const res = await api.get(`/workflows/${id}`)
      const wf = res.data
      
      // Transform Prisma nodes/edges to React Flow formats
      const nodes = (wf.nodes || []).map((n) => ({
        id: n.id,
        type: n.type,
        position: { x: n.positionX, y: n.positionY },
        data: { 
          label: n.label || n.type, 
          config: n.config || {}, 
          settings: n.settings || {} 
        }
      }))

      const edges = (wf.edges || []).map((e) => ({
        id: e.id,
        source: e.sourceNodeId,
        target: e.targetNodeId,
        sourceHandle: e.sourceOutput !== null ? `out-${e.sourceOutput}` : undefined,
        targetHandle: e.targetInput !== null ? `in-${e.targetInput}` : undefined,
        type: 'deletable'
      }))

      set({ activeWorkflow: wf, nodes, edges, isLoading: false, isDirty: false })
    } catch (e) {
      set({ isLoading: false })
      console.error(e)
    }
  },

  saveWorkflow: async () => {
    const { activeWorkflow, nodes, edges } = get()
    if (!activeWorkflow) return

    set({ isSaving: true })
    try {
      // Convert React Flow nodes/edges to Prisma formats
      const dbNodes = nodes.map((n) => ({
        id: n.id,
        type: n.type,
        label: n.data?.label || n.type,
        config: n.data?.config || {},
        settings: n.data?.settings || {},
        positionX: n.position.x,
        positionY: n.position.y
      }))

      const dbEdges = edges.map((e) => ({
        sourceNodeId: e.source,
        targetNodeId: e.target,
        sourceOutput: e.sourceHandle ? parseInt(e.sourceHandle.replace('out-', '')) : 0,
        targetInput: e.targetHandle ? parseInt(e.targetHandle.replace('in-', '')) : 0
      }))

      const payload = {
        name: activeWorkflow.name,
        description: activeWorkflow.description,
        settings: activeWorkflow.settings,
        nodes: dbNodes,
        edges: dbEdges
      }

      const res = activeWorkflow.id
        ? await api.put(`/workflows/${activeWorkflow.id}`, payload)
        : await api.post('/workflows', payload)

      set({ 
        activeWorkflow: { ...activeWorkflow, ...res.data }, 
        isSaving: false, 
        isDirty: false 
      })
      return res.data
    } catch (e) {
      set({ isSaving: false })
      console.error(e)
      throw e
    }
  },

  createWorkflow: async (data) => {
    try {
      const res = await api.post('/workflows', data)
      set((state) => ({ workflows: [res.data, ...state.workflows] }))
      return res.data
    } catch (e) {
      console.error(e)
    }
  },

  deleteWorkflow: async (id) => {
    try {
      await api.delete(`/workflows/${id}`)
      set((state) => ({
        workflows: state.workflows.filter((w) => w.id !== id)
      }))
    } catch (e) {
      console.error(e)
    }
  },

  cloneWorkflow: async (id) => {
    try {
      const res = await api.post(`/workflows/${id}/clone`)
      set((state) => ({ workflows: [res.data, ...state.workflows] }))
      return res.data
    } catch (e) {
      console.error(e)
    }
  },

  publishWorkflow: async (id, comment) => {
    try {
      const res = await api.post(`/workflows/${id}/publish`, { comment })
      set((state) => ({
        activeWorkflow: state.activeWorkflow?.id === id ? { ...state.activeWorkflow, ...res.data } : state.activeWorkflow
      }))
    } catch (e) {
      console.error(e)
    }
  },

  activateWorkflow: async (id) => {
    try {
      await api.post(`/workflows/${id}/resume`)
      set((state) => ({
        activeWorkflow: state.activeWorkflow?.id === id ? { ...state.activeWorkflow, status: 'ACTIVE' } : state.activeWorkflow
      }))
    } catch (e) {
      console.error(e)
    }
  },

  deactivateWorkflow: async (id) => {
    try {
      await api.post(`/workflows/${id}/pause`)
      set((state) => ({
        activeWorkflow: state.activeWorkflow?.id === id ? { ...state.activeWorkflow, status: 'INACTIVE' } : state.activeWorkflow
      }))
    } catch (e) {
      console.error(e)
    }
  },

  updateActiveWorkflowMeta: (updates) => {
    set((state) => ({
      activeWorkflow: state.activeWorkflow
        ? { ...state.activeWorkflow, ...updates }
        : {
            name: 'New Automation Pipeline',
            description: 'Describe your workflow',
            status: 'DRAFT',
            version: 1,
            settings: {},
            ...updates
          },
      isDirty: true
    }))
  }
}))

export default useWorkflowStore
