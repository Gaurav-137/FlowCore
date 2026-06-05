import create from 'zustand'
import api from '../services/api'

const useExecutionStore = create((set, get) => ({
  runs: [],
  totalRuns: 0,
  activeRun: null,
  nodeExecutions: {}, // runId -> { nodeId -> executionInfo }
  isLoading: false,

  fetchRuns: async ({ page = 1, limit = 20, status, workflowId } = {}) => {
    set({ isLoading: true })
    try {
      const res = await api.get('/executions', { params: { page, limit, status, workflowId } })
      set({
        runs: res.data.runs || [],
        totalRuns: res.data.total || 0,
        isLoading: false
      })
    } catch (e) {
      set({ isLoading: false })
      console.error(e)
    }
  },

  fetchRunDetails: async (runId) => {
    set({ isLoading: true })
    try {
      const res = await api.get(`/executions/${runId}`)
      const run = res.data
      
      const nodeExecs = {}
      if (run.nodeExecutions) {
        run.nodeExecutions.forEach((ne) => {
          nodeExecs[ne.nodeId] = ne
        })
      }

      set((state) => ({
        activeRun: run,
        nodeExecutions: {
          ...state.nodeExecutions,
          [runId]: nodeExecs
        },
        isLoading: false
      }))
    } catch (e) {
      set({ isLoading: false })
      console.error(e)
    }
  },

  retryRun: async (runId) => {
    try {
      const res = await api.post(`/executions/${runId}/retry`)
      return res.data
    } catch (e) {
      console.error(e)
      throw e
    }
  },

  cancelRun: async (runId) => {
    try {
      await api.post(`/executions/${runId}/cancel`)
      set((state) => ({
        activeRun: state.activeRun?.id === runId ? { ...state.activeRun, status: 'CANCELLED' } : state.activeRun
      }))
    } catch (e) {
      console.error(e)
    }
  },

  deleteRun: async (runId) => {
    try {
      await api.delete(`/executions/${runId}`)
      set((state) => ({
        runs: state.runs.filter((r) => r.id !== runId)
      }))
    } catch (e) {
      console.error(e)
    }
  },

  // Socket updates handlers
  handleWorkflowStarted: (event) => {
    const { workflowRunId } = event
    set((state) => {
      const updatedRuns = state.runs.map(r => r.id === workflowRunId ? { ...r, status: 'RUNNING' } : r)
      return {
        runs: updatedRuns,
        activeRun: state.activeRun?.id === workflowRunId ? { ...state.activeRun, status: 'RUNNING' } : state.activeRun
      }
    })
  },

  handleWorkflowCompleted: (event) => {
    const { workflowRunId } = event
    set((state) => {
      const updatedRuns = state.runs.map(r => r.id === workflowRunId ? { ...r, status: 'SUCCESS' } : r)
      return {
        runs: updatedRuns,
        activeRun: state.activeRun?.id === workflowRunId ? { ...state.activeRun, status: 'SUCCESS' } : state.activeRun
      }
    })
  },

  handleWorkflowFailed: (event) => {
    const { workflowRunId, error } = event
    set((state) => {
      const updatedRuns = state.runs.map(r => r.id === workflowRunId ? { ...r, status: 'FAILED', errorMessage: error } : r)
      return {
        runs: updatedRuns,
        activeRun: state.activeRun?.id === workflowRunId ? { ...state.activeRun, status: 'FAILED', errorMessage: error } : state.activeRun
      }
    })
  },

  handleNodeStarted: (event) => {
    const { workflowRunId, nodeId, nodeName } = event
    set((state) => {
      const runNodeExecs = state.nodeExecutions[workflowRunId] || {}
      const updatedNodeExecs = {
        ...runNodeExecs,
        [nodeId]: {
          nodeId,
          nodeName,
          status: 'RUNNING',
          startedAt: new Date().toISOString()
        }
      }
      return {
        nodeExecutions: {
          ...state.nodeExecutions,
          [workflowRunId]: updatedNodeExecs
        }
      }
    })
  },

  handleNodeCompleted: (event) => {
    const { workflowRunId, nodeId, nodeName, itemCount, durationMs } = event
    set((state) => {
      const runNodeExecs = state.nodeExecutions[workflowRunId] || {}
      const updatedNodeExecs = {
        ...runNodeExecs,
        [nodeId]: {
          ...runNodeExecs[nodeId],
          nodeId,
          nodeName,
          status: 'SUCCESS',
          itemCount,
          durationMs,
          completedAt: new Date().toISOString()
        }
      }
      return {
        nodeExecutions: {
          ...state.nodeExecutions,
          [workflowRunId]: updatedNodeExecs
        }
      }
    })
  },

  handleNodeFailed: (event) => {
    const { workflowRunId, nodeId, nodeName, error } = event
    set((state) => {
      const runNodeExecs = state.nodeExecutions[workflowRunId] || {}
      const updatedNodeExecs = {
        ...runNodeExecs,
        [nodeId]: {
          ...runNodeExecs[nodeId],
          nodeId,
          nodeName,
          status: 'FAILED',
          errorMessage: error,
          completedAt: new Date().toISOString()
        }
      }
      return {
        nodeExecutions: {
          ...state.nodeExecutions,
          [workflowRunId]: updatedNodeExecs
        }
      }
    })
  }
}))

export default useExecutionStore
