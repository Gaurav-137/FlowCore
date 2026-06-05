import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Layers, 
  Search, 
  Zap, 
  Cpu, 
  Mail, 
  ArrowRight,
  Database,
  Calendar,
  Globe
} from 'lucide-react'
import { createWorkflow } from '../services/workflowService'
import { Card, Button, Badge, Input } from '../components/ui'

const PREBUILT_TEMPLATES = [
  {
    id: 'stripe-to-slack',
    name: 'Stripe Webhook Sync to Slack',
    category: 'Billing',
    desc: 'Receive Stripe webhooks, fetch charges metadata, and post structured alerts in your target Slack channel.',
    nodesCount: 3,
    icon: Globe,
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    nodes: [
      { id: 'wh-start', type: 'webhook', positionX: 100, positionY: 200, config: { secret: 'stripe_payment', enabled: true } },
      { id: 'http-fetch', type: 'http_request', positionX: 350, positionY: 200, config: { method: 'GET', url: 'https://api.stripe.com/v3/charges', timeout: 10000 } },
      { id: 'slack-notify', type: 'notify', positionX: 600, positionY: 200, config: { type: 'slack', webhookUrl: 'https://hooks.slack.com/services/...', text: 'Invoice paid successfully!' } }
    ],
    edges: [
      { sourceNodeId: 'wh-start', targetNodeId: 'http-fetch' },
      { sourceNodeId: 'http-fetch', targetNodeId: 'slack-notify' }
    ]
  },
  {
    id: 'db-backup-notify',
    name: 'Weekly Postgres Backup & Report',
    category: 'Database',
    desc: 'Periodically triggers database backup commands, checks exit statuses, and emails the developer team a status report.',
    nodesCount: 3,
    icon: Database,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    nodes: [
      { id: 'cron-trigger', type: 'schedule', positionX: 100, positionY: 200, config: { cronExpression: '0 0 * * 0' } },
      { id: 'cmd-backup', type: 'http_request', positionX: 350, positionY: 200, config: { method: 'POST', url: 'https://api.yourdomain.com/ops/backup', timeout: 30000 } },
      { id: 'email-report', type: 'notify', positionX: 600, positionY: 200, config: { type: 'email', from: 'ops@domain.com', to: 'admin@domain.com', subject: 'Database Backup Report', text: 'Weekly database backup finished.' } }
    ],
    edges: [
      { sourceNodeId: 'cron-trigger', targetNodeId: 'cmd-backup' },
      { sourceNodeId: 'cmd-backup', targetNodeId: 'email-report' }
    ]
  },
  {
    id: 'lead-alert-condition',
    name: 'Condition-Based Contact Alerts',
    category: 'Marketing',
    desc: 'Listen for new marketing leads. If the lead is high-value, delay for 10 minutes and post a high-priority notify alert.',
    nodesCount: 4,
    icon: Cpu,
    color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    nodes: [
      { id: 'lead-webhook', type: 'webhook', positionX: 100, positionY: 200, config: { secret: 'new_leads', enabled: true } },
      { id: 'check-value', type: 'condition', positionX: 350, positionY: 200, config: { leftPath: 'body.estimatedValue', operator: 'greater_than', right: '5000' } },
      { id: 'hold-10m', type: 'delay', positionX: 600, positionY: 100, config: { ms: 600000 } },
      { id: 'sales-notify', type: 'notify', positionX: 850, positionY: 100, config: { type: 'slack', webhookUrl: 'https://hooks.slack.com/...', text: 'High value lead synced!' } }
    ],
    edges: [
      { sourceNodeId: 'lead-webhook', targetNodeId: 'check-value' },
      { sourceNodeId: 'check-value', targetNodeId: 'hold-10m', branchType: 'true' },
      { sourceNodeId: 'hold-10m', targetNodeId: 'sales-notify' }
    ]
  }
]

export default function Templates() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [loadingTemplateId, setLoadingTemplateId] = useState(null)
  
  const navigate = useNavigate()

  async function handleUseTemplate(tpl) {
    setLoadingTemplateId(tpl.id)
    try {
      const res = await createWorkflow({
        name: tpl.name,
        description: tpl.desc,
        nodes: tpl.nodes,
        edges: tpl.edges
      })
      navigate(`/builder?id=${res.id}`)
    } catch (err) {
      console.error(err)
      alert('Failed to clone workflow template')
    } finally {
      setLoadingTemplateId(null)
    }
  }

  const filteredTemplates = PREBUILT_TEMPLATES.filter(tpl => {
    const matchesSearch = tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.desc.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (activeCategory === 'ALL') return matchesSearch
    return matchesSearch && tpl.category.toUpperCase() === activeCategory
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-zinc-100 figma-display-lg">Template Gallery</h1>
          <p className="text-zinc-400 text-xs mt-1">Deploy pre-configured triggers, conditional routers, and notification blocks instantly.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-zinc-900/25 p-4 rounded-[24px] border border-zinc-800">
        <div className="relative w-full sm:max-w-xs flex items-center">
          <Search className="absolute left-3 text-zinc-500 h-4.5 w-4.5" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full glass-input pl-10 text-sm"
          />
        </div>

        <div className="flex bg-zinc-950 p-1 rounded-full border border-zinc-850 self-end sm:self-auto">
          {['ALL', 'BILLING', 'DATABASE', 'MARKETING'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeCategory === cat ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              {cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(() => {
          const CARD_COLORS = ['bg-block-lilac', 'bg-block-cream', 'bg-block-mint']
          return filteredTemplates.map((tpl, idx) => {
            const Icon = tpl.icon
            const isThisLoading = loadingTemplateId === tpl.id
            const cardBg = CARD_COLORS[idx % CARD_COLORS.length]

            return (
              <motion.div
                key={tpl.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col justify-between p-6 border border-zinc-800 rounded-[24px] shadow-none ${cardBg} text-black transition-all duration-300 relative overflow-hidden`}
              >
                {/* Category indicator badge */}
                <div className="absolute top-4 right-4">
                  <Badge className="bg-black/10 border-black/20 text-black">{tpl.category}</Badge>
                </div>

                <div>
                  {/* Branding Icon wrapper */}
                  <div className="h-11 w-11 rounded-full bg-black/10 border border-black/20 flex items-center justify-center mb-5 text-black">
                    <Icon className="h-5.5 w-5.5 text-current" />
                  </div>

                  <h3 className="text-base font-bold text-black leading-snug">{tpl.name}</h3>
                  
                  <p className="text-black/70 text-xs mt-3 leading-relaxed">
                    {tpl.desc}
                  </p>
                </div>

                <div className="border-t border-black/15 pt-4 mt-6 flex items-center justify-between text-black/65 text-xs">
                  <span>{tpl.nodesCount} Nodes Configured</span>
                  
                  <Button 
                    size="sm"
                    onClick={() => handleUseTemplate(tpl)}
                    loading={isThisLoading}
                    className="bg-black text-white hover:bg-zinc-900 border-none font-semibold gap-1.5"
                    icon={ArrowRight}
                  >
                    Use Template
                  </Button>
                </div>
              </motion.div>
            )
          })
        })()}
      </div>
    </div>
  )
}
