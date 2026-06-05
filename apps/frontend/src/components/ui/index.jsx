import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react'

// ==========================================
// BUTTON
// ==========================================
export const Button = React.forwardRef(({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  ...props
}, ref) => {
  const baseStyle = 'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed active:scale-95'
  
  const variants = {
    primary: 'bg-zinc-100 hover:opacity-90 text-zinc-950 border border-transparent shadow-none',
    secondary: 'bg-zinc-950 hover:bg-zinc-900/10 text-zinc-100 border border-zinc-100',
    outline: 'bg-transparent hover:bg-zinc-100/10 text-zinc-300 border border-zinc-850 hover:border-zinc-800',
    destructive: 'bg-rose-600 hover:bg-rose-500 text-white border border-transparent shadow-none',
    ghost: 'bg-transparent hover:bg-zinc-900/60 text-zinc-400 hover:text-zinc-100'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5'
  }

  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin text-current" />}
      {!loading && Icon && <Icon className="h-4 w-4 text-current" />}
      {children}
    </button>
  )
})

// ==========================================
// INPUT
// ==========================================
export const Input = React.forwardRef(({
  label,
  error,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  className = '',
  icon: Icon,
  ...props
}, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-xs font-semibold text-zinc-400">{label}</label>}
      <div className="relative flex items-center">
        {Icon && <Icon className="absolute left-3 text-zinc-500 h-4.5 w-4.5" />}
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full glass-input text-sm ${Icon ? 'pl-10' : 'pl-3'} ${error ? 'border-rose-500/80 focus:ring-rose-500/30' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-rose-400 font-medium">{error}</span>}
    </div>
  )
})

// ==========================================
// SELECT
// ==========================================
export const Select = React.forwardRef(({
  label,
  error,
  options = [],
  value,
  onChange,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-xs font-semibold text-zinc-400">{label}</label>}
      <select
        ref={ref}
        value={value}
        onChange={onChange}
        className={`w-full glass-input text-sm appearance-none bg-zinc-900/80 border border-zinc-800 ${error ? 'border-rose-500/80' : ''} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-zinc-900 text-zinc-100">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-rose-400 font-medium">{error}</span>}
    </div>
  )
})

// ==========================================
// CARD
// ==========================================
export function Card({
  children,
  className = '',
  title,
  subtitle,
  headerActions,
  footer,
  hoverEffect = false
}) {
  return (
    <div className={`glass-card ${hoverEffect ? 'glass-panel-hover' : ''} ${className}`}>
      {(title || subtitle || headerActions) && (
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-5 gap-4">
          <div>
            {title && <h3 className="text-base font-semibold text-zinc-100">{title}</h3>}
            {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      <div className="text-sm text-zinc-300">{children}</div>
      {footer && (
        <div className="border-t border-zinc-800/80 pt-4 mt-5 flex items-center justify-end gap-2 text-zinc-400">
          {footer}
        </div>
      )}
    </div>
  )
}

// ==========================================
// BADGE
// ==========================================
export function Badge({
  children,
  variant = 'default',
  className = ''
}) {
  const styles = {
    default: 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/50',
    primary: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    running: 'bg-sky-500/10 text-sky-400 border border-sky-500/20 animate-pulse'
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]} ${className}`}>
      {children}
    </span>
  )
}

// ==========================================
// TABS
// ==========================================
export function Tabs({
  tabs = [],
  activeTab,
  setActiveTab,
  className = ''
}) {
  return (
    <div className={`flex flex-wrap p-1 bg-zinc-900 border border-zinc-800 rounded-full w-fit gap-1 ${className}`}>
      {tabs.map((tab) => {
        const id = tab.value || tab
        const label = tab.label || tab
        const isActive = activeTab === id
        return (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${isActive ? 'bg-zinc-100 text-zinc-950 shadow-sm' : 'text-zinc-450 hover:text-zinc-200'}`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ==========================================
// DATA TABLE
// ==========================================
export function DataTable({
  headers = [],
  data = [],
  renderRow,
  emptyText = 'No data records found',
  loading = false
}) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-900/20">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/40 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            {headers.map((h, i) => (
              <th key={i} className="px-5 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60 text-sm text-zinc-300">
          {loading ? (
            <tr>
              <td colSpan={headers.length} className="px-5 py-12 text-center text-zinc-500">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-500 mb-2" />
                <span>Fetching records...</span>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-5 py-12 text-center text-zinc-500">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((item, index) => renderRow(item, index))
          )}
        </tbody>
      </table>
    </div>
  )
}

// ==========================================
// ALERT
// ==========================================
export function Alert({
  children,
  variant = 'info',
  title,
  className = ''
}) {
  const styles = {
    info: {
      bg: 'bg-sky-500/10 border border-sky-500/20 text-sky-300',
      icon: Info
    },
    success: {
      bg: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300',
      icon: CheckCircle
    },
    warning: {
      bg: 'bg-amber-500/10 border border-amber-500/20 text-amber-300',
      icon: AlertTriangle
    },
    danger: {
      bg: 'bg-rose-500/10 border border-rose-500/20 text-rose-300',
      icon: AlertCircle
    }
  }

  const Style = styles[variant]
  const Icon = Style.icon

  return (
    <div className={`p-4 rounded-xl flex gap-3 ${Style.bg} ${className}`}>
      <Icon className="h-5 w-5 shrink-0" />
      <div className="flex flex-col gap-0.5">
        {title && <h4 className="text-sm font-semibold">{title}</h4>}
        <div className="text-xs leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

// ==========================================
// MODAL
// ==========================================
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-lg glass-panel rounded-2xl shadow-2xl p-6 z-10 text-left"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
              <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
              <button onClick={onClose} className="p-1 rounded-md text-zinc-500 hover:text-zinc-350 hover:bg-zinc-800/80 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="text-sm text-zinc-300 max-h-[60vh] overflow-y-auto pr-1">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="border-t border-zinc-800 pt-4 mt-5 flex items-center justify-end gap-2">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ==========================================
// DRAWER
// ==========================================
export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'right'
}) {
  const isRight = position === 'right'

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: isRight ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRight ? '100%' : '-100%' }}
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
            className={`relative w-full max-w-md h-full bg-zinc-900 border-l border-zinc-800 shadow-2xl p-6 z-10 flex flex-col`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-4">
              <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
              <button onClick={onClose} className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-350 hover:bg-zinc-900/60 transition-colors">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto text-sm text-zinc-300 pr-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ==========================================
// EMPTY STATE
// ==========================================
export function EmptyState({
  icon: Icon,
  title = 'Nothing here yet',
  description = 'Add some items or configurations to get started.',
  action
}) {
  return (
    <div className="glass-card flex flex-col items-center justify-center text-center p-12 border-dashed border-zinc-800">
      <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 mb-4 animate-float">
        {Icon ? <Icon className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
      </div>
      <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
      <p className="text-xs text-zinc-500 mt-1.5 max-w-xs leading-relaxed">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// ==========================================
// LOADING SKELETON
// ==========================================
export function LoadingSkeleton({
  className = '',
  variant = 'text'
}) {
  const styles = {
    text: 'h-4 w-full bg-zinc-800/60 rounded',
    card: 'h-40 w-full bg-zinc-900/50 border border-zinc-800/60 rounded-xl',
    circle: 'h-10 w-10 bg-zinc-800/60 rounded-full'
  }

  return (
    <div className={`animate-pulse-slow ${styles[variant]} ${className}`} />
  )
}
