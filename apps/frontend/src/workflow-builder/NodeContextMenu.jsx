import React, { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Copy,
  Trash2,
  EyeOff,
  Eye,
  Type,
  Play,
  MoreHorizontal
} from 'lucide-react'

export default function NodeContextMenu({
  visible,
  position,
  node,
  onDuplicate,
  onDelete,
  onToggleDisable,
  onRename,
  onExecuteUpTo,
  onClose
}) {
  const menuRef = useRef(null)

  useEffect(() => {
    if (!visible) return
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [visible, onClose])

  if (!visible || !node) return null

  const isDisabled = node.data?.disabled

  const menuItems = [
    {
      label: 'Execute up to here',
      icon: Play,
      onClick: () => { onExecuteUpTo?.(node); onClose() },
      className: 'text-emerald-400 hover:bg-emerald-500/10'
    },
    { divider: true },
    {
      label: 'Rename',
      icon: Type,
      shortcut: 'F2',
      onClick: () => { onRename?.(node); onClose() },
      className: 'text-zinc-300 hover:bg-zinc-800'
    },
    {
      label: 'Duplicate',
      icon: Copy,
      shortcut: 'Ctrl+D',
      onClick: () => { onDuplicate?.(node); onClose() },
      className: 'text-zinc-300 hover:bg-zinc-800'
    },
    {
      label: isDisabled ? 'Enable' : 'Disable',
      icon: isDisabled ? Eye : EyeOff,
      shortcut: 'D',
      onClick: () => { onToggleDisable?.(node); onClose() },
      className: 'text-zinc-300 hover:bg-zinc-800'
    },
    { divider: true },
    {
      label: 'Delete',
      icon: Trash2,
      shortcut: 'Del',
      onClick: () => { onDelete?.(node); onClose() },
      className: 'text-rose-400 hover:bg-rose-500/10'
    }
  ]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.92, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -4 }}
          transition={{ duration: 0.12 }}
          className="fixed z-[9999] min-w-[200px] bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/60 rounded-xl shadow-2xl shadow-black/40 overflow-hidden py-1.5"
          style={{
            left: Math.min(position.x, window.innerWidth - 220),
            top: Math.min(position.y, window.innerHeight - 300)
          }}
        >
          {/* Node type header */}
          <div className="px-3 py-2 border-b border-zinc-800/60 flex items-center gap-2">
            <MoreHorizontal className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider truncate">
              {node.data?.label || node.type}
            </span>
          </div>

          {menuItems.map((item, idx) => {
            if (item.divider) {
              return <div key={idx} className="my-1 border-t border-zinc-800/50" />
            }
            const Icon = item.icon
            return (
              <button
                key={idx}
                onClick={item.onClick}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${item.className}`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.shortcut && (
                  <span className="text-[9px] text-zinc-600 font-mono bg-zinc-800/60 px-1.5 py-0.5 rounded">
                    {item.shortcut}
                  </span>
                )}
              </button>
            )
          })}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
