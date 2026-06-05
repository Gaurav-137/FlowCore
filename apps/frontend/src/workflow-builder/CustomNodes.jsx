import React from 'react'
import { Handle, Position } from 'reactflow'
import { 
  Webhook, 
  Clock, 
  Play, 
  Globe, 
  Bell, 
  Hourglass, 
  GitFork,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Plus,
  EyeOff,
  Settings,
  Code,
  Filter,
  GitMerge,
  Braces,
  Reply,
  Layers,
  Repeat,
  PauseCircle,
  Cpu,
  Calendar,
  FileSpreadsheet,
  Database,
  Mail,
  PenTool
} from 'lucide-react'

// Node type details helper
const NODE_DETAILS = {
  start: { icon: Play, color: 'text-black bg-block-lilac border-black/10', label: 'Start Trigger' },
  webhook: { icon: Webhook, color: 'text-black bg-block-lilac border-black/10', label: 'Webhook Trigger' },
  schedule: { icon: Clock, color: 'text-black bg-block-lilac border-black/10', label: 'Schedule Trigger' },
  emailImap: { icon: Mail, color: 'text-black bg-block-lilac border-black/10', label: 'Email Read (IMAP)' },
  
  http_request: { icon: Globe, color: 'text-black bg-block-mint border-black/10', label: 'HTTP Request' },
  httpRequest: { icon: Globe, color: 'text-black bg-block-mint border-black/10', label: 'HTTP Request' },
  notify: { icon: Bell, color: 'text-black bg-block-mint border-black/10', label: 'Notification' },
  delay: { icon: Hourglass, color: 'text-black bg-block-mint border-black/10', label: 'Delay' },
  set: { icon: PenTool, color: 'text-black bg-block-mint border-black/10', label: 'Set/Transform' },
  code: { icon: Code, color: 'text-black bg-block-mint border-black/10', label: 'JavaScript Code' },
  json: { icon: Braces, color: 'text-black bg-block-mint border-black/10', label: 'JSON Tool' },
  respondToWebhook: { icon: Reply, color: 'text-black bg-block-mint border-black/10', label: 'Respond webhook' },
  executeWorkflow: { icon: Cpu, color: 'text-black bg-block-mint border-black/10', label: 'Sub Workflow' },
  dateTime: { icon: Calendar, color: 'text-black bg-block-mint border-black/10', label: 'Date & Time' },
  csv: { icon: FileSpreadsheet, color: 'text-black bg-block-mint border-black/10', label: 'CSV Parser' },
  postgres: { icon: Database, color: 'text-black bg-block-mint border-black/10', label: 'PostgreSQL' },
  redis: { icon: Database, color: 'text-black bg-block-mint border-black/10', label: 'Redis Cache' },
  
  condition: { icon: GitFork, color: 'text-black bg-block-coral border-black/10', label: 'Condition' },
  if: { icon: GitFork, color: 'text-black bg-block-coral border-black/10', label: 'IF Branch' },
  filter: { icon: Filter, color: 'text-black bg-block-coral border-black/10', label: 'Filter Items' },
  switch: { icon: GitFork, color: 'text-black bg-block-coral border-black/10', label: 'Switch Option' },
  merge: { icon: GitMerge, color: 'text-black bg-block-coral border-black/10', label: 'Merge Stream' },
  loop: { icon: Repeat, color: 'text-black bg-block-coral border-black/10', label: 'Loop Iterator' },
  wait: { icon: PauseCircle, color: 'text-black bg-block-coral border-black/10', label: 'Wait Event' },
  splitInBatches: { icon: Layers, color: 'text-black bg-block-coral border-black/10', label: 'Split Batches' }
}

function ExecutionStatusBadge({ status, durationMs, error }) {
  if (!status) return null

  if (status === 'RUNNING') {
    return (
      <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-amber-500 text-black text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-lg shadow-amber-500/30 animate-pulse z-10">
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
        <span>Running</span>
      </div>
    )
  }

  if (status === 'SUCCESS') {
    return (
      <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-lg shadow-emerald-500/30 z-10">
        <CheckCircle className="h-2.5 w-2.5" />
        {durationMs != null && <span>{durationMs}ms</span>}
      </div>
    )
  }

  if (status === 'FAILED') {
    return (
      <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-rose-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-lg shadow-rose-500/30 z-10" title={error || 'Execution failed'}>
        <AlertTriangle className="h-2.5 w-2.5" />
        <span>Failed</span>
      </div>
    )
  }

  return null
}

function AddNodeButton({ onClick, position = 'right', handleId }) {
  const handleClick = (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (onClick) {
      const rect = e.currentTarget.getBoundingClientRect()
      onClick({ x: rect.right + 8, y: rect.top - 20 }, handleId)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="absolute z-20 w-5 h-5 rounded-full bg-zinc-800 hover:bg-indigo-500 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-700 hover:border-indigo-400 transition-all duration-150 hover:scale-125 opacity-0 group-hover:opacity-100 shadow-lg"
      style={{
        right: position === 'right' ? -28 : undefined,
        top: '50%',
        transform: 'translateY(-50%)'
      }}
      title="Add connected node"
    >
      <Plus className="h-3 w-3" />
    </button>
  )
}

function BaseCustomNode({ type, label, selected, children, isConfigured, execution, disabled, nodeId, onAddNode }) {
  const details = NODE_DETAILS[type] || { icon: Globe, color: 'text-black bg-zinc-200 border-black/10', label: type }
  const Icon = details.icon

  // Determine sticky note style based on type
  let bgClass = 'bg-zinc-900 text-zinc-100 border-zinc-800'
  let labelColor = 'text-zinc-100'
  let subColor = 'text-zinc-400 font-semibold'
  let statusDotColor = isConfigured ? 'bg-emerald-500' : 'bg-zinc-550'

  if (type === 'start' || type === 'webhook' || type === 'schedule') {
    bgClass = 'bg-block-lilac text-black border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
    labelColor = 'text-zinc-950 font-black'
    subColor = 'text-zinc-800 font-bold'
    statusDotColor = isConfigured ? 'bg-emerald-600' : 'bg-zinc-500'
  } else if (type === 'http_request' || type === 'notify' || type === 'delay') {
    bgClass = 'bg-block-mint text-black border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
    labelColor = 'text-zinc-950 font-black'
    subColor = 'text-zinc-800 font-bold'
    statusDotColor = isConfigured ? 'bg-emerald-600' : 'bg-zinc-500'
  } else if (type === 'condition') {
    bgClass = 'bg-block-coral text-black border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
    labelColor = 'text-zinc-950 font-black'
    subColor = 'text-zinc-800 font-bold'
    statusDotColor = isConfigured ? 'bg-emerald-600' : 'bg-zinc-500'
  }

  // Execution status border overrides
  let execBorderClass = ''
  if (execution?.status === 'RUNNING') {
    execBorderClass = 'ring-2 ring-amber-400/60 ring-offset-1 ring-offset-zinc-950 animate-pulse'
  } else if (execution?.status === 'SUCCESS') {
    execBorderClass = 'ring-2 ring-emerald-400/50 ring-offset-1 ring-offset-zinc-950'
  } else if (execution?.status === 'FAILED') {
    execBorderClass = 'ring-2 ring-rose-400/50 ring-offset-1 ring-offset-zinc-950'
  }

  // Disabled state
  const disabledClass = disabled ? 'opacity-40 grayscale pointer-events-none' : ''

  // Selected or Hover Class transitions
  const selectedClass = selected 
    ? 'ring-2 ring-zinc-950 ring-offset-2 ring-offset-zinc-900 scale-[1.02] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]' 
    : 'hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]'

  return (
    <div className={`group relative px-4 py-3 rounded-2xl ${bgClass} ${selectedClass} ${execBorderClass} ${disabledClass} flex items-center gap-3.5 transition-all duration-200 cursor-pointer min-w-[210px]`}>
      
      {/* Execution status badge */}
      <ExecutionStatusBadge 
        status={execution?.status} 
        durationMs={execution?.durationMs}
        error={execution?.error}
      />

      {/* Disabled indicator */}
      {disabled && (
        <div className="absolute top-2 right-3 flex items-center">
          <EyeOff className="h-3.5 w-3.5 text-zinc-500" />
        </div>
      )}

      {/* Node status dot */}
      {!disabled && !execution?.status && (
        <div className="absolute top-2.5 right-3 flex items-center">
          <span className={`w-2 h-2 rounded-full ${statusDotColor} border border-black/10`} />
        </div>
      )}

      {/* Icon Wrapper */}
      <div className="h-9 w-9 rounded-full bg-zinc-950 text-white border-2 border-zinc-950 flex items-center justify-center shrink-0">
        <Icon className="h-4.5 w-4.5" />
      </div>

      <div className="text-left flex-1 min-w-0 pr-2">
        <div className={`text-xs ${labelColor} truncate`}>{label || details.label}</div>
        <div className={`text-[9px] ${subColor} uppercase tracking-wider font-mono mt-0.5`}>{type.replace('_', ' ')}</div>
      </div>

      {children}
    </div>
  )
}

// 1. TRIGGER NODES (Start, Webhook, Schedule)
export function TriggerNode({ data, type, selected, id }) {
  const isConfigured = type === 'start' || !!data.config
  return (
    <BaseCustomNode 
      type={type} 
      label={data.label} 
      selected={selected} 
      isConfigured={isConfigured}
      execution={data.execution}
      disabled={data.disabled}
      nodeId={id}
      onAddNode={data.onAddNode}
    >
      <Handle
        type="source"
        position={Position.Right}
        id="output"
      />
      {/* Add node button */}
      <AddNodeButton onClick={data.onAddNode} handleId="output" />
    </BaseCustomNode>
  )
}

// 2. ACTION NODES (HTTP Request, Notify, Delay)
export function ActionNode({ data, type, selected, id }) {
  const isConfigured = !!data.config && Object.keys(data.config).length > 0
  return (
    <BaseCustomNode 
      type={type} 
      label={data.label} 
      selected={selected} 
      isConfigured={isConfigured}
      execution={data.execution}
      disabled={data.disabled}
      nodeId={id}
      onAddNode={data.onAddNode}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="input"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
      />
      {/* Add node button */}
      <AddNodeButton onClick={data.onAddNode} handleId="output" />
    </BaseCustomNode>
  )
}

// 3. LOGIC NODES (Condition Node)
export function LogicNode({ data, type, selected, id }) {
  const isConfigured = !!data.config && !!data.config.operator
  return (
    <BaseCustomNode 
      type={type} 
      label={data.label} 
      selected={selected} 
      isConfigured={isConfigured}
      execution={data.execution}
      disabled={data.disabled}
      nodeId={id}
      onAddNode={data.onAddNode}
    >
      {/* Target input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
      />

      {/* Output handles for conditional branches */}
      <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-around py-1.5 pointer-events-none translate-x-[5px]">
        {/* True handle */}
        <div className="flex items-center justify-end w-full relative pointer-events-auto">
          <span className="text-[9px] font-bold text-emerald-400 pr-1.5 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">True</span>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{ top: 'auto', bottom: 'auto', transform: 'none', position: 'relative', right: 0 }}
          />
        </div>

        {/* False handle */}
        <div className="flex items-center justify-end w-full relative pointer-events-auto">
          <span className="text-[9px] font-bold text-rose-400 pr-1.5 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">False</span>
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{ top: 'auto', bottom: 'auto', transform: 'none', position: 'relative', right: 0 }}
          />
        </div>
      </div>

      {/* Add node buttons for both branches */}
      <div className="absolute right-[-32px] top-0 bottom-0 flex flex-col justify-around py-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (data.onAddNode) {
              const rect = e.currentTarget.getBoundingClientRect()
              data.onAddNode({ x: rect.right + 8, y: rect.top - 20 }, 'true')
            }
          }}
          className="w-4 h-4 rounded-full bg-zinc-800 hover:bg-emerald-500 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-700 hover:border-emerald-400 transition-all duration-150 hover:scale-125 opacity-0 group-hover:opacity-100"
          title="Add node (True branch)"
        >
          <Plus className="h-2.5 w-2.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (data.onAddNode) {
              const rect = e.currentTarget.getBoundingClientRect()
              data.onAddNode({ x: rect.right + 8, y: rect.top - 20 }, 'false')
            }
          }}
          className="w-4 h-4 rounded-full bg-zinc-800 hover:bg-rose-500 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-700 hover:border-rose-400 transition-all duration-150 hover:scale-125 opacity-0 group-hover:opacity-100"
          title="Add node (False branch)"
        >
          <Plus className="h-2.5 w-2.5" />
        </button>
      </div>
    </BaseCustomNode>
  )
}
