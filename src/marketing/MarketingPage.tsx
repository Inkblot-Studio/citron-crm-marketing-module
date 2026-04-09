import {
  EmailBlockEditor,
  ModuleAssistantPanel,
  AdvancedDropdown,
  TemplateMasonryGrid,
  Button,
  SearchBar,
  Collapsible,
  Skeleton,
} from '@citron-systems/citron-ui'
import type { EmailBlock, ModuleAssistantMessage, TemplateMasonryItem } from '@citron-systems/citron-ui'
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
} from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { useToast } from '@/lib/ToastContext'
import { generateBlocksFromPrompt } from '@/lib/generateBlocks'
import ContactsPage from './ContactsPage'

const campaigns = [
  { name: 'Q1 Product Launch', status: 'sent' as const, recipients: 2840, openRate: 68, clickRate: 24, sentAt: 'Feb 12, 2026' },
  { name: 'Onboarding Drip – Week 1', status: 'active' as const, recipients: 1200, openRate: 72, clickRate: 31, sentAt: 'Running' },
  { name: 'Churn Prevention – Tier 2', status: 'draft' as const, recipients: 0, openRate: 0, clickRate: 0, sentAt: '—' },
  { name: 'Feature Update – Feb 2026', status: 'scheduled' as const, recipients: 4100, openRate: 0, clickRate: 0, sentAt: 'Feb 28, 2026' },
  { name: 'Re-engagement Flow', status: 'sent' as const, recipients: 890, openRate: 45, clickRate: 12, sentAt: 'Feb 5, 2026' },
]

const templateItems: TemplateMasonryItem[] = [
  { id: '1', title: 'Welcome Series', description: 'Onboarding flow for new users', category: 'Onboarding' },
  { id: '2', title: 'Product Announcement', description: 'Announce new features to all users', category: 'Marketing' },
  { id: '3', title: 'Renewal Reminder', description: 'Prompt customers before subscription expires', category: 'Retention' },
  { id: '4', title: 'Meeting Follow-up', description: 'Post-meeting summary and next steps', category: 'Sales' },
  { id: '5', title: 'Re-engagement', description: 'Win back dormant users', category: 'Retention' },
  { id: '6', title: 'Event Invitation', description: 'Drive attendance to webinars and events', category: 'Marketing' },
]

const statusConfig = {
  sent: { label: 'Sent', icon: CheckCircle2, color: 'text-citrus-lime' },
  active: { label: 'Active', icon: Send, color: 'text-citrus-lemon' },
  draft: { label: 'Draft', icon: FileText, color: 'text-muted-foreground' },
  scheduled: { label: 'Scheduled', icon: Clock, color: 'text-status-info' },
  failed: { label: 'Failed', icon: XCircle, color: 'text-destructive' },
}

type Tab = 'campaigns' | 'contacts' | 'templates' | 'compose'

const TAB_ORDER: Tab[] = ['campaigns', 'contacts', 'templates', 'compose']
const TAB_LABELS: Record<Tab, string> = {
  campaigns: 'Campaigns',
  contacts: 'Contacts',
  templates: 'Templates',
  compose: 'Compose',
}

const MOCK_RECIPIENTS = [
  { name: 'Sarah Chen', email: 'sarah@acme.com', company: 'Acme Corp', tags: ['Champion'] },
  { name: 'Marcus Johnson', email: 'marcus@techventures.io', company: 'TechVentures', tags: ['Technical Buyer'] },
  { name: 'Elena Rodriguez', email: 'elena@globaltech.com', company: 'GlobalTech Inc', tags: ['At Risk'] },
  { name: 'David Park', email: 'david@dataflow.dev', company: 'DataFlow Labs', tags: ['Executive Sponsor'] },
  { name: 'Lisa Wang', email: 'lisa@startupxyz.com', company: 'StartupXYZ', tags: ['Champion', 'Budget Holder'] },
]

const CUSTOMER_TYPES = [
  { value: 'all', label: 'All customers' },
  { value: 'enterprise', label: 'Enterprise', description: '100+ seats' },
  { value: 'mid-market', label: 'Mid-Market', description: '20–99 seats' },
  { value: 'smb', label: 'SMB', description: '1–19 seats' },
  { value: 'trial', label: 'Trial users', description: 'Free tier' },
]

const SEGMENTS = [
  { value: 'all', label: 'All segments' },
  { value: 'active', label: 'Active', description: 'Logged in last 7 days' },
  { value: 'dormant', label: 'Dormant', description: 'No activity 30+ days' },
  { value: 'champion', label: 'Champions', description: 'High engagement score' },
  { value: 'at-risk', label: 'At Risk', description: 'Declining engagement' },
]

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('campaigns')
  const [blocks, setBlocks] = useState<EmailBlock[]>([])
  const [subject, setSubject] = useState('')
  const [recipientQuery, setRecipientQuery] = useState('')
  const [customerType, setCustomerType] = useState<string | null>(null)
  const [segment, setSegment] = useState<string | null>(null)
  const [assistantMessages, setAssistantMessages] = useState<ModuleAssistantMessage[]>([])
  const [assistantProcessing, setAssistantProcessing] = useState(false)
  const [showAssistant, setShowAssistant] = useState(false)
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const { addToast } = useToast()

  const filteredRecipients = useMemo(() => {
    const q = recipientQuery.toLowerCase()
    if (!q) return MOCK_RECIPIENTS
    return MOCK_RECIPIENTS.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
    )
  }, [recipientQuery])

  const handleAssistantSend = useCallback(async (content: string) => {
    const userMsg: ModuleAssistantMessage = { id: crypto.randomUUID(), role: 'user', content }
    setAssistantMessages((prev) => [...prev, userMsg])
    setAssistantProcessing(true)

    try {
      const newBlocks = await generateBlocksFromPrompt(content)
      setBlocks(newBlocks)
      const reply: ModuleAssistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Done — generated ${newBlocks.length} blocks. The editor has been updated.`,
      }
      setAssistantMessages((prev) => [...prev, reply])
      addToast({ title: 'Blocks generated', description: `${newBlocks.length} blocks added to editor`, variant: 'success' })
    } catch {
      const errMsg: ModuleAssistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Something went wrong generating the blocks. Try again.',
      }
      setAssistantMessages((prev) => [...prev, errMsg])
    } finally {
      setAssistantProcessing(false)
    }
  }, [addToast])

  const handleGenerateWithAI = useCallback(() => {
    setShowAssistant(true)
    const prompt = subject.trim()
      ? `Draft email blocks for: "${subject}"`
      : 'Draft a professional marketing email with heading, body, image, and CTA'
    handleAssistantSend(prompt)
  }, [subject, handleAssistantSend])

  const handleTemplateGenerateAI = useCallback(async (item: TemplateMasonryItem) => {
    setTemplatesLoading(true)
    addToast({ title: 'AI generation started', description: `Generating "${item.title}"…`, variant: 'info' })
    const newBlocks = await generateBlocksFromPrompt(`Create email template: ${item.title} — ${item.description ?? ''}`)
    setBlocks(newBlocks)
    setTemplatesLoading(false)
    setActiveTab('compose')
    addToast({ title: 'Template loaded', description: `${newBlocks.length} blocks ready in editor`, variant: 'success' })
  }, [addToast])

  const handleTemplateSelect = useCallback((item: TemplateMasonryItem) => {
    addToast({ title: `Template "${item.title}" selected`, variant: 'info' })
  }, [addToast])

  const handleSendNow = () => addToast({ title: 'Campaign sent', description: 'Your email campaign has been queued for delivery.', variant: 'success' })
  const handleSchedule = () => addToast({ title: 'Campaign scheduled', description: 'Select a date and time to schedule.', variant: 'info' })
  const handleSaveDraft = () => addToast({ title: 'Draft saved', variant: 'success' })

  const blockPreview = useMemo(() => {
    if (!blocks.length) return null
    return blocks
      .filter((b) => b.content)
      .map((b) => (b.type === 'heading' ? `# ${b.content}` : b.type === 'button' ? `[${b.content}]` : b.content))
      .join('\n\n')
  }, [blocks])

  return (
    <div className="h-full flex flex-col">
      <header className="px-8 py-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-citrus-orange/10 flex items-center justify-center">
            <Mail className="w-4 h-4 text-citrus-orange" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Marketing</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Campaigns, contacts, templates, and compose</p>
          </div>
        </div>
        <Button onClick={() => setActiveTab('compose')}>
          <Plus className="w-3 h-3 mr-1.5" />
          New Campaign
        </Button>
      </header>

      <div className="px-8 py-3 border-b border-border flex gap-1">
        {TAB_ORDER.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div
        className={
          activeTab === 'contacts'
            ? 'flex-1 flex flex-col min-h-0 overflow-hidden px-8 py-6'
            : activeTab === 'compose'
              ? 'flex-1 flex min-h-0 overflow-hidden'
              : 'flex-1 overflow-y-auto hide-scrollbar px-8 py-6'
        }
      >
        {activeTab === 'contacts' && <ContactsPage embedded />}

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
            {templatesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
              </div>
            ) : (
              <TemplateMasonryGrid
                items={templateItems}
                columns={3}
                onSelect={handleTemplateSelect}
                onGenerateWithAI={handleTemplateGenerateAI}
              />
            )}
          </div>
        )}

        {activeTab === 'compose' && (
          <div className="flex flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto hide-scrollbar px-8 py-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Subject Line</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-surface-1 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Enter subject line..."
                />
              </div>

              <EmailBlockEditor blocks={blocks} onBlocksChange={setBlocks} />

              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={handleGenerateWithAI}>
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  Generate with AI
                </Button>
                {!showAssistant && (
                  <button
                    onClick={() => setShowAssistant(true)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Open assistant panel
                  </button>
                )}
              </div>

              {blockPreview && (
                <Collapsible title="Preview" defaultOpen={false}>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap p-4 bg-surface-1 rounded-lg border border-border mt-2 max-h-48 overflow-y-auto">
                    {blockPreview}
                  </pre>
                </Collapsible>
              )}

              <div className="space-y-3">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Recipients</label>
                <SearchBar
                  value={recipientQuery}
                  onChange={(e) => setRecipientQuery(e.target.value)}
                  placeholder="Search by name, email, company, or tag…"
                />
                <div className="flex flex-wrap gap-3">
                  <div className="w-48">
                    <AdvancedDropdown
                      options={CUSTOMER_TYPES}
                      value={customerType ?? undefined}
                      onChange={setCustomerType}
                      placeholder="Customer type"
                      clearable
                    />
                  </div>
                  <div className="w-48">
                    <AdvancedDropdown
                      options={SEGMENTS}
                      value={segment ?? undefined}
                      onChange={setSegment}
                      placeholder="Segment"
                      clearable
                    />
                  </div>
                </div>
                {recipientQuery && (
                  <div className="glass rounded-lg max-h-36 overflow-y-auto">
                    {filteredRecipients.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-muted-foreground">No contacts match your search.</p>
                    ) : (
                      filteredRecipients.map((r) => (
                        <div key={r.email} className="flex items-center justify-between px-4 py-2 border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                          <div>
                            <span className="text-sm font-medium text-foreground">{r.name}</span>
                            <span className="text-[10px] text-muted-foreground ml-2">{r.email}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{r.company}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleSendNow}>
                  <Send className="w-3 h-3 mr-1.5" />
                  Send Now
                </Button>
                <Button variant="secondary" onClick={handleSchedule}>
                  <Clock className="w-3 h-3 mr-1.5" />
                  Schedule
                </Button>
                <button onClick={handleSaveDraft} className="px-4 py-2 rounded-lg border border-border text-muted-foreground text-xs font-medium hover:bg-secondary/30 transition-colors">
                  Save Draft
                </button>
              </div>
            </div>

            {showAssistant && (
              <div className="w-80 xl:w-96 border-l border-border flex-shrink-0">
                <ModuleAssistantPanel
                  moduleId="marketing"
                  moduleLabel="Marketing"
                  agentLabel="Marketing AI"
                  messages={assistantMessages}
                  onSend={handleAssistantSend}
                  isProcessing={assistantProcessing}
                  placeholder="Ask the assistant to generate email content…"
                  onClose={() => setShowAssistant(false)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
