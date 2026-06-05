import React, { useCallback, useState, useMemo } from 'react'
import ReactFlow, { 
  Controls, 
  Background, 
  MiniMap,
  addEdge,
  useReactFlow,
  Panel,
  SelectionMode
} from 'reactflow'
import 'reactflow/dist/style.css'
import { TriggerNode, ActionNode, LogicNode } from './CustomNodes'
import StickyNote from './StickyNote'
import DeletableEdge from './DeletableEdge'

const nodeTypes = {
  start: (props) => <TriggerNode {...props} type="start" />,
  webhook: (props) => <TriggerNode {...props} type="webhook" />,
  schedule: (props) => <TriggerNode {...props} type="schedule" />,
  http_request: (props) => <ActionNode {...props} type="http_request" />,
  notify: (props) => <ActionNode {...props} type="notify" />,
  delay: (props) => <ActionNode {...props} type="delay" />,
  condition: (props) => <LogicNode {...props} type="condition" />,
  sticky_note: StickyNote,
  
  // Newly introduced node types
  set: (props) => <ActionNode {...props} type="set" />,
  code: (props) => <ActionNode {...props} type="code" />,
  filter: (props) => <ActionNode {...props} type="filter" />,
  switch: (props) => <LogicNode {...props} type="switch" />,
  merge: (props) => <LogicNode {...props} type="merge" />,
  json: (props) => <ActionNode {...props} type="json" />,
  respondToWebhook: (props) => <ActionNode {...props} type="respondToWebhook" />,
  splitInBatches: (props) => <ActionNode {...props} type="splitInBatches" />,
  loop: (props) => <LogicNode {...props} type="loop" />,
  wait: (props) => <ActionNode {...props} type="wait" />,
  executeWorkflow: (props) => <ActionNode {...props} type="executeWorkflow" />,
  dateTime: (props) => <ActionNode {...props} type="dateTime" />,
  csv: (props) => <ActionNode {...props} type="csv" />,
  postgres: (props) => <ActionNode {...props} type="postgres" />,
  redis: (props) => <ActionNode {...props} type="redis" />,
  emailImap: (props) => <TriggerNode {...props} type="emailImap" />,
  
  // Normalized/Alias names
  if: (props) => <LogicNode {...props} type="if" />,
  httpRequest: (props) => <ActionNode {...props} type="httpRequest" />,
}

export default function FlowEditor({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  onConnect,
  onNodeClick,
  onDropNode,
  reactFlowWrapper,
  onNodeContextMenu,
  onPaneContextMenu,
  onDeleteEdge,
  onEdgeClick
}) {
  const [reactFlowInstance, setReactFlowInstance] = useState(null)

  // Create edge types with delete callback
  const edgeTypes = useMemo(() => ({
    deletable: DeletableEdge
  }), [])

  // Process edges to inject delete callback and set type
  const processedEdges = useMemo(() => {
    return edges.map(edge => ({
      ...edge,
      type: 'deletable',
      data: {
        ...edge.data,
        onDelete: onDeleteEdge
      }
    }))
  }, [edges, onDeleteEdge])

  const onDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event) => {
      event.preventDefault()

      if (!reactFlowInstance || !reactFlowWrapper.current) return

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      const type = event.dataTransfer.getData('application/reactflow')

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return
      }

      // Calculate position relative to container
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top
      })

      if (onDropNode) {
        onDropNode(type, position)
      }
    },
    [reactFlowInstance, onDropNode, reactFlowWrapper]
  )

  const handleNodeContextMenu = useCallback((event, node) => {
    event.preventDefault()
    if (onNodeContextMenu) {
      onNodeContextMenu(event, node)
    }
  }, [onNodeContextMenu])

  const handlePaneContextMenu = useCallback((event) => {
    event.preventDefault()
    if (onPaneContextMenu) {
      onPaneContextMenu(event)
    }
  }, [onPaneContextMenu])

  return (
    <div className="w-full h-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={processedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onNodeContextMenu={handleNodeContextMenu}
        onPaneContextMenu={handlePaneContextMenu}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        deleteKeyCode={['Delete', 'Backspace']}
        selectionOnDrag
        selectionMode={SelectionMode.Partial}
        panOnDrag={[1, 2]}
        snapToGrid
        snapGrid={[16, 16]}
        fitView
        className="bg-zinc-950"
        defaultEdgeOptions={{
          animated: true,
          type: 'deletable'
        }}
      >
        <Controls showInteractive={false} className="bg-zinc-900 border border-zinc-800" />
        <MiniMap 
          nodeColor={(node) => {
            if (node.type === 'sticky_note') return '#fbbf24'
            if (node.type === 'start' || node.type === 'webhook' || node.type === 'schedule') return '#6366f1'
            if (node.type === 'condition') return '#fbbf24'
            return '#10b981'
          }}
          maskColor="rgba(24, 24, 27, 0.7)"
          className="bg-zinc-900/80 border border-zinc-800 rounded-lg overflow-hidden !m-4"
        />
        <Background color="#27272a" gap={16} size={1} />
      </ReactFlow>
    </div>
  )
}
