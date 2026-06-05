import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Webhook,
  Clock,
  Globe,
  Bell,
  Hourglass,
  GitFork,
  Search,
  X
} from 'lucide-react'

const NODE_TYPES = [
  { type: 'start', category: 'Triggers', label: 'Start Trigger', icon: Play, color: 'bg-block-lilac' },
  { type: 'webhook', category: 'Triggers', label: 'Webhook', icon: Webhook, color: 'bg-block-lilac' },
  { type: 'schedule', category: 'Triggers', label: 'Schedule', icon: Clock, color: 'bg-block-lilac' },
  { type: 'http_request', category: 'Actions', label: 'HTTP Request', icon: Globe, color: 'bg-block-mint' },
  { type: 'notify', category: 'Actions', label: 'Notification', icon: Bell, color: 'bg-block-mint' },
  { type: 'delay', category: 'Actions', label: 'Delay', icon: Hourglass, color: 'bg-block-mint' },
  { type: 'condition', category: 'Logic', label: 'Condition', icon: GitFork, color: 'bg-block-coral' }
]

export default function NodePickerPopover({
  visible,
  position,
  sourceNodeId,
  sourceHandle,
  onSelectType,
  onClose
}) {
  const [search, setSearch] = useState('')
  const popoverRef = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    if (visible && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50)
    }
    if (!visible) setSearch('')
  }, [visible])

  useEffect(() => {
    if (!visible) return
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
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

  if (!visible) return null

  const filtered = NODE_TYPES.filter(n =>
    n.label.toLowerCase().includes(search.toLowerCase()) ||
    n.category.toLowerCase().includes(search.toLowerCase())
  )

  const categories = ['Triggers', 'Actions', 'Logic']

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.9, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -8 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="fixed z-[9999] w-[240px] bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/60 rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
          style={{
            left: Math.min(position.x, window.innerWidth - 260),
            top: Math.min(position.y, window.innerHeight - 360)
          }}
        >
          {/* Search header */}
          <div className="p-2.5 border-b border-zinc-800/60">
            <div className="relative flex items-center">
              <Search className="absolute left-2 text-zinc-600 h-3.5 w-3.5" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search nodes..."
                className="w-full bg-zinc-800/60 border border-zinc-700/40 rounded-lg pl-7 pr-7 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 placeholder:text-zinc-500"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Node list */}
          <div className="max-h-[280px] overflow-y-auto py-1.5">
            {categories.map(cat => {
              const items = filtered.filter(n => n.category === cat)
              if (items.length === 0) return null
              return (
                <div key={cat}>
                  <div className="px-3 py-1">
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                      {cat}
                    </span>
                  </div>
                  {items.map(item => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.type}
                        onClick={() => {
                          onSelectType(item.type, sourceNodeId, sourceHandle)
                          onClose()
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800/80 transition-colors"
                      >
                        <div className={`h-6 w-6 rounded-md ${item.color} flex items-center justify-center shrink-0`}>
                          <Icon className="h-3.5 w-3.5 text-zinc-950" />
                        </div>
                        <span className="font-medium">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="text-center py-6 text-zinc-500 text-xs">
                No matching nodes
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
