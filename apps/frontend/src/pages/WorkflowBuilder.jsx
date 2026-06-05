import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Save, 
  UploadCloud, 
  Check, 
  Trash2, 
  Search, 
  ArrowLeft,
  Settings,
  Plus,
  Info,
  Undo2,
  Redo2,
  Zap,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity,
  ChevronDown,
  Terminal,
  Copy,
  FolderDown,
  FolderUp,
  History,
  Tag,
  LayoutGrid
} from 'lucide-react'
import api from '../services/api'
import FlowEditor from '../workflow-builder/FlowEditor'
import NodeContextMenu from '../workflow-builder/NodeContextMenu'
import NodePickerPopover from '../workflow-builder/NodePickerPopover'
import useUndoRedo from '../workflow-builder/useUndoRedo'
import useSocket from '../hooks/useSocket'
import { Button, Input, Card, Badge, Modal } from '../components/ui'

// Zustand stores
import useWorkflowStore from '../store/workflowStore'
import useExecutionStore from '../store/executionStore'
import useUiStore from '../store/uiStore'

// Form renderers
import ParameterRenderer from '../workflow-builder/ParameterRenderer'
import CredentialSelector from '../workflow-builder/CredentialSelector'

function WorkflowBuilderContent() {
  const [searchParams] = useSearchParams()
  const workflowId = searchParams.get('id')
  const navigate = useNavigate()

  // Zustand state
  const {
    activeWorkflow,
    nodes,
    edges,
    isDirty,
    isSaving,
    isLoading,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    loadWorkflow,
    saveWorkflow,
    publishWorkflow,
    activateWorkflow,
    deactivateWorkflow,
    updateActiveWorkflowMeta
  } = useWorkflowStore()

  const {
    nodeExecutions,
    runs,
    fetchRunDetails,
    retryRun,
    cancelRun,
    handleWorkflowStarted,
    handleWorkflowCompleted,
    handleWorkflowFailed,
    handleNodeStarted,
    handleNodeCompleted,
    handleNodeFailed
  } = useExecutionStore()

  const {
    selectedNodeId,
    isConfigPanelOpen,
    activePanelTab,
    setSelectedNodeId,
    setConfigPanelOpen,
    setActivePanelTab
  } = useUiStore()

  // Node catalog registry loaded from backend
  const [nodeLibrary, setNodeLibrary] = useState([])
  const [librarySearch, setLibrarySearch] = useState('')
  const reactFlowWrapper = useRef(null)

  // Local UI states
  const [copiedNode, setCopiedNode] = useState(null)
  const [versions, setVersions] = useState([])
  const [tags, setTags] = useState([])
  const [workflowTags, setWorkflowTags] = useState([])
  const [showTagsModal, setShowTagsModal] = useState(false)
  const [showVersionsModal, setShowVersionsModal] = useState(false)
  
  // Execution states
  const [executing, setExecuting] = useState(false)
  const [executionRunId, setExecutionRunId] = useState(null)
  const [executionStatus, setExecutionStatus] = useState(null) // null | 'RUNNING' | 'SUCCESS' | 'FAILED'
  const [executionProgress, setExecutionProgress] = useState({ completed: 0, total: 0 })
  const [executionStartTime, setExecutionStartTime] = useState(null)
  const [executionDuration, setExecutionDuration] = useState(null)

  // Context menus and popovers
  const { pushState, undo, redo, canUndo, canRedo } = useUndoRedo()
  const [contextMenu, setContextMenu] = useState({ visible: false, position: { x: 0, y: 0 }, node: null })
  const [nodePicker, setNodePicker] = useState({ visible: false, position: { x: 0, y: 0 }, sourceNodeId: null, sourceHandle: null })
  const [renameModal, setRenameModal] = useState({ visible: false, nodeId: null, label: '' })

  const socketRef = useSocket()

  // Load backend node types and workflow
  useEffect(() => {
    // Fetch registered node definitions from backend
    api.get('/node-types')
      .then((res) => setNodeLibrary(res.data || []))
      .catch(console.error)

    if (workflowId) {
      loadWorkflow(workflowId)
      fetchVersions()
      fetchWorkflowTags()
    } else {
      // Empty canvas fallback with Start Trigger
      updateActiveWorkflowMeta({ name: 'New Automation Pipeline', description: 'Describe your workflow' })
      setNodes([
        { 
          id: 'start-trigger', 
          type: 'start', 
          position: { x: 150, y: 200 }, 
          data: { label: 'Start Trigger', config: {} } 
        }
      ])
      setEdges([])
    }

    // Unsaved changes beforeunload handler
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [workflowId])

  const fetchVersions = async () => {
    if (!workflowId) return
    try {
      const res = await api.get(`/workflows/${workflowId}/versions`)
      setVersions(res.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const fetchWorkflowTags = async () => {
    if (!workflowId) return
    try {
      const res = await api.get('/tags')
      setTags(res.data || [])
      const wf = await api.get(`/workflows/${workflowId}`)
      setWorkflowTags(wf.data.tags?.map(t => t.tag) || [])
    } catch (e) {
      console.error(e)
    }
  }

  const handleToggleTag = async (tag) => {
    if (!workflowId) return
    const isBound = workflowTags.some(t => t.id === tag.id)
    try {
      if (isBound) {
        await api.delete(`/tags/workflows/${workflowId}/${tag.id}`)
        setWorkflowTags(prev => prev.filter(t => t.id !== tag.id))
      } else {
        await api.post(`/tags/workflows/${workflowId}`, { tagId: tag.id })
        setWorkflowTags(prev => [...prev, tag])
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Inject execution badges live updates into nodes
  const activeNodeExecs = executionRunId ? nodeExecutions[executionRunId] || {} : {}
  const processedNodes = useMemo(() => {
    return nodes.map(n => {
      const exec = activeNodeExecs[n.id] || null
      return {
        ...n,
        data: {
          ...n.data,
          execution: exec,
          onAddNode: (pos, handleId) => {
            setNodePicker({
              visible: true,
              position: pos,
              sourceNodeId: n.id,
              sourceHandle: handleId
            })
          }
        }
      }
    })
  }, [nodes, activeNodeExecs])

  // Connection handler
  const handleConnect = useCallback((connection) => {
    pushState(nodes, edges)
    onConnect(connection)
  }, [nodes, edges, onConnect, pushState])

  // Node duplication helper
  const duplicateNode = useCallback((node) => {
    pushState(nodes, edges)
    const id = `node-${node.type}-${Date.now()}`
    const newNode = {
      id,
      type: node.type,
      position: { x: node.position.x + 50, y: node.position.y + 50 },
      data: { ...JSON.parse(JSON.stringify(node.data)), execution: null }
    }
    setNodes([...nodes, newNode])
  }, [nodes, edges, setNodes, pushState])

  // Context menu actions
  const handleNodeContextMenu = useCallback((event, node) => {
    event.preventDefault()
    setContextMenu({ visible: true, position: { x: event.clientX, y: event.clientY }, node })
  }, [])

  const handlePaneContextMenu = useCallback((event) => {
    event.preventDefault()
    const wrapperBounds = reactFlowWrapper.current?.getBoundingClientRect()
    if (!wrapperBounds) return
    const position = {
      x: event.clientX - wrapperBounds.left,
      y: event.clientY - wrapperBounds.top
    }
    pushState(nodes, edges)
    const id = `sticky-${Date.now()}`
    const stickyNode = {
      id,
      type: 'sticky_note',
      position,
      data: {
        content: '',
        onContentChange: (nodeId, content) => {
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, content } } : n))
        }
      },
      style: { width: 200, height: 140 }
    }
    setNodes([...nodes, stickyNode])
  }, [nodes, edges, setNodes, pushState])

  // Rename node handlers
  const startRenameNode = useCallback((node) => {
    setRenameModal({ visible: true, nodeId: node.id, label: node.data.label || '' })
  }, [])

  const applyRename = useCallback(() => {
    if (!renameModal.nodeId) return
    pushState(nodes, edges)
    setNodes(nodes.map(n => n.id === renameModal.nodeId ? { ...n, data: { ...n.data, label: renameModal.label } } : n))
    setRenameModal({ visible: false, nodeId: null, label: '' })
  }, [renameModal, nodes, edges, setNodes, pushState])

  // Delete node helper
  const deleteNode = useCallback((node) => {
    pushState(nodes, edges)
    setNodes(nodes.filter(n => n.id !== node.id))
    setEdges(edges.filter(e => e.source !== node.id && e.target !== node.id))
    if (selectedNodeId === node.id) setSelectedNodeId(null)
  }, [nodes, edges, selectedNodeId, setNodes, setEdges, setSelectedNodeId, pushState])

  // Drag-and-drop catalog helper
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  const handleDropNode = useCallback((type, position) => {
    pushState(nodes, edges)
    const id = `node-${type}-${Date.now()}`
    const defaultData = nodeLibrary.find(n => n.name === type)
    const defaultProps = {}
    defaultData?.properties?.forEach(p => {
      defaultProps[p.name] = p.default !== undefined ? p.default : ''
    })

    const newNode = {
      id,
      type,
      position,
      data: { 
        label: defaultData?.displayName || type, 
        config: defaultProps 
      }
    }
    setNodes([...nodes, newNode])
  }, [nodes, edges, nodeLibrary, setNodes, pushState])

  // Add node and auto connect
  const handlePickerSelectType = useCallback((type, sourceNodeId, sourceHandle) => {
    pushState(nodes, edges)
    const sourceNode = nodes.find(n => n.id === sourceNodeId)
    const position = {
      x: sourceNode ? sourceNode.position.x + 320 : 400,
      y: sourceNode ? sourceNode.position.y + (sourceHandle === 'false' ? 100 : 0) : 200
    }

    const id = `node-${type}-${Date.now()}`
    const defaultData = nodeLibrary.find(n => n.name === type)
    const defaultProps = {}
    defaultData?.properties?.forEach(p => {
      defaultProps[p.name] = p.default !== undefined ? p.default : ''
    })

    const newNode = {
      id,
      type,
      position,
      data: { 
        label: defaultData?.displayName || type, 
        config: defaultProps 
      }
    }

    setNodes([...nodes, newNode])

    const edge = {
      id: `edge-${Date.now()}`,
      source: sourceNodeId,
      target: id,
      sourceHandle: sourceHandle || 'output',
      targetHandle: 'input',
      type: 'deletable'
    }
    setEdges([...edges, edge])
  }, [nodes, edges, nodeLibrary, setNodes, setEdges, pushState])

  // Node settings input field updater
  const handleNodeConfigChange = (key, val) => {
    setNodes(nodes.map(n => {
      if (n.id === selectedNodeId) {
        return {
          ...n,
          data: {
            ...n.data,
            config: {
              ...(n.data.config || {}),
              [key]: val
            }
          }
        }
      }
      return n
    }))
  }

  const handleSaveWorkflow = async () => {
    const saved = await saveWorkflow()
    if (saved?.id && !workflowId) {
      navigate(`/builder?id=${saved.id}`, { replace: true })
    }
    return saved
  }

  const handlePublishWorkflow = async () => {
    const workflowToPublish = activeWorkflow?.id ? activeWorkflow : await handleSaveWorkflow()
    if (!workflowToPublish?.id) return
    await publishWorkflow(workflowToPublish.id)
  }

  // Topological Layout Engine
  const handleAutoLayout = () => {
    pushState(nodes, edges)
    const incoming = {}
    nodes.forEach(n => incoming[n.id] = 0)
    edges.forEach(e => {
      if (incoming[e.target] !== undefined) incoming[e.target]++
    })

    let queue = nodes.filter(n => incoming[n.id] === 0).map(n => n.id)
    const visited = new Set()
    const levels = {}

    queue.forEach(id => {
      levels[id] = 0
      visited.add(id)
    })

    let currentQueue = [...queue]
    while (currentQueue.length > 0) {
      const nextQueue = []
      currentQueue.forEach(id => {
        const currentLevel = levels[id]
        const outgoingEdges = edges.filter(e => e.source === id)
        outgoingEdges.forEach(e => {
          if (!visited.has(e.target)) {
            levels[e.target] = Math.max(levels[e.target] || 0, currentLevel + 1)
            visited.add(e.target)
            nextQueue.push(e.target)
          }
        })
      })
      currentQueue = nextQueue
    }

    const levelCounts = {}
    const newNodes = nodes.map(n => {
      const lvl = levels[n.id] || 0
      levelCounts[lvl] = (levelCounts[lvl] || 0) + 1
      return {
        ...n,
        position: {
          x: 150 + lvl * 320,
          y: 150 + (levelCounts[lvl] - 1) * 165
        }
      }
    })
    setNodes(newNodes)
  }

  // Copy-paste keydown shortcuts
  const handleCopy = useCallback(() => {
    if (selectedNodeId) {
      const node = nodes.find(n => n.id === selectedNodeId)
      if (node && node.type !== 'start') setCopiedNode(node)
    }
  }, [selectedNodeId, nodes])

  const handlePaste = useCallback(() => {
    if (copiedNode) {
      pushState(nodes, edges)
      const id = `node-${copiedNode.type}-${Date.now()}`
      const pasted = {
        id,
        type: copiedNode.type,
        position: { x: copiedNode.position.x + 80, y: copiedNode.position.y + 80 },
        data: { ...JSON.parse(JSON.stringify(copiedNode.data)), execution: null }
      }
      setNodes([...nodes, pasted])
    }
  }, [copiedNode, nodes, edges, setNodes, pushState])

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMeta = e.metaKey || e.ctrlKey
      if (isMeta && e.key === 's') {
        e.preventDefault()
        handleSaveWorkflow()
      } else if (isMeta && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        const prev = undo(nodes, edges)
        if (prev) { setNodes(prev.nodes); setEdges(prev.edges) }
      } else if (isMeta && e.shiftKey && e.key === 'Z') {
        e.preventDefault()
        const next = redo(nodes, edges)
        if (next) { setNodes(next.nodes); setEdges(next.edges) }
      } else if (isMeta && e.key === 'c') {
        handleCopy()
      } else if (isMeta && e.key === 'v') {
        handlePaste()
      } else if (isMeta && e.key === 'Enter') {
        e.preventDefault()
        handleExecuteWorkflow()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nodes, edges, selectedNodeId, copiedNode, undo, redo])

  // Execute Workflow run trigger
  const handleExecuteWorkflow = async () => {
    let runWorkflowId = workflowId || activeWorkflow?.id
    if (!runWorkflowId) {
      const saved = await handleSaveWorkflow()
      runWorkflowId = saved?.id
    }
    if (!runWorkflowId) return alert('Please save workflow first')
    setExecuting(true)
    setExecutionStatus('RUNNING')
    setExecutionStartTime(Date.now())
    setExecutionDuration(null)
    setExecutionProgress({ completed: 0, total: nodes.filter(n => n.type !== 'sticky_note').length })

    try {
      const res = await api.post(`/workflows/${runWorkflowId}/trigger`)
      setExecutionRunId(res.data.id)
    } catch (e) {
      setExecuting(false)
      setExecutionStatus('FAILED')
      alert(e.response?.data?.error || 'Failed to trigger run')
    }
  }

  // Socket.IO run listeners
  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !executionRunId || executionStatus !== 'RUNNING') return

    const room = `workflow:${executionRunId}`
    socket.emit('join', { room })

    socket.on('node.started', handleNodeStarted)
    socket.on('node.completed', handleNodeCompleted)
    socket.on('node.failed', handleNodeFailed)
    
    socket.on('workflow.completed', () => {
      setExecutionStatus('SUCCESS')
      setExecuting(false)
      setExecutionDuration(Date.now() - (executionStartTime || Date.now()))
      fetchRunDetails(executionRunId)
    })

    socket.on('workflow.failed', (e) => {
      setExecutionStatus('FAILED')
      setExecuting(false)
      setExecutionDuration(Date.now() - (executionStartTime || Date.now()))
      fetchRunDetails(executionRunId)
    })

    return () => {
      socket.off('node.started', handleNodeStarted)
      socket.off('node.completed', handleNodeCompleted)
      socket.off('node.failed', handleNodeFailed)
      socket.emit('leave', { room })
    }
  }, [socketRef.current, executionRunId, executionStatus, executionStartTime])

  // Export JSON file download
  const handleExportJSON = async () => {
    if (!workflowId) return
    try {
      const res = await api.get(`/workflows/${workflowId}/export`)
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${activeWorkflow?.name || 'workflow'}-export.json`
      a.click()
    } catch (e) {
      alert('Export failed: ' + e.message)
    }
  }

  // Import JSON file upload
  const handleImportJSON = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result)
        const res = await api.post('/workflows/import', parsed)
        navigate(`/builder?id=${res.data.id}`, { replace: true })
        window.location.reload()
      } catch (err) {
        alert('Failed to import workflow file: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  const handleRestoreVersion = async (vNum) => {
    if (!workflowId) return
    if (confirm(`Restore workflow to version ${vNum}? Current canvas unsaved changes will be replaced.`)) {
      try {
        await api.post(`/workflows/${workflowId}/versions/${vNum}/restore`)
        loadWorkflow(workflowId)
        setShowVersionsModal(false)
      } catch (err) {
        alert('Restore failed: ' + err.message)
      }
    }
  }

  const selectedNode = nodes.find(n => n.id === selectedNodeId)
  const selectedNodeTypeDef = selectedNode ? nodeLibrary.find(t => t.name === selectedNode.type) : null
  const selectedNodeConfig = selectedNode?.data?.config || {}

  // Filtered sidebar registry library nodes
  const filteredLibrary = nodeLibrary.filter(item => 
    item.displayName?.toLowerCase().includes(librarySearch.toLowerCase()) ||
    item.description?.toLowerCase().includes(librarySearch.toLowerCase()) ||
    item.name?.toLowerCase().includes(librarySearch.toLowerCase())
  )

  return (
    <div className="relative w-full h-full flex bg-zinc-950 overflow-hidden text-xs">
      
      {/* 1. LEFT SIDEBAR: Catalog items */}
      <div className="w-72 border-r border-zinc-800 flex flex-col bg-zinc-950 z-10 select-none">
        <div className="p-4 border-b border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-zinc-150">Node Catalog</h3>
            <span className="text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Drag to add</span>
          </div>
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 text-zinc-650 h-3.5 w-3.5" />
            <input
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
              placeholder="Search nodes..."
              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 focus:bg-zinc-905"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {['Triggers', 'Core', 'Logic', 'Flow', 'Integration'].map(cat => {
            const items = filteredLibrary.filter(x => x.category === cat)
            if (items.length === 0) return null

            return (
              <div key={cat} className="space-y-2">
                <span className="text-[9px] font-extrabold text-zinc-550 uppercase tracking-widest block">{cat}</span>
                <div className="grid grid-cols-1 gap-1.5">
                  {items.map(item => (
                    <div
                      key={item.name}
                      draggable
                      onDragStart={(e) => onDragStart(e, item.name)}
                      className="group flex items-center justify-between p-2.5 bg-zinc-900/25 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-750/80 rounded-xl cursor-grab active:cursor-grabbing transition-all duration-150 relative"
                    >
                      <div className="flex gap-2.5 items-center min-w-0 flex-1">
                        <div className="h-7 w-7 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                          {item.displayName?.charAt(0) || 'N'}
                        </div>
                        <div className="text-left min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors truncate">{item.displayName}</h4>
                          <p className="text-[9px] text-zinc-600 truncate">{item.description}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const offsetX = 250 + Math.random() * 80
                          const offsetY = 150 + Math.random() * 80
                          handleDropNode(item.name, { x: offsetX, y: offsetY })
                        }}
                        className="h-5 w-5 rounded-full bg-zinc-800 hover:bg-indigo-600 text-zinc-500 hover:text-white flex items-center justify-center shrink-0 border border-zinc-750 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900/10">
          <Link to="/workflows" className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 font-bold transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* 2. CENTER CANVAS AREA */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-zinc-950">
        
        {/* Topbar actions */}
        <div className="h-14 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between z-10 select-none">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <input
                  value={activeWorkflow?.name || ''}
                  onChange={(e) => updateActiveWorkflowMeta({ name: e.target.value })}
                  className="bg-transparent border-none p-0 text-xs font-black text-zinc-100 focus:outline-none focus:ring-0 w-48 hover:bg-zinc-900/30 rounded px-1 -mx-1"
                />
                <Badge variant={activeWorkflow?.status === 'ACTIVE' ? 'success' : 'default'}>
                  {activeWorkflow?.status || 'DRAFT'}
                </Badge>
              </div>
              <input
                value={activeWorkflow?.description || ''}
                onChange={(e) => updateActiveWorkflowMeta({ description: e.target.value })}
                placeholder="Write description..."
                className="bg-transparent border-none p-0 text-[10px] text-zinc-650 focus:outline-none focus:ring-0 w-64 block mt-0.5"
              />
            </div>
            
            {/* Display active workflow tags */}
            <div className="flex gap-1.5 ml-2">
              {workflowTags.map(t => (
                <span key={t.id} className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow-sm" style={{ backgroundColor: t.color }}>
                  {t.name}
                </span>
              ))}
              <button 
                onClick={() => setShowTagsModal(true)}
                className="p-1 hover:bg-zinc-900 border border-zinc-800 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
                title="Add Tags"
              >
                <Tag className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-layout button */}
            <button
              onClick={handleAutoLayout}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 border border-zinc-850"
              title="Auto Layout Nodes"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>

            {/* Undo / Redo controls */}
            <button
              onClick={() => {
                const prev = undo(nodes, edges)
                if (prev) { setNodes(prev.nodes); setEdges(prev.edges) }
              }}
              disabled={!canUndo()}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed border border-zinc-850"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                const next = redo(nodes, edges)
                if (next) { setNodes(next.nodes); setEdges(next.edges) }
              }}
              disabled={!canRedo()}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed border border-zinc-850"
            >
              <Redo2 className="h-4 w-4" />
            </button>

            <div className="w-px h-6 bg-zinc-800 mx-1" />

            {/* Version and Snapshots */}
            <button 
              onClick={() => setShowVersionsModal(true)}
              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-855 text-zinc-400 border border-zinc-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
            >
              <History className="h-3.5 w-3.5" />
              <span>v{activeWorkflow?.version || 1}</span>
            </button>

            {/* Import / Export JSON buttons */}
            <button 
              onClick={handleExportJSON}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-250 border border-zinc-850"
              title="Export JSON"
            >
              <FolderDown className="h-4 w-4" />
            </button>
            <label className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-250 border border-zinc-850 cursor-pointer" title="Import JSON">
              <FolderUp className="h-4 w-4" />
              <input type="file" onChange={handleImportJSON} accept=".json" className="hidden" />
            </label>

            {/* Save / Publish / Execute */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveWorkflow}
              loading={isSaving}
              icon={Save}
            >
              Save
            </Button>
            
            <Button
              size="sm"
              onClick={handlePublishWorkflow}
              icon={UploadCloud}
            >
              Publish
            </Button>

            <div className="w-px h-6 bg-zinc-800 mx-1" />

            <Button
              size="sm"
              onClick={handleExecuteWorkflow}
              loading={executing}
              icon={Zap}
              disabled={executing}
              className="!bg-emerald-600 hover:!bg-emerald-500 !border-emerald-500"
            >
              Execute
            </Button>
          </div>
        </div>

        {/* Workflow Editor Canvas */}
        <div className="flex-1 w-full h-full">
          <FlowEditor
            nodes={processedNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onNodeClick={(e, node) => setSelectedNodeId(node.id)}
            onDropNode={handleDropNode}
            reactFlowWrapper={reactFlowWrapper}
            onNodeContextMenu={handleNodeContextMenu}
            onPaneContextMenu={handlePaneContextMenu}
            onDeleteEdge={(edgeId) => setEdges(edges.filter(e => e.id !== edgeId))}
          />
        </div>

        {/* Execution progress bottom drawer */}
        <AnimatePresence>
          {executionStatus && (
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-5 py-2.5 rounded-full border shadow-2xl backdrop-blur-xl ${
                executionStatus === 'RUNNING' 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-amber-500/10' 
                  : executionStatus === 'SUCCESS'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-emerald-500/10'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-rose-500/10'
              }`}
            >
              {executionStatus === 'RUNNING' && <Loader2 className="h-4 w-4 animate-spin" />}
              {executionStatus === 'SUCCESS' && <CheckCircle2 className="h-4 w-4" />}
              {executionStatus === 'FAILED' && <XCircle className="h-4 w-4" />}
              
              <span className="text-xs font-bold">
                {executionStatus === 'RUNNING' 
                  ? `Executing... ${executionProgress.completed}/${executionProgress.total} nodes`
                  : executionStatus === 'SUCCESS'
                  ? `Execution succeeded${executionDuration ? ` in ${(executionDuration / 1000).toFixed(1)}s` : ''}`
                  : `Execution failed${executionDuration ? ` after ${(executionDuration / 1000).toFixed(1)}s` : ''}`
                }
              </span>
              <button onClick={() => { setExecutionStatus(null); setExecutionRunId(null); }} className="text-zinc-500 hover:text-zinc-300 ml-1">✕</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. RIGHT CONFIG/EXECUTION DRAWER SIDEBAR */}
      <div className="w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col z-10 select-none">
        
        {/* Sidebar tabs */}
        <div className="border-b border-zinc-800 bg-zinc-900/10">
          <div className="flex">
            <button
              onClick={() => setActivePanelTab('parameters')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors border-b-2 ${
                activePanelTab === 'parameters'
                  ? 'text-zinc-100 border-zinc-100 font-extrabold'
                  : 'text-zinc-500 border-transparent hover:text-zinc-350'
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              Parameters
            </button>
            <button
              onClick={() => setActivePanelTab('output')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors border-b-2 ${
                activePanelTab === 'output'
                  ? 'text-zinc-100 border-zinc-100 font-extrabold'
                  : 'text-zinc-500 border-transparent hover:text-zinc-350'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              Exec Output
            </button>
          </div>
        </div>

        {/* Tab view containers */}
        <div className="flex-1 overflow-y-auto">
          {activePanelTab === 'parameters' ? (
            selectedNode ? (
              <div className="p-4 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-zinc-150 uppercase tracking-wider">Node parameters</h3>
                  <button 
                    onClick={() => deleteNode(selectedNode)}
                    className="p-1 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Custom Node Name"
                    value={selectedNode.data?.label || ''}
                    onChange={(e) => setNodes(nodes.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, label: e.target.value } } : n))}
                  />
                  
                  {/* Credential Selectors if declared */}
                  {selectedNodeTypeDef?.credentials?.map(cred => (
                    <CredentialSelector
                      key={cred.name}
                      credTypeNeeded={cred.name}
                      value={selectedNodeConfig[`${cred.name}Id`] || ''}
                      onChange={(val) => handleNodeConfigChange(`${cred.name}Id`, val)}
                    />
                  ))}

                  {/* Render node-types properties */}
                  {selectedNodeTypeDef ? (
                    <ParameterRenderer
                      properties={selectedNodeTypeDef.properties || []}
                      values={selectedNodeConfig}
                      onChange={handleNodeConfigChange}
                      nodeData={selectedNode.data}
                      previousNodes={nodes.filter(n => n.id !== selectedNodeId)}
                    />
                  ) : (
                    <div className="text-[10px] text-zinc-550 italic">Start Trigger has no configurable properties. Use downstream nodes to process and query APIs.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                <LayoutGrid className="h-8 w-8 text-zinc-800 mb-3" />
                <h4 className="font-bold">No Node Selected</h4>
                <p className="text-[10px] text-zinc-650 mt-1">Select a workflow node on the canvas to configure credentials, properties, and custom code.</p>
              </div>
            )
          ) : (
            // Execution details outputs
            selectedNode && activeNodeExecs[selectedNode.id] ? (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <h3 className="font-bold text-xs text-zinc-350">RUN METRICS</h3>
                  <Badge variant={activeNodeExecs[selectedNode.id].status === 'SUCCESS' ? 'success' : 'danger'}>
                    {activeNodeExecs[selectedNode.id].status}
                  </Badge>
                </div>
                
                {activeNodeExecs[selectedNode.id].durationMs != null && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Run Duration:</span>
                    <span className="text-zinc-200 font-bold font-mono">{activeNodeExecs[selectedNode.id].durationMs}ms</span>
                  </div>
                )}

                {activeNodeExecs[selectedNode.id].inputData && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider block">Input Payload</span>
                    <pre className="p-2 bg-zinc-950 border border-zinc-850 rounded-lg text-zinc-400 font-mono text-[9px] max-h-48 overflow-y-auto">
                      {JSON.stringify(activeNodeExecs[selectedNode.id].inputData, null, 2)}
                    </pre>
                  </div>
                )}

                {activeNodeExecs[selectedNode.id].outputData && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">Output Payload</span>
                    <pre className="p-2 bg-zinc-955 border border-emerald-950/25 rounded-lg text-emerald-400/90 font-mono text-[9px] max-h-48 overflow-y-auto">
                      {JSON.stringify(activeNodeExecs[selectedNode.id].outputData, null, 2)}
                    </pre>
                  </div>
                )}

                {activeNodeExecs[selectedNode.id].errorMessage && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Execution Error</span>
                    <div className="p-2 bg-zinc-950 border border-rose-950 rounded-lg text-rose-400/90 font-mono text-[9px] break-words">
                      {activeNodeExecs[selectedNode.id].errorMessage}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                <Terminal className="h-8 w-8 text-zinc-800 mb-3" />
                <h4 className="font-bold">No Run Data Available</h4>
                <p className="text-[10px] text-zinc-650 mt-1">Run an execution trigger to inspect input payloads and response objects.</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Context menus */}
      <NodeContextMenu
        visible={contextMenu.visible}
        position={contextMenu.position}
        node={contextMenu.node}
        onDuplicate={duplicateNode}
        onDelete={deleteNode}
        onToggleDisable={(node) => setNodes(nodes.map(n => n.id === node.id ? { ...n, disabled: !n.disabled } : n))}
        onRename={startRenameNode}
        onClose={() => setContextMenu({ visible: false, position: { x: 0, y: 0 }, node: null })}
      />

      {/* Node Picker Popover */}
      <NodePickerPopover
        visible={nodePicker.visible}
        position={nodePicker.position}
        sourceNodeId={nodePicker.sourceNodeId}
        sourceHandle={nodePicker.sourceHandle}
        onSelectType={handlePickerSelectType}
        onClose={() => setNodePicker({ visible: false, position: { x: 0, y: 0 }, sourceNodeId: null, sourceHandle: null })}
      />

      {/* Rename dialog */}
      <Modal
        isOpen={renameModal.visible}
        onClose={() => setRenameModal({ visible: false, nodeId: null, label: '' })}
        title="Rename Node"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setRenameModal({ visible: false, nodeId: null, label: '' })}>Cancel</Button>
            <Button size="sm" onClick={applyRename}>Apply</Button>
          </div>
        }
      >
        <Input
          label="Custom Node Name"
          value={renameModal.label}
          onChange={(e) => setRenameModal(prev => ({ ...prev, label: e.target.value }))}
          autoFocus
        />
      </Modal>

      {/* Tags Popover Modal */}
      <Modal
        isOpen={showTagsModal}
        onClose={() => setShowTagsModal(false)}
        title="Manage Workflow Tags"
      >
        <div className="space-y-4">
          <p className="text-[10px] text-zinc-400">Select which workspace tags should be applied to categorise this workflow pipeline.</p>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => {
              const isBound = workflowTags.some(t => t.id === tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={() => handleToggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${isBound ? 'text-white border-transparent' : 'bg-transparent text-zinc-550 border-zinc-800 hover:border-zinc-700'}`}
                  style={{ backgroundColor: isBound ? tag.color : undefined }}
                >
                  {tag.name}
                </button>
              )
            })}
            {tags.length === 0 && (
              <span className="text-[10px] text-zinc-550 italic">No workspace tags created. Manage workspace tags in System Settings.</span>
            )}
          </div>
        </div>
      </Modal>

      {/* Versions history Modal */}
      <Modal
        isOpen={showVersionsModal}
        onClose={() => setShowVersionsModal(false)}
        title="Version Snapshot History"
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {versions.map(v => (
            <div key={v.id} className="p-3.5 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between text-xs transition-all duration-150">
              <div>
                <span className="font-bold text-zinc-200">Version {v.version}</span>
                <span className="text-[10px] text-zinc-550 block mt-0.5">{new Date(v.createdAt).toLocaleString()}</span>
                <span className="text-[10px] text-zinc-400 block mt-1 font-semibold">Comment: {v.comment || 'No snapshot description'}</span>
              </div>
              <button
                onClick={() => handleRestoreVersion(v.version)}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-indigo-600 text-zinc-350 hover:text-white rounded border border-zinc-700/60 transition-all font-bold"
              >
                Restore Snapshot
              </button>
            </div>
          ))}
          {versions.length === 0 && (
            <div className="text-center py-6 text-zinc-550 italic">No published versions history found. Save and publish changes to create snapshots.</div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default function WorkflowBuilder() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent />
    </ReactFlowProvider>
  )
}
