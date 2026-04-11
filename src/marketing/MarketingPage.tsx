import {
  Button,
  SearchBar,
  Skeleton,
  Resizable,
  Separator,
  Switch,
  Checkbox,
  ScrollArea,
  Badge,
  Label,
  Input,
  Textarea,
  EmailComposeActionButtons,
  ToggleGroup,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Collapsible,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@citron-systems/citron-ui'
import type { EmailBlock, BlockType } from '@citron-systems/citron-ui'
import {
  Mail,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  MousePointerClick,
  FileText,
  GripVertical,
  Trash2,
  ChevronDown,
  Monitor,
  Tablet,
  Smartphone,
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { useToast } from '@/lib/ToastContext'
import {
  validateMarketingCompose,
  isValidEmail,
  isValidPersonName,
  parseEmailList,
  areAllValidEmails,
  stripDigitsFromName,
} from '@/lib/formValidation'
import ContactsPage from './ContactsPage'

const campaigns = [
  { name: 'Q1 Product Launch', status: 'sent' as const, recipients: 2840, openRate: 68, clickRate: 24, sentAt: 'Feb 12, 2026' },
  { name: 'Onboarding Drip – Week 1', status: 'active' as const, recipients: 1200, openRate: 72, clickRate: 31, sentAt: 'Running' },
  { name: 'Churn Prevention – Tier 2', status: 'draft' as const, recipients: 0, openRate: 0, clickRate: 0, sentAt: '—' },
  { name: 'Feature Update – Feb 2026', status: 'scheduled' as const, recipients: 4100, openRate: 0, clickRate: 0, sentAt: 'Feb 28, 2026' },
  { name: 'Re-engagement Flow', status: 'sent' as const, recipients: 890, openRate: 45, clickRate: 12, sentAt: 'Feb 5, 2026' },
]

type MarketingEmailTemplate = {
  id: string
  title: string
  description: string
  category: string
  subject: string
  preheader: string
  blocks: EmailBlock[]
}

type PreviewDevice = 'desktop' | 'tablet' | 'mobile'

function cloneTemplateBlocks(blocks: EmailBlock[]): EmailBlock[] {
  return blocks.map((b) => ({ ...b, id: crypto.randomUUID() }))
}

const INITIAL_EMAIL_TEMPLATES: MarketingEmailTemplate[] = [
  {
    id: 'tpl-welcome',
    title: 'Welcome Series',
    description: 'Onboarding flow for new users',
    category: 'Onboarding',
    subject: 'Welcome to Citron — your workspace is ready',
    preheader: 'A quick tour to help you get started',
    blocks: [
      { id: 'x', type: 'heading', content: 'Welcome aboard' },
      { id: 'x', type: 'text', content: 'Thanks for joining teams who run CRM with Citron. Here is what to do next in your first week.' },
      { id: 'x', type: 'image', content: 'https://placehold.co/560x220/1e293b/94a3b8?text=Product+tour' },
      { id: 'x', type: 'button', content: 'Open your workspace' },
      { id: 'x', type: 'divider', content: '' },
      { id: 'x', type: 'text', content: 'Questions? Reply to this email and we will help you onboard.' },
    ],
  },
  {
    id: 'tpl-product',
    title: 'Product Announcement',
    description: 'Announce new features to all users',
    category: 'Marketing',
    subject: 'New in Citron — ship faster with smarter workflows',
    preheader: 'Highlights from this release',
    blocks: [
      { id: 'x', type: 'heading', content: 'What is new' },
      { id: 'x', type: 'text', content: 'We shipped improvements to compose, templates, and analytics so your team can move faster with less busywork.' },
      { id: 'x', type: 'columns', content: 'Faster sends | Clearer reporting' },
      { id: 'x', type: 'button', content: 'Read the release notes' },
    ],
  },
  {
    id: 'tpl-renewal',
    title: 'Renewal Reminder',
    description: 'Prompt customers before subscription expires',
    category: 'Retention',
    subject: 'Your Citron plan renews soon',
    preheader: 'Avoid interruption by confirming billing details',
    blocks: [
      { id: 'x', type: 'heading', content: 'Renewal coming up' },
      { id: 'x', type: 'text', content: 'Your subscription renews on the date shown in your account. Please confirm your billing details to avoid interruption.' },
      { id: 'x', type: 'button', content: 'Review subscription' },
      { id: 'x', type: 'divider', content: '' },
      { id: 'x', type: 'text', content: 'Need to make a change? Reply and our team will help.' },
    ],
  },
  {
    id: 'tpl-followup',
    title: 'Meeting Follow-up',
    description: 'Post-meeting summary and next steps',
    category: 'Sales',
    subject: 'Thanks for your time — next steps',
    preheader: 'Summary and actions from our conversation',
    blocks: [
      { id: 'x', type: 'heading', content: 'Great speaking today' },
      { id: 'x', type: 'text', content: 'Here is a concise recap of what we discussed and the agreed next steps on both sides.' },
      { id: 'x', type: 'columns', content: 'Recap | Next steps' },
      { id: 'x', type: 'button', content: 'View the proposal' },
    ],
  },
  {
    id: 'tpl-reengage',
    title: 'Re-engagement',
    description: 'Win back dormant users',
    category: 'Retention',
    subject: 'We miss you — here is what you are missing',
    preheader: 'A quick win you can enable in two minutes',
    blocks: [
      { id: 'x', type: 'heading', content: 'Come back to Citron' },
      { id: 'x', type: 'text', content: 'It has been a while since your last session. Here is one workflow teams like yours enable first when they return.' },
      { id: 'x', type: 'image', content: 'https://placehold.co/560x200/1a1a2e/e2e8f0?text=Workflow' },
      { id: 'x', type: 'button', content: 'Jump back in' },
    ],
  },
  {
    id: 'tpl-event',
    title: 'Event Invitation',
    description: 'Drive attendance to webinars and events',
    category: 'Marketing',
    subject: 'You are invited — live session this week',
    preheader: 'Save your seat (limited spots)',
    blocks: [
      { id: 'x', type: 'heading', content: 'Join us live' },
      { id: 'x', type: 'text', content: 'We are hosting a short session on practical email workflows. Bring your questions — we will answer live.' },
      { id: 'x', type: 'button', content: 'Reserve a seat' },
      { id: 'x', type: 'divider', content: '' },
      { id: 'x', type: 'text', content: 'Cannot attend? Register anyway and we will send the recording.' },
    ],
  },
]

const STORAGE_TEMPLATES_REMOVED = 'citron-marketing-templates-removed-ids'
const STORAGE_TEMPLATES_USER = 'citron-marketing-templates-user'

const INITIAL_TEMPLATE_IDS = new Set(INITIAL_EMAIL_TEMPLATES.map((t) => t.id))

function loadTemplatesFromStorage(): MarketingEmailTemplate[] {
  if (typeof window === 'undefined') return [...INITIAL_EMAIL_TEMPLATES]
  try {
    const removed = new Set<string>(JSON.parse(localStorage.getItem(STORAGE_TEMPLATES_REMOVED) || '[]'))
    const user: MarketingEmailTemplate[] = JSON.parse(localStorage.getItem(STORAGE_TEMPLATES_USER) || '[]')
    return [...INITIAL_EMAIL_TEMPLATES.filter((t) => !removed.has(t.id)), ...user]
  } catch {
    return [...INITIAL_EMAIL_TEMPLATES]
  }
}

function persistTemplatesState(templates: MarketingEmailTemplate[]) {
  if (typeof window === 'undefined') return
  const currentIds = new Set(templates.map((t) => t.id))
  const removedBuiltin = INITIAL_EMAIL_TEMPLATES.filter((t) => !currentIds.has(t.id)).map((t) => t.id)
  const userTemplates = templates.filter((t) => !INITIAL_TEMPLATE_IDS.has(t.id))
  localStorage.setItem(STORAGE_TEMPLATES_REMOVED, JSON.stringify(removedBuiltin))
  localStorage.setItem(STORAGE_TEMPLATES_USER, JSON.stringify(userTemplates))
}

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

type Recipient = {
  id: string
  name: string
  email: string
  company: string
  tags: string[]
  customerType: 'enterprise' | 'mid-market' | 'smb' | 'trial'
  segments: string[]
}

const MOCK_RECIPIENTS: Recipient[] = [
  { id: 'r1', name: 'Sarah Chen', email: 'sarah@acme.com', company: 'Acme Corp', tags: ['Champion'], customerType: 'enterprise', segments: ['active', 'champion'] },
  { id: 'r2', name: 'Marcus Johnson', email: 'marcus@techventures.io', company: 'TechVentures', tags: ['Technical Buyer'], customerType: 'mid-market', segments: ['active'] },
  { id: 'r3', name: 'Elena Rodriguez', email: 'elena@globaltech.com', company: 'GlobalTech Inc', tags: ['At Risk'], customerType: 'enterprise', segments: ['dormant', 'at-risk'] },
  { id: 'r4', name: 'David Park', email: 'david@dataflow.dev', company: 'DataFlow Labs', tags: ['Executive Sponsor'], customerType: 'smb', segments: ['active', 'champion'] },
  { id: 'r5', name: 'Lisa Wang', email: 'lisa@startupxyz.com', company: 'StartupXYZ', tags: ['Champion', 'Budget Holder'], customerType: 'trial', segments: ['active'] },
]

const CUSTOMER_TOGGLE_ITEMS = [
  { id: 'all', label: 'All tiers' },
  { id: 'enterprise', label: 'Enterprise' },
  { id: 'mid-market', label: 'Mid-market' },
  { id: 'smb', label: 'SMB' },
  { id: 'trial', label: 'Trial' },
]

const SEGMENT_TOGGLE_ITEMS = [
  { id: 'active', label: 'Active' },
  { id: 'dormant', label: 'Dormant' },
  { id: 'champion', label: 'Champions' },
  { id: 'at-risk', label: 'At risk' },
]

const ALL_BLOCK_TYPES: BlockType[] = ['heading', 'text', 'image', 'button', 'divider', 'columns']

const DEFAULT_BLOCK_CONTENT: Record<BlockType, string> = {
  heading: 'Section title',
  text: 'Write a concise paragraph for your readers. Keep sentences short and focus on one idea.',
  image: 'https://placehold.co/560x200/1a1a2e/e0e0e0?text=Hero',
  button: 'Call to action',
  divider: '',
  columns: 'Left column copy | Right column copy',
}

const ADD_BLOCK_LABELS: Record<BlockType, string> = {
  heading: 'Heading',
  text: 'Paragraph',
  image: 'Image',
  button: 'Button',
  divider: 'Divider',
  columns: 'Two columns',
}

function reorderList<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  const r = Array.from(list)
  const [removed] = r.splice(fromIndex, 1)
  r.splice(toIndex, 0, removed!)
  return r
}

/** Shared email body for live preview and template cards (same file only — no new repo components). */
function StaticEmailBlocks({
  blocks,
  device,
  keyPrefix,
}: {
  blocks: EmailBlock[]
  device: PreviewDevice
  keyPrefix: string
}) {
  const headingClass =
    device === 'mobile'
      ? 'text-lg font-bold leading-snug text-foreground'
      : device === 'tablet'
        ? 'text-xl font-bold leading-tight text-foreground'
        : 'text-2xl font-bold leading-tight text-foreground'
  const bodyClass =
    device === 'mobile' ? 'text-xs leading-relaxed text-muted-foreground' : 'text-sm leading-relaxed text-muted-foreground'

  return (
    <>
      {blocks.map((b, i) => {
        const key = `${keyPrefix}-${i}-${b.type}`
        if (b.type === 'heading') {
          return (
            <h2 key={key} className={headingClass}>
              {b.content}
            </h2>
          )
        }
        if (b.type === 'text') {
          return (
            <p key={key} className={bodyClass}>
              {b.content}
            </p>
          )
        }
        if (b.type === 'image' && b.content) {
          return <img key={key} src={b.content} alt="" className="w-full rounded-md border border-border object-cover" />
        }
        if (b.type === 'button') {
          return (
            <div key={key} className="text-center">
              <span
                className={`inline-block rounded-md bg-primary font-medium text-primary-foreground ${
                  device === 'mobile' ? 'px-4 py-2 text-xs' : 'px-6 py-2.5 text-sm'
                }`}
              >
                {b.content || 'Button'}
              </span>
            </div>
          )
        }
        if (b.type === 'divider') {
          return <hr key={key} className="border-border" />
        }
        if (b.type === 'columns') {
          const [L, R] = splitColumns(b.content)
          return (
            <div
              key={key}
              className={`grid grid-cols-2 gap-3 text-muted-foreground ${device === 'mobile' ? 'gap-2 text-[11px]' : 'text-sm'}`}
            >
              <p className="rounded-md bg-secondary/50 p-2 sm:p-3">{L || 'Left column'}</p>
              <p className="rounded-md bg-secondary/50 p-2 sm:p-3">{R || 'Right column'}</p>
            </div>
          )
        }
        return null
      })}
    </>
  )
}

/** Fixed chrome + scroll body so every template card matches in height. */
const TEMPLATE_CARD_PREVIEW_TOTAL_H = 420
const TEMPLATE_CARD_PREVIEW_SCROLL_H = 300

function TemplateCardEmailPreview({
  templateId,
  subject,
  preheader,
  blocks,
}: {
  templateId: string
  subject: string
  preheader: string
  blocks: EmailBlock[]
}) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm"
      style={{ height: TEMPLATE_CARD_PREVIEW_TOTAL_H }}
    >
      <div className="shrink-0 border-b border-border bg-muted/40 px-4 py-2.5">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Citron Marketing</span>
          <span> · marketing@citron.example</span>
        </p>
        <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-foreground">{subject || '(No subject)'}</p>
        {preheader ? <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">{preheader}</p> : null}
      </div>
      <ScrollArea className="w-full shrink-0" style={{ height: TEMPLATE_CARD_PREVIEW_SCROLL_H }} maxHeight={`${TEMPLATE_CARD_PREVIEW_SCROLL_H}px`}>
        <div className="bg-background px-4 py-4 sm:px-5">
          <div className="mx-auto max-w-[560px] space-y-4 rounded-lg border border-border bg-surface-1 px-5 py-6 sm:px-6 sm:py-8">
            <StaticEmailBlocks blocks={blocks} device="desktop" keyPrefix={templateId} />
          </div>
        </div>
      </ScrollArea>
      <p className="mt-auto shrink-0 border-t border-border bg-muted/20 px-3 py-1.5 text-center text-[9px] text-muted-foreground">
        Scroll to see the full message
      </p>
    </div>
  )
}

function splitColumns(content: string): [string, string] {
  const parts = content.split('|').map((s) => s.trim())
  return [parts[0] ?? '', parts[1] ?? '']
}

function joinColumns(left: string, right: string): string {
  return `${left.trim()} | ${right.trim()}`
}

function MarketingComposeBlocks({
  blocks,
  onBlocksChange,
}: {
  blocks: EmailBlock[]
  onBlocksChange: (next: EmailBlock[]) => void
}) {
  const updateContent = (id: string, content: string) => {
    onBlocksChange(blocks.map((b) => (b.id === id ? { ...b, content } : b)))
  }

  const addBlock = (type: BlockType) => {
    const block: EmailBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      content: DEFAULT_BLOCK_CONTENT[type],
    }
    onBlocksChange([...blocks, block])
  }

  const removeBlock = (id: string) => {
    onBlocksChange(blocks.filter((b) => b.id !== id))
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    onBlocksChange(reorderList(blocks, result.source.index, result.destination.index))
  }

  const renderBlockFields = (b: EmailBlock) => (
    <div className="min-w-0 flex-1 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className="text-[10px]">
          {ADD_BLOCK_LABELS[b.type]}
        </Badge>
        <Button type="button" variant="secondary" className="h-7 px-2" onClick={() => removeBlock(b.id)} aria-label="Remove block">
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>

      {b.type === 'heading' ? (
        <Input value={b.content} onChange={(e) => updateContent(b.id, e.target.value)} placeholder="Heading" className="text-base font-semibold" />
      ) : null}
      {b.type === 'text' ? (
        <Textarea value={b.content} onChange={(e) => updateContent(b.id, e.target.value)} rows={4} resize="vertical" placeholder="Body text" />
      ) : null}
      {b.type === 'image' ? (
        <div className="space-y-2">
          <Input value={b.content} onChange={(e) => updateContent(b.id, e.target.value)} placeholder="Image URL" />
          {b.content ? (
            <div className="overflow-hidden rounded-md border border-border bg-background">
              <img src={b.content} alt="" className="max-h-40 w-full object-cover" />
            </div>
          ) : null}
        </div>
      ) : null}
      {b.type === 'button' ? (
        <div className="flex flex-col items-center gap-2 py-1">
          <Input value={b.content} onChange={(e) => updateContent(b.id, e.target.value)} placeholder="Button label" className="max-w-md text-center" />
          <span className="inline-flex rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">{b.content || 'Button'}</span>
        </div>
      ) : null}
      {b.type === 'divider' ? <Separator className="my-1" /> : null}
      {b.type === 'columns' ? (
        <div className="grid gap-3 md:grid-cols-2">
          {(() => {
            const [L, R] = splitColumns(b.content)
            return (
              <>
                <Textarea
                  value={L}
                  onChange={(e) => updateContent(b.id, joinColumns(e.target.value, R))}
                  rows={3}
                  resize="vertical"
                  placeholder="Left column"
                />
                <Textarea
                  value={R}
                  onChange={(e) => updateContent(b.id, joinColumns(L, e.target.value))}
                  rows={3}
                  resize="vertical"
                  placeholder="Right column"
                />
              </>
            )
          })()}
        </div>
      ) : null}
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-1 px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/40">
            Add block
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[12rem]">
            {ALL_BLOCK_TYPES.map((t) => (
              <DropdownMenuItem key={t} onClick={() => addBlock(t)}>
                {ADD_BLOCK_LABELS[t]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="text-[10px] text-muted-foreground">Drag by the handle — blocks animate into place</span>
      </div>

      {blocks.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-1/60 text-center">
          <p className="text-sm text-muted-foreground">No blocks yet</p>
          <p className="text-[10px] text-muted-foreground/80">Add blocks from the menu, or apply a template from the Templates tab.</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="compose-blocks">
            {(dropProvided) => (
              <div ref={dropProvided.innerRef} {...dropProvided.droppableProps} className="space-y-2">
                {blocks.map((b, index) => (
                  <Draggable key={b.id} draggableId={b.id} index={index}>
                    {(dragProvided, snapshot) => (
                      <article
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        style={dragProvided.draggableProps.style}
                        className={`flex items-start gap-2 rounded-lg border bg-surface-1/50 px-3 transition-[box-shadow,padding,border-color,background-color] duration-200 ease-out ${
                          snapshot.isDragging
                            ? 'z-10 border-citrus-orange/45 bg-citrus-orange/[0.08] py-2 shadow-xl ring-2 ring-citrus-lemon/40'
                            : 'border-border/60 py-3 hover:border-border'
                        }`}
                      >
                        <button
                          type="button"
                          {...dragProvided.dragHandleProps}
                          className="mt-1 flex h-8 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md border border-transparent text-muted-foreground hover:border-border hover:bg-secondary/50 active:cursor-grabbing"
                          aria-label="Drag to reorder"
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                        {renderBlockFields(b)}
                      </article>
                    )}
                  </Draggable>
                ))}
                {dropProvided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  )
}

function EmailClientPreview({
  subject,
  preheader,
  fromName,
  fromEmail,
  blocks,
  device,
}: {
  subject: string
  preheader: string
  fromName: string
  fromEmail: string
  blocks: EmailBlock[]
  device: PreviewDevice
}) {
  const frame =
    device === 'mobile'
      ? 'w-full max-w-[360px] rounded-[1.35rem] border border-border bg-muted/25 p-2 shadow-sm'
      : device === 'tablet'
        ? 'w-full max-w-[520px] rounded-xl border border-border bg-muted/20 p-2.5 shadow-sm'
        : 'w-full max-w-[600px]'

  const innerPad = device === 'mobile' ? 'px-3 py-3' : device === 'tablet' ? 'px-4 py-4' : 'px-6 py-6'
  const metaClass = device === 'mobile' ? 'text-[10px]' : 'text-xs'

  return (
    <div className={`mx-auto transition-[max-width] duration-300 ease-out ${frame}`}>
      <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
        <div className="border-b border-border bg-muted/40 px-4 py-3">
          <p className={`text-muted-foreground ${metaClass}`}>
            <span className="font-medium text-foreground">{fromName || 'Sender'}</span>
            {fromEmail ? <span className="text-muted-foreground"> · {fromEmail}</span> : null}
          </p>
          <p className={`mt-1 font-semibold text-foreground ${device === 'mobile' ? 'text-sm' : 'text-sm sm:text-base'}`}>
            {subject || '(No subject)'}
          </p>
          {preheader ? <p className={`mt-0.5 line-clamp-2 text-muted-foreground ${metaClass}`}>{preheader}</p> : null}
        </div>
        <div className="bg-background px-3 py-4 sm:px-5 sm:py-5">
          <div className={`mx-auto space-y-3 rounded-lg border border-border bg-surface-1 sm:space-y-4 ${innerPad}`}>
            <StaticEmailBlocks blocks={blocks} device={device} keyPrefix="live-preview" />
          </div>
        </div>
      </div>
    </div>
  )
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return debounced
}

function useMinWidth(px: number) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(`(min-width: ${px}px)`).matches : true,
  )
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${px}px)`)
    const onChange = () => setMatches(mq.matches)
    mq.addEventListener('change', onChange)
    onChange()
    return () => mq.removeEventListener('change', onChange)
  }, [px])
  return matches
}

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('campaigns')
  const [blocks, setBlocks] = useState<EmailBlock[]>([])
  const [subject, setSubject] = useState('')
  const [preheader, setPreheader] = useState('')
  const [fromName, setFromName] = useState('Citron Marketing')
  const [fromEmail, setFromEmail] = useState('marketing@citron.example')
  const [replyTo, setReplyTo] = useState('')
  const [bcc, setBcc] = useState('')
  const [utmSource, setUtmSource] = useState('email')
  const [utmMedium, setUtmMedium] = useState('newsletter')
  const [utmCampaign, setUtmCampaign] = useState('')
  const [trackOpens, setTrackOpens] = useState(true)
  const [trackClicks, setTrackClicks] = useState(true)
  const [plainTextFallback, setPlainTextFallback] = useState('')
  const [recipientQuery, setRecipientQuery] = useState('')
  const debouncedQuery = useDebouncedValue(recipientQuery, 200)
  const [customerTier, setCustomerTier] = useState('all')
  const [segmentFilter, setSegmentFilter] = useState<string[]>([])
  const [tagFilter, setTagFilter] = useState('')
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<string>>(() => new Set())
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop')
  const [templates, setTemplates] = useState<MarketingEmailTemplate[]>(loadTemplatesFromStorage)
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const [saveTemplateName, setSaveTemplateName] = useState('')
  const templatesLoading = false
  const isLg = useMinWidth(1024)
  const { addToast } = useToast()

  const saveTemplateDialogClass =
    'flex max-h-[min(92dvh,560px)] w-[calc(100vw-1.25rem)] max-w-md flex-col gap-0 overflow-hidden border-border p-0 sm:max-w-md'
  const saveTemplateFooterClass =
    'shrink-0 border-t border-border bg-surface-1/90 px-6 py-4 sm:px-8 backdrop-blur-sm'

  const allTagOptions = useMemo(() => {
    const s = new Set<string>()
    MOCK_RECIPIENTS.forEach((r) => r.tags.forEach((t) => s.add(t)))
    return [...s].sort()
  }, [])

  const filteredRecipients = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    return MOCK_RECIPIENTS.filter((r) => {
      const matchesQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      const matchesTier = customerTier === 'all' || r.customerType === customerTier
      const matchesSegments =
        segmentFilter.length === 0 || segmentFilter.some((seg) => r.segments.includes(seg))
      const matchesTag = !tagFilter || r.tags.includes(tagFilter)
      return matchesQuery && matchesTier && matchesSegments && matchesTag
    })
  }, [debouncedQuery, customerTier, segmentFilter, tagFilter])

  const toggleRecipient = (id: string, checked: boolean) => {
    setSelectedRecipientIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const selectAllFiltered = () => {
    setSelectedRecipientIds((prev) => {
      const next = new Set(prev)
      filteredRecipients.forEach((r) => next.add(r.id))
      return next
    })
  }

  const clearSelection = () => setSelectedRecipientIds(new Set())

  const handleUseTemplate = useCallback(
    (tpl: MarketingEmailTemplate) => {
      setSubject(tpl.subject)
      setPreheader(tpl.preheader)
      setBlocks(cloneTemplateBlocks(tpl.blocks))
      setActiveTab('compose')
      addToast({ title: 'Template applied', description: 'Review the compose tab and send when ready.', variant: 'success' })
    },
    [addToast],
  )

  const handleDeleteTemplate = useCallback(
    (id: string) => {
      setTemplates((prev) => {
        const next = prev.filter((t) => t.id !== id)
        persistTemplatesState(next)
        return next
      })
      addToast({ title: 'Template removed', variant: 'success' })
    },
    [addToast],
  )

  const handleSendNow = () => {
    const v = validateMarketingCompose({ fromName, fromEmail, replyTo, bcc, subject })
    if (!v.ok) {
      addToast({ title: v.message, variant: 'warning' })
      return
    }
    addToast({ title: 'Campaign sent', description: 'Your email campaign has been queued for delivery.', variant: 'success' })
  }

  const handleSchedule = () => {
    const v = validateMarketingCompose({ fromName, fromEmail, replyTo, bcc, subject })
    if (!v.ok) {
      addToast({ title: v.message, variant: 'warning' })
      return
    }
    addToast({ title: 'Campaign scheduled', description: 'Select a date and time to schedule.', variant: 'info' })
  }

  const runComposeFieldValidation = useCallback((): boolean => {
    if (fromName.trim() && !isValidPersonName(fromName)) {
      addToast({ title: 'From name should be a real name without numbers.', variant: 'warning' })
      return false
    }
    if (fromEmail.trim() && !isValidEmail(fromEmail)) {
      addToast({ title: 'From email looks invalid.', variant: 'warning' })
      return false
    }
    if (replyTo.trim() && !isValidEmail(replyTo)) {
      addToast({ title: 'Reply-to must be a valid email.', variant: 'warning' })
      return false
    }
    const bccParts = parseEmailList(bcc)
    if (bccParts.length && !areAllValidEmails(bccParts)) {
      addToast({ title: 'BCC must be valid comma-separated emails.', variant: 'warning' })
      return false
    }
    return true
  }, [addToast, bcc, fromEmail, fromName, replyTo])

  const handleSaveDraft = () => {
    if (!runComposeFieldValidation()) return
    setSaveTemplateName(subject.trim() || 'Untitled template')
    setSaveTemplateOpen(true)
  }

  const confirmSaveAsTemplate = () => {
    const name = saveTemplateName.trim()
    if (!name) {
      addToast({ title: 'Enter a name for this template.', variant: 'warning' })
      return
    }
    const newTpl: MarketingEmailTemplate = {
      id: `tpl-saved-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: name,
      description: `Saved from compose · ${new Date().toLocaleDateString()}`,
      category: 'My templates',
      subject: subject.trim(),
      preheader: preheader.trim(),
      blocks: cloneTemplateBlocks(blocks),
    }
    setTemplates((prev) => {
      const next = [...prev, newTpl]
      persistTemplatesState(next)
      return next
    })
    setSaveTemplateOpen(false)
    setSaveTemplateName('')
    addToast({
      title: 'Template saved',
      description: `"${name}" is in your Templates library.`,
      variant: 'success',
    })
    setActiveTab('templates')
  }

  return (
    <div className="h-full flex flex-col">
      <header className="px-4 py-4 sm:px-8 sm:py-5 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-citrus-orange/10 flex items-center justify-center">
            <Mail className="w-4 h-4 text-citrus-orange" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Marketing</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Campaigns, contacts, templates, and compose</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => setActiveTab('compose')}
            className="h-10 w-10 shrink-0 rounded-lg p-0"
            aria-label="New campaign"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </header>

      <div className="px-4 py-3 sm:px-8 border-b border-border flex gap-1 overflow-x-auto hide-scrollbar">
        {TAB_ORDER.map((tab) => (
          <button
            key={tab}
            type="button"
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
            ? 'flex-1 flex flex-col min-h-0 overflow-hidden px-4 py-4 sm:px-8 sm:py-6'
            : activeTab === 'compose'
              ? 'flex-1 flex min-h-0 overflow-hidden'
              : 'flex-1 overflow-y-auto hide-scrollbar px-4 py-4 sm:px-8 sm:py-6'
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
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Opens
                </span>
                <span className="flex items-center gap-1">
                  <MousePointerClick className="w-3 h-3" /> Clicks
                </span>
                <span>Date</span>
              </div>
              {campaigns.map((c) => {
                const st = statusConfig[c.status]
                return (
                  <div
                    key={c.name}
                    className="grid grid-cols-[1fr_100px_80px_80px_100px] gap-4 px-5 py-3.5 border-b border-border/50 hover:bg-secondary/30 transition-colors items-center"
                  >
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="rounded-xl" style={{ height: TEMPLATE_CARD_PREVIEW_TOTAL_H + 140 }} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {templates.map((tpl) => (
                  <Card key={tpl.id} className="flex flex-col overflow-hidden border-border/70 shadow-none">
                    <div className="p-3 sm:p-4">
                      <TemplateCardEmailPreview
                        templateId={tpl.id}
                        subject={tpl.subject}
                        preheader={tpl.preheader}
                        blocks={tpl.blocks}
                      />
                    </div>
                    <CardContent className="flex flex-1 flex-col space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {tpl.category}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{tpl.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{tpl.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" className="min-w-0 flex-1" onClick={() => handleUseTemplate(tpl)}>
                          Use this template
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-10 w-10 shrink-0 p-0"
                          aria-label="Delete template"
                          onClick={() => handleDeleteTemplate(tpl.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'compose' && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-1 min-h-0">
              <Resizable
                direction={isLg ? 'horizontal' : 'vertical'}
                defaultPrimarySize={isLg ? 58 : 54}
                minPrimarySize={isLg ? 38 : 32}
                minSecondarySize={isLg ? 30 : 28}
                primary={
                  <ScrollArea
                    className={`h-full max-h-[calc(100vh-8rem)] ${isLg ? 'pr-3' : 'pb-2'}`}
                    maxHeight="calc(100vh - 8rem)"
                  >
                    <div className="space-y-4 px-4 py-4 pb-8 sm:px-8 sm:py-5 sm:pb-10">
                      <Collapsible
                        title="Sender & subject"
                        defaultOpen
                        className="rounded-xl border border-border/60 bg-surface-1/25 px-4 py-3"
                      >
                        <div className="mt-3 grid gap-4 md:grid-cols-2">
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">From name</Label>
                            <Input
                              value={fromName}
                              onChange={(e) => setFromName(stripDigitsFromName(e.target.value))}
                              placeholder="Display name"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">From email</Label>
                            <Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="newsletter@company.com" type="email" />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Subject</Label>
                            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line" />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Preheader</Label>
                            <Input
                              value={preheader}
                              onChange={(e) => setPreheader(e.target.value)}
                              placeholder="Preview text after the subject (optional)"
                            />
                          </div>
                        </div>
                      </Collapsible>

                      <Collapsible title="Reply routing" defaultOpen={false} className="rounded-xl border border-border/60 bg-surface-1/25 px-4 py-3">
                        <div className="mt-3 grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="text-[10px] text-muted-foreground">Reply-to</Label>
                            <Input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="Optional" type="email" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] text-muted-foreground">BCC (internal)</Label>
                            <Input value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="Comma-separated addresses" />
                          </div>
                        </div>
                      </Collapsible>

                      <Collapsible title="Tracking & UTM" defaultOpen={false} className="rounded-xl border border-border/60 bg-surface-1/25 px-4 py-3">
                        <div className="mt-3 space-y-4">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/40 px-3 py-2.5">
                              <Label className="text-xs text-foreground">Track opens</Label>
                              <Switch checked={trackOpens} onCheckedChange={setTrackOpens} />
                            </div>
                            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/40 px-3 py-2.5">
                              <Label className="text-xs text-foreground">Track clicks</Label>
                              <Switch checked={trackClicks} onCheckedChange={setTrackClicks} />
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground">UTM tagging applies when click tracking is enabled.</p>
                          <div className="grid gap-3 md:grid-cols-3">
                            <div className="space-y-1.5">
                              <Label className="text-[10px] text-muted-foreground">UTM source</Label>
                              <Input value={utmSource} onChange={(e) => setUtmSource(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[10px] text-muted-foreground">UTM medium</Label>
                              <Input value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} />
                            </div>
                            <div className="space-y-1.5 md:col-span-1">
                              <Label className="text-[10px] text-muted-foreground">UTM campaign</Label>
                              <Input value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} placeholder="spring-launch" />
                            </div>
                          </div>
                        </div>
                      </Collapsible>

                      <div className="rounded-xl border border-border/60 bg-surface-1/25 px-4 py-4">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Email body</p>
                        <div className="mt-3">
                          <MarketingComposeBlocks blocks={blocks} onBlocksChange={setBlocks} />
                        </div>
                      </div>

                      <Collapsible title="Plain text fallback" defaultOpen={false} className="rounded-xl border border-border/60 bg-surface-1/25 px-4 py-3">
                        <div className="mt-3">
                          <Textarea
                            value={plainTextFallback}
                            onChange={(e) => setPlainTextFallback(e.target.value)}
                            rows={4}
                            resize="vertical"
                            placeholder="Optional. Shown in clients without HTML support."
                          />
                        </div>
                      </Collapsible>

                      <Collapsible
                        title={
                          <span className="flex flex-wrap items-center gap-2">
                            Recipients
                            <Badge variant="secondary" className="text-[10px]">
                              {selectedRecipientIds.size} selected
                            </Badge>
                          </span>
                        }
                        defaultOpen={false}
                        className="rounded-xl border border-border/60 bg-surface-1/25 px-4 py-3"
                      >
                        <div className="mt-3 space-y-3">
                          <SearchBar
                            value={recipientQuery}
                            onChange={(e) => setRecipientQuery(e.target.value)}
                            placeholder="Search name, email, company, or tag…"
                          />

                          <Collapsible title="Audience filters" defaultOpen={false} className="rounded-lg border border-border/50 bg-background/30 px-3 py-2">
                            <div className="mt-3 space-y-3">
                              <div className="space-y-2">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Customer tier</p>
                                <ToggleGroup
                                  type="single"
                                  items={CUSTOMER_TOGGLE_ITEMS}
                                  value={customerTier}
                                  onValueChange={(v) => {
                                    if (typeof v === 'string' && v) setCustomerTier(v)
                                    else setCustomerTier('all')
                                  }}
                                  className="flex flex-wrap gap-1"
                                />
                              </div>
                              <div className="space-y-2">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Engagement segments</p>
                                <ToggleGroup
                                  type="multiple"
                                  items={SEGMENT_TOGGLE_ITEMS}
                                  value={segmentFilter}
                                  onValueChange={(v) => {
                                    if (Array.isArray(v)) setSegmentFilter(v)
                                  }}
                                  className="flex flex-wrap gap-1"
                                />
                              </div>
                              <div className="space-y-2">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tag</p>
                                <div className="flex flex-wrap gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setTagFilter('')}
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                                      !tagFilter ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                    }`}
                                  >
                                    All tags
                                  </button>
                                  {allTagOptions.map((t) => (
                                    <button
                                      key={t}
                                      type="button"
                                      onClick={() => setTagFilter(t)}
                                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                                        tagFilter === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                      }`}
                                    >
                                      {t}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </Collapsible>

                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="secondary" className="h-8 text-xs" onClick={selectAllFiltered}>
                              Select all in view
                            </Button>
                            <Button type="button" variant="secondary" className="h-8 text-xs" onClick={clearSelection}>
                              Clear selection
                            </Button>
                          </div>

                          <ScrollArea className="max-h-52 rounded-lg border border-border" maxHeight="13rem">
                            <div className="divide-y divide-border/60">
                              {filteredRecipients.length === 0 ? (
                                <p className="px-4 py-3 text-xs text-muted-foreground">No contacts match your filters.</p>
                              ) : (
                                filteredRecipients.map((r) => (
                                  <label
                                    key={r.id}
                                    className="flex cursor-pointer items-start gap-3 px-4 py-2.5 hover:bg-secondary/20"
                                  >
                                    <Checkbox
                                      checked={selectedRecipientIds.has(r.id)}
                                      onCheckedChange={(c) => toggleRecipient(r.id, c === true)}
                                      className="mt-0.5"
                                    />
                                    <span className="min-w-0 flex-1">
                                      <span className="block text-sm font-medium text-foreground">{r.name}</span>
                                      <span className="block text-[11px] text-muted-foreground">{r.email}</span>
                                      <span className="mt-0.5 block text-[10px] text-muted-foreground">{r.company}</span>
                                    </span>
                                    <span className="hidden shrink-0 flex-wrap justify-end gap-1 sm:flex">
                                      {r.tags.map((t) => (
                                        <Badge key={t} variant="outline" className="text-[9px]">
                                          {t}
                                        </Badge>
                                      ))}
                                    </span>
                                  </label>
                                ))
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      </Collapsible>

                      <Separator className="opacity-60" />

                      <EmailComposeActionButtons onSendNow={handleSendNow} onSchedule={handleSchedule} onSaveDraft={handleSaveDraft} />
                    </div>
                  </ScrollArea>
                }
                secondary={
                  <ScrollArea
                    className={`h-full ${isLg ? 'pl-2 pr-1' : 'px-2'}`}
                    maxHeight="calc(100vh - 8rem)"
                  >
                    <div className={`space-y-3 ${isLg ? 'sticky top-0 py-4 pr-2 sm:py-6' : 'py-4'}`}>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Live preview</p>
                        <div className="flex w-fit max-w-full gap-2 rounded-lg border border-border bg-surface-1 p-1.5 shadow-sm">
                          <Button
                            type="button"
                            variant={previewDevice === 'desktop' ? 'primary' : 'secondary'}
                            className="h-10 w-10 shrink-0 p-0"
                            onClick={() => setPreviewDevice('desktop')}
                            aria-label="Desktop preview"
                            aria-pressed={previewDevice === 'desktop'}
                          >
                            <Monitor className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant={previewDevice === 'tablet' ? 'primary' : 'secondary'}
                            className="h-10 w-10 shrink-0 p-0"
                            onClick={() => setPreviewDevice('tablet')}
                            aria-label="Tablet preview"
                            aria-pressed={previewDevice === 'tablet'}
                          >
                            <Tablet className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant={previewDevice === 'mobile' ? 'primary' : 'secondary'}
                            className="h-10 w-10 shrink-0 p-0"
                            onClick={() => setPreviewDevice('mobile')}
                            aria-label="Mobile preview"
                            aria-pressed={previewDevice === 'mobile'}
                          >
                            <Smartphone className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <EmailClientPreview
                        subject={subject}
                        preheader={preheader}
                        fromName={fromName}
                        fromEmail={fromEmail}
                        blocks={blocks}
                        device={previewDevice}
                      />
                    </div>
                  </ScrollArea>
                }
              />
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={saveTemplateOpen}
        onOpenChange={(open) => {
          setSaveTemplateOpen(open)
          if (!open) setSaveTemplateName('')
        }}
      >
        <DialogContent showCloseButton className={saveTemplateDialogClass}>
          <DialogHeader className="shrink-0 space-y-1 px-6 pb-2 pt-6 text-left sm:px-8 sm:pt-8">
            <DialogTitle>Save as template</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Choose a name for this template. Subject, preheader, and blocks will be stored and appear in Templates.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 sm:px-8">
            <Label htmlFor="save-template-name" className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Template name
            </Label>
            <Input
              id="save-template-name"
              className="mt-2"
              value={saveTemplateName}
              onChange={(e) => setSaveTemplateName(e.target.value)}
              placeholder="e.g. Q1 newsletter"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  confirmSaveAsTemplate()
                }
              }}
            />
          </div>
          <DialogFooter className={`${saveTemplateFooterClass} flex-col gap-2 sm:flex-row sm:justify-end`}>
            <Button type="button" variant="secondary" onClick={() => setSaveTemplateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmSaveAsTemplate}>
              Save template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
