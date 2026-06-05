import React, { useState } from 'react'
import {
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge
} from 'reactflow'
import { X } from 'lucide-react'

export default function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data
}) {
  const [isHovered, setIsHovered] = useState(false)

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  })

  const onEdgeDelete = (evt) => {
    evt.stopPropagation()
    if (data?.onDelete) {
      data.onDelete(id)
    }
  }

  return (
    <>
      {/* Invisible wider path for easier hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="react-flow__edge-interaction"
      />
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: isHovered ? '#a78bfa' : undefined,
          strokeWidth: isHovered ? 3 : 2,
          transition: 'stroke 0.15s, stroke-width 0.15s'
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all'
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isHovered && (
            <button
              onClick={onEdgeDelete}
              className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/30 transition-all duration-150 hover:scale-110 border border-rose-400/50"
              title="Delete connection"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
