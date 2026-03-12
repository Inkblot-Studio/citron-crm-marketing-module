import { EmailBlockEditor, AIEmailGenerator } from '@citron-systems/citron-ui'
import type { EmailBlock } from '@citron-systems/citron-ui'
import {
  Mail,
  Plus,
  Sparkles,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  MousePointerClick,
  FileText,
  Search,
} from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/lib/ToastContext'

const campaigns = [
  { name: 'Q1 Product Launch', status: 'sent' as const, recipients: 2840, openRate: 68, clickRate: 24, sentAt: 'Feb 12, 2026' },
  { name: 'Onboarding Drip – Week 1', status: 'active' as const, recipients: 1200, openRate: 72, clickRate: 31, sentAt: 'Running' },
  { name: 'Churn Prevention – Tier 2', status: 'draft' as const, recipients: 0, openRate: 0, clickRate: 0, sentAt: '—' },
  { name: 'Feature Update – Feb 2026', status: 'scheduled' as const, recipients: 4100, openRate: 0, clickRate: 0, sentAt: 'Feb 28, 2026' },
  { name: 'Re-engagement Flow', status: 'sent' as const, recipients: 890, openRate: 45, clickRate: 12, sentAt: 'Feb 5, 2026' },
]

const templates = [
  { name: 'Welcome Series', category: 'Onboarding', uses: 34 },
  { name: 'Product Announcement', category: 'Marketing', uses: 12 },
  { name: 'Renewal Reminder', category: 'Retention', uses: 28 },
  { name: 'Meeting Follow-up', category: 'Sales', uses: 56 },
]

const statusConfig = {
  sent: { label: 'Sent', icon: CheckCircle2, color: 'text-citrus-lime' },
  active: { label: 'Active', icon: Send, color: 'text-citrus-lemon' },
  draft: { label: 'Draft', icon: FileText, color: 'text-muted-foreground' },
  scheduled: { label: 'Scheduled', icon: Clock, color: 'text-status-info' },
  failed: { label: 'Failed', icon: XCircle, color: 'text-destructive' },
}

type Tab = 'campaigns' | 'templates' | 'compose'
type ComposeMode = 'blocks' | 'ai'

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('campaigns')
  const [composeMode, setComposeMode] = useState<ComposeMode>('blocks')
  const [blocks, setBlocks] = useState<EmailBlock[]>([])
  const [subject, setSubject] = useState('')
  const { addToast } = useToast()

  const handleSendNow = () => addToast({ title: 'Campaign sent', description: 'Your email campaign has been queued for delivery.', variant: 'success' })
  const handleSchedule = () => addToast({ title: 'Campaign scheduled', description: 'Select a date and time to schedule.', variant: 'info' })
  const handleSaveDraft = () => addToast({ title: 'Draft saved', variant: 'success' })
  const handleGenerateWithAI = () => addToast({ title: 'AI generation started', description: 'Your template will be ready shortly.', variant: 'info' })
  const handleTemplateClick = (name: string) => addToast({ title: `Template "${name}" selected`, variant: 'info' })

  return (
    <div className="h-full flex flex-col">
      <header className="px-8 py-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-citrus-orange/10 flex items-center justify-center">
            <Mail className="w-4 h-4 text-citrus-orange" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Email Campaigns</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Automate outreach · AI-powered templates</p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('compose')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3 h-3" />
          New Campaign
        </button>
      </header>

      <div className="px-8 py-3 border-b border-border flex gap-1">
        {(['campaigns', 'templates', 'compose'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
              activeTab === tab ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-8 py-6">
        {activeTab === 'campaigns' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Sent', value: '12.4K', sub: 'This month' },
                { label: 'Avg. Open Rate', value: '64%', sub: '+8% vs prior' },
                { label: 'Avg. Click Rate', value: '22%', sub: '+3% vs prior' },
                { label: 'Active Automations', value: '7', sub: '3 paused' },
              ].map((kpi) => (
                <div key={kpi.label} className="glass rounded-xl p-4">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                  <p className="text-2xl font-semibold text-foreground mt-1">{kpi.value}</p>
                  <span className="text-[10px] text-citrus-lime">{kpi.sub}</span>
                </div>
              ))}
            </div>

            <div className="glass rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_100px_80px_80px_100px] gap-4 px-5 py-3 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider">
                <span>Campaign</span>
                <span>Status</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Opens</span>
                <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> Clicks</span>
                <span>Date</span>
              </div>
              {campaigns.map((c) => {
                const st = statusConfig[c.status]
                return (
                  <div key={c.name} className="grid grid-cols-[1fr_100px_80px_80px_100px] gap-4 px-5 py-3.5 border-b border-border/50 hover:bg-secondary/30 transition-colors items-center">
                    <div>
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">{c.recipients.toLocaleString()} recipients</span>
                    </div>
                    <span className={`text-xs flex items-center gap-1.5 ${st.color}`}>
                      <st.icon className="w-3 h-3" />
                      {st.label}
                    </span>
                    <span className="text-sm font-mono text-foreground">{c.openRate ? `${c.openRate}%` : '—'}</span>
                    <span className="text-sm font-mono text-foreground">{c.clickRate ? `${c.clickRate}%` : '—'}</span>
                    <span className="text-xs text-muted-foreground">{c.sentAt}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Templates</h2>
              <button
                onClick={handleGenerateWithAI}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-xs text-foreground hover:bg-secondary/80 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-citrus-lemon" />
                Generate with AI
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((t) => (
                <div key={t.name} onClick={() => handleTemplateClick(t.name)} className="glass rounded-xl p-5 hover:bg-secondary/20 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{t.category}</span>
                    <span className="text-[10px] text-muted-foreground">{t.uses} uses</span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                  <div className="mt-3 h-16 rounded-md bg-surface-2 border border-border/50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-muted-foreground/40" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'compose' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Subject Line</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-surface-1 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Enter subject line..."
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider mr-2">Editor Mode</span>
              {(['blocks', 'ai'] as ComposeMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setComposeMode(mode)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    composeMode === mode ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  {mode === 'blocks' ? 'Drag & Drop' : 'AI Generate'}
                </button>
              ))}
            </div>

            {composeMode === 'blocks' && (
              <EmailBlockEditor blocks={blocks} onBlocksChange={setBlocks} />
            )}

            {composeMode === 'ai' && (
              <AIEmailGenerator
                onGenerate={(newBlocks) => {
                  setBlocks(newBlocks)
                  setComposeMode('blocks')
                }}
              />
            )}

            <div className="space-y-3">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Recipients</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  className="w-full bg-surface-1 border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Search contacts, segments, or tags..."
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSendNow} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                <Send className="w-3 h-3" />
                Send Now
              </button>
              <button onClick={handleSchedule} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Schedule
              </button>
              <button onClick={handleSaveDraft} className="px-4 py-2 rounded-lg border border-border text-muted-foreground text-xs font-medium hover:bg-secondary/30 transition-colors">
                Save Draft
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
