import React, { useState, useCallback } from 'react'
import { NodeResizer } from 'reactflow'

export default function StickyNote({ data, selected, id }) {
  const [isEditing, setIsEditing] = useState(false)

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true)
  }, [])

  const handleBlur = useCallback((e) => {
    setIsEditing(false)
    if (data.onContentChange) {
      data.onContentChange(id, e.target.value)
    }
  }, [data, id])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setIsEditing(false)
    }
    // Prevent React Flow from capturing keyboard events while editing
    e.stopPropagation()
  }, [])

  return (
    <>
      <NodeResizer
        minWidth={160}
        minHeight={100}
        isVisible={selected}
        lineClassName="!border-amber-500/40"
        handleClassName="!bg-amber-500 !border-amber-600 !w-2.5 !h-2.5"
      />
      <div
        className={`
          w-full h-full min-w-[160px] min-h-[100px] p-4
          bg-block-cream border-2
          ${selected ? 'border-amber-500 shadow-lg shadow-amber-500/10' : 'border-amber-800/20'}
          rounded-lg transition-all duration-200
          ${selected ? 'ring-1 ring-amber-500/30' : ''}
        `}
        onDoubleClick={handleDoubleClick}
      >
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-2 pointer-events-none select-none">
          <div className="w-2 h-2 rounded-full bg-amber-500/60" />
          <span className="text-[9px] font-bold text-zinc-950/40 uppercase tracking-wider">
            Note
          </span>
        </div>

        {/* Content */}
        {isEditing ? (
          <textarea
            autoFocus
            defaultValue={data.content || ''}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full h-[calc(100%-28px)] bg-transparent border-none resize-none text-xs text-zinc-950/80 placeholder:text-zinc-950/30 focus:outline-none leading-relaxed"
            placeholder="Type your note here..."
          />
        ) : (
          <div className="text-xs text-zinc-950/70 leading-relaxed whitespace-pre-wrap break-words cursor-text min-h-[40px]">
            {data.content || (
              <span className="text-zinc-950/30 italic">Double-click to edit...</span>
            )}
          </div>
        )}
      </div>
    </>
  )
}
