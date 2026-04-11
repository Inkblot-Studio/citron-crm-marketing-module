import {
  Button,
  Skeleton,
  Resizable,
  Separator,
  Switch,
  Checkbox,
  ScrollArea,
  Badge,
  Label,
  Input,
  EmailComposeActionButtons,
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
import { AutoGrowTextarea } from '@/lib/AutoGrowTextarea'
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
  Trash2,
  Users,
  Search,
  Monitor,
  Tablet,
  Smartphone,
  BarChart3,
  LayoutTemplate,
  type LucideIcon,
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

const MAIN_TAB_ORDER: Exclude<Tab, 'compose'>[] = ['campaigns', 'contacts', 'templates']
const TAB_LABELS: Record<Tab, string> = {
  campaigns: 'Campaigns',
  contacts: 'Contacts',
  templates: 'Templates',
  compose: 'Compose',
}

const MAIN_TAB_ICONS: Record<Exclude<Tab, 'compose'>, LucideIcon> = {
  campaigns: BarChart3,
  contacts: Users,
  templates: LayoutTemplate,
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

function recipientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const a = parts[0]?.[0]
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1]
  return `${a ?? ''}${b ?? ''}`.toUpperCase() || '?'
}

function recipientTierLabel(customerType: Recipient['customerType']): string {
  return CUSTOMER_TOGGLE_ITEMS.find((i) => i.id === customerType)?.label ?? customerType
}

function segmentDisplayLabel(segmentId: string): string {
  return SEGMENT_TOGGLE_ITEMS.find((s) => s.id === segmentId)?.label ?? segmentId
}

const RECIPIENT_FILTER_PILL_BASE =
  'shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-citrus-orange/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
function recipientFilterPillClasses(active: boolean): string {
  return active
    ? `${RECIPIENT_FILTER_PILL_BASE} border-citrus-orange/30 bg-citrus-orange/15 text-citrus-orange`
    : `${RECIPIENT_FILTER_PILL_BASE} border-border/35 bg-muted/40 text-muted-foreground hover:border-border/55 hover:bg-muted/55 hover:text-foreground`
}

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

/** Shared width for compose collapsibles, email body blocks, and related sections. */
const COMPOSE_FORM_INNER = 'mx-auto w-full max-w-2xl space-y-5 px-3 py-4 pb-8 sm:px-5 sm:py-5 sm:pb-10'

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
  variant = 'default',
}: {
  blocks: EmailBlock[]
  device: PreviewDevice
  keyPrefix: string
  /** Live preview: tipografía más marcada (negrita / foreground). */
  variant?: 'default' | 'live'
}) {
  const live = variant === 'live'
  const headingWeight = live ? 'font-extrabold' : 'font-bold'
  const headingClass =
    device === 'mobile'
      ? `text-lg ${headingWeight} leading-snug text-foreground`
      : device === 'tablet'
        ? `text-xl ${headingWeight} leading-tight text-foreground`
        : `text-2xl ${headingWeight} leading-tight text-foreground`
  const bodyClass = live
    ? device === 'mobile'
      ? 'text-xs font-semibold leading-relaxed text-foreground'
      : 'text-sm font-semibold leading-relaxed text-foreground'
    : device === 'mobile'
      ? 'text-xs leading-relaxed text-muted-foreground'
      : 'text-sm leading-relaxed text-muted-foreground'

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
                className={`inline-block rounded-md bg-primary text-primary-foreground ${
                  live ? 'font-bold' : 'font-medium'
                } ${device === 'mobile' ? 'px-4 py-2 text-xs' : 'px-6 py-2.5 text-sm'}`}
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
              className={`grid grid-cols-2 gap-3 ${live ? 'font-medium text-foreground' : 'text-muted-foreground'} ${device === 'mobile' ? 'gap-2 text-[11px]' : 'text-sm'}`}
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

/** Compact template preview: email body only, fixed height + scroll. */
const TEMPLATE_CARD_PREVIEW_TOTAL_H = 300
const TEMPLATE_CARD_PREVIEW_SCROLL_H = 300

function TemplateCardEmailPreview({ templateId, blocks }: { templateId: string; blocks: EmailBlock[] }) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-lg border border-border/40 bg-white shadow-sm"
      style={{ height: TEMPLATE_CARD_PREVIEW_TOTAL_H }}
    >
      <ScrollArea className="w-full min-h-0 flex-1" style={{ height: TEMPLATE_CARD_PREVIEW_SCROLL_H }} maxHeight={`${TEMPLATE_CARD_PREVIEW_SCROLL_H}px`}>
        <div className="bg-white px-3 py-3 sm:px-5">
          <div className="mx-auto max-w-[540px] space-y-3 rounded-md border border-border/30 bg-white px-4 py-5">
            <StaticEmailBlocks blocks={blocks} device="desktop" keyPrefix={templateId} />
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

/** Mirrors `Card` + `TemplateCardEmailPreview` + `CardContent` (badge, title, description, actions). */
function MarketingTemplateCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border/35 bg-white shadow-sm">
      <div className="p-2 sm:p-3">
        <Skeleton className="w-full rounded-lg" style={{ height: TEMPLATE_CARD_PREVIEW_TOTAL_H }} />
      </div>
      <div className="flex flex-1 flex-col space-y-2 p-3 pt-0 sm:p-4 sm:pt-0">
        <Skeleton className="h-5 w-20 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-48 max-w-[85%] rounded-md" />
          <Skeleton className="h-3 w-full max-w-md rounded-md" />
          <Skeleton className="h-3 w-full max-w-sm rounded-md" />
        </div>
        <div className="mt-auto flex gap-2 pt-1">
          <Skeleton className="h-10 min-w-0 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

/** KPI row + campaign table header and rows (same grid as loaded tab). */
function CampaignsTabSkeleton() {
  return (
    <>
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-4">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="mt-3 h-8 w-16 rounded-md" />
            <Skeleton className="mt-2 h-3 w-32 rounded" />
          </div>
        ))}
      </div>
      <div className="glass rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_80px_80px_100px] gap-4 border-b border-border px-5 py-3">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-3 w-12 rounded" />
          <Skeleton className="h-3 w-10 rounded" />
          <Skeleton className="h-3 w-12 rounded" />
          <Skeleton className="h-3 w-14 rounded" />
        </div>
        {Array.from({ length: 5 }).map((_, ri) => (
          <div
            key={ri}
            className="grid grid-cols-[1fr_100px_80px_80px_100px] gap-4 border-b border-border/50 px-5 py-3.5"
          >
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-4 w-full max-w-[14rem] rounded-md" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
            <Skeleton className="h-4 w-16 rounded-md" />
            <Skeleton className="h-4 w-10 rounded-md" />
            <Skeleton className="h-4 w-10 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
        ))}
      </div>
    </>
  )
}

/** Compose: primary form column + live preview (matches `Resizable` + scroll areas). */
function ComposeTabSkeleton({ isLg }: { isLg: boolean }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1">
        <div
          className={`flex h-full min-h-0 flex-col gap-0 ${isLg ? 'lg:flex-row' : ''} [&>div:first-child]:border-0 [&>div:first-child]:shadow-none [&>div:first-child]:ring-0`}
        >
          <div
            className={`min-h-0 min-w-0 overflow-hidden ${isLg ? 'lg:w-[58%] lg:flex-none' : 'border-b border-border pb-2'}`}
          >
            <ScrollArea
              className={`h-full max-h-[calc(100vh-5.5rem)] border-0 bg-transparent shadow-none ring-0 ${isLg ? 'pr-3' : 'pb-2'}`}
              maxHeight="calc(100vh - 5.5rem)"
            >
              <div className={COMPOSE_FORM_INNER}>
                <div className="rounded-xl bg-surface-1/35 px-4 py-3 sm:px-5">
                  <Skeleton className="h-3 w-40 rounded" />
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <Skeleton className="h-10 w-full rounded-lg md:col-span-2" />
                    <Skeleton className="h-10 w-full rounded-lg md:col-span-2" />
                    <Skeleton className="h-10 w-full rounded-lg md:col-span-2" />
                  </div>
                </div>
                <Skeleton className="h-24 w-full rounded-xl" />
                <div className="rounded-xl bg-surface-1/35 px-4 py-4 sm:px-5">
                  <Skeleton className="h-3 w-28 rounded" />
                  <div className="mt-3 flex items-start gap-3">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                    <Skeleton className="h-36 min-w-0 flex-1 rounded-xl" />
                  </div>
                </div>
                <Skeleton className="h-28 w-full rounded-xl" />
              </div>
            </ScrollArea>
          </div>
          <div className={`min-h-0 min-w-0 flex-1 overflow-hidden ${isLg ? 'lg:w-[42%] lg:flex-none' : ''}`}>
            <ScrollArea
              className={`h-full max-h-[calc(100vh-5.5rem)] border-0 bg-transparent shadow-none ring-0 outline-none ${isLg ? 'pl-3 pr-2' : 'px-3'}`}
              maxHeight="calc(100vh - 5.5rem)"
            >
              <div className={`mx-auto flex w-full max-w-2xl flex-col ${isLg ? 'sticky top-0 py-4' : 'py-4'}`}>
                <div className="px-1 pb-4 pt-1 sm:px-2">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Skeleton className="h-3 w-28 rounded" />
                    <div className="flex w-fit shrink-0 gap-0.5 rounded-full border border-border/30 bg-muted/25 p-0.5">
                      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="min-h-[min(60vh,580px)] px-2 py-8 sm:min-h-[min(65vh,640px)] sm:px-4 sm:py-10">
                  <Skeleton className="mx-auto min-h-[min(52vh,520px)] w-full max-w-[560px] rounded-2xl sm:min-h-[min(58vh,600px)]" />
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
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
    <div className="w-full min-w-0 flex-1 space-y-2">
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
        <AutoGrowTextarea value={b.content} onChange={(e) => updateContent(b.id, e.target.value)} rows={4} placeholder="Body text" />
      ) : null}
      {b.type === 'image' ? (
        <div className="space-y-2">
          <Input value={b.content} onChange={(e) => updateContent(b.id, e.target.value)} placeholder="Image URL" />
          {b.content ? (
            <div className="overflow-hidden rounded-md border border-border/40 bg-muted/25">
              <img src={b.content} alt="" className="max-h-40 w-full object-cover" />
            </div>
          ) : null}
        </div>
      ) : null}
      {b.type === 'button' ? (
        <div className="flex w-full flex-col items-center gap-2 py-1">
          <Input value={b.content} onChange={(e) => updateContent(b.id, e.target.value)} placeholder="Button label" className="w-full text-center" />
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
                <AutoGrowTextarea
                  value={L}
                  onChange={(e) => updateContent(b.id, joinColumns(e.target.value, R))}
                  rows={3}
                  placeholder="Left column"
                />
                <AutoGrowTextarea
                  value={R}
                  onChange={(e) => updateContent(b.id, joinColumns(L, e.target.value))}
                  rows={3}
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
    <div className="w-full min-w-0 space-y-3">
      <DropdownMenu>
        <DropdownMenuTrigger
          showChevron={false}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-white p-0 text-foreground shadow-sm hover:bg-muted/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-citrus-orange/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=open]:border-citrus-orange/40 data-[state=open]:bg-white"
          aria-label="Add block"
        >
          <Plus className="h-6 w-6 shrink-0" strokeWidth={2} />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-h-0 min-w-[12rem] max-h-[min(70dvh,20rem)] overflow-y-auto">
          {ALL_BLOCK_TYPES.map((t) => (
            <DropdownMenuItem key={t} onClick={() => addBlock(t)}>
              {ADD_BLOCK_LABELS[t]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {blocks.length === 0 ? (
        <div className="flex min-h-[220px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/50 bg-muted/15 text-center">
          <p className="text-sm text-muted-foreground">No blocks yet</p>
          <p className="text-[10px] text-muted-foreground/80">Add blocks from the menu, or apply a template from the Templates tab.</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="compose-blocks">
            {(dropProvided) => (
              <div ref={dropProvided.innerRef} {...dropProvided.droppableProps} className="w-full space-y-2">
                {blocks.map((b, index) => (
                  <Draggable key={b.id} draggableId={b.id} index={index}>
                    {(dragProvided, snapshot) => (
                      <article
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        style={dragProvided.draggableProps.style}
                        className={`w-full min-w-0 cursor-grab touch-manipulation rounded-xl border border-border/45 bg-surface-1/55 px-3 py-3 shadow-sm outline-none transition-[box-shadow,background-color,border-color] duration-200 ease-out focus-visible:outline-none active:cursor-grabbing ${
                          snapshot.isDragging
                            ? 'z-10 border-citrus-orange/35 bg-citrus-orange/[0.07] shadow-md'
                            : 'hover:border-border/55 hover:bg-surface-1/75'
                        }`}
                      >
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

function EmailClientPreview({ blocks, device }: { blocks: EmailBlock[]; device: PreviewDevice }) {
  const frame =
    device === 'mobile'
      ? 'w-full max-w-[320px]'
      : device === 'tablet'
        ? 'w-full max-w-[480px]'
        : 'w-full max-w-[560px]'

  const innerPad = device === 'mobile' ? 'px-3 py-3' : device === 'tablet' ? 'px-4 py-4' : 'px-5 py-5'

  return (
    <div className={`mx-auto w-full transition-[max-width] duration-300 ease-out ${frame}`}>
      <div className="rounded-2xl bg-white p-1 sm:p-1.5">
        <div
          className={`space-y-3 rounded-xl bg-white sm:space-y-4 ${innerPad} min-h-[min(52vh,520px)] sm:min-h-[min(58vh,600px)]`}
        >
          <StaticEmailBlocks blocks={blocks} device={device} keyPrefix="live-preview" variant="live" />
        </div>
      </div>
    </div>
  )
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
  const [recipientSearchQuery, setRecipientSearchQuery] = useState('')
  const [customerTier, setCustomerTier] = useState('all')
  const [segmentFilter, setSegmentFilter] = useState<string[]>([])
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<string>>(() => new Set())
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop')
  const [templates, setTemplates] = useState<MarketingEmailTemplate[]>(loadTemplatesFromStorage)
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const [saveTemplateName, setSaveTemplateName] = useState('')
  /** Set to true while fetching so each tab shows layout-matched skeletons. */
  const [campaignsLoading] = useState(false)
  const [templatesLoading] = useState(false)
  const [contactsLoading] = useState(false)
  const [composeLoading] = useState(false)
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
    const q = recipientSearchQuery.trim().toLowerCase()
    return MOCK_RECIPIENTS.filter((r) => {
      const matchesQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)) ||
        r.segments.some((s) => s.toLowerCase().includes(q))
      const matchesTier = customerTier === 'all' || r.customerType === customerTier
      const matchesSegments =
        segmentFilter.length === 0 || segmentFilter.some((seg) => r.segments.includes(seg))
      const matchesTags =
        tagFilters.length === 0 || tagFilters.some((tf) => r.tags.includes(tf))
      return matchesQuery && matchesTier && matchesSegments && matchesTags
    })
  }, [recipientSearchQuery, customerTier, segmentFilter, tagFilters])

  const selectedRecipientsList = useMemo(
    () => MOCK_RECIPIENTS.filter((r) => selectedRecipientIds.has(r.id)),
    [selectedRecipientIds],
  )

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

  const toggleSegmentFilter = (id: string) => {
    setSegmentFilter((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  }

  const toggleTagFilterChip = (tag: string) => {
    setTagFilters((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const clearAudienceFilters = () => {
    setCustomerTier('all')
    setSegmentFilter([])
    setTagFilters([])
    setRecipientSearchQuery('')
  }

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
      <header className="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 md:px-6 md:py-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
            <Mail className="h-4 w-4 text-accent" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">Marketing</h1>
            <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">Campaigns, contacts, and templates</p>
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-start gap-2 sm:justify-end">
          <div
            className="flex items-center divide-x divide-border overflow-hidden rounded-lg border border-border"
            role="tablist"
            aria-label="Marketing sections"
          >
            {MAIN_TAB_ORDER.map((tab) => {
              const TabIcon = MAIN_TAB_ICONS[tab]
              const selected = activeTab === tab
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-label={TAB_LABELS[tab]}
                  title={TAB_LABELS[tab]}
                  onClick={() => setActiveTab(tab)}
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    selected
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  }`}
                >
                  <TabIcon className="h-4 w-4 shrink-0" aria-hidden />
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('compose')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-all duration-150 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95"
            aria-label={TAB_LABELS.compose}
            title={TAB_LABELS.compose}
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        </div>
      </header>

      <div
        className={
          activeTab === 'contacts'
            ? 'flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6'
            : activeTab === 'compose'
              ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
              : 'hide-scrollbar flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6'
        }
      >
        {activeTab === 'contacts' && <ContactsPage embedded loading={contactsLoading} />}

        {activeTab === 'campaigns' &&
          (campaignsLoading ? (
            <CampaignsTabSkeleton />
          ) : (
            <>
              <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  { label: 'Total Sent', value: '12.4K', sub: 'This month' },
                  { label: 'Avg. Open Rate', value: '64%', sub: '+8% vs prior' },
                  { label: 'Avg. Click Rate', value: '22%', sub: '+3% vs prior' },
                  { label: 'Active Automations', value: '7', sub: '3 paused' },
                ].map((kpi) => (
                  <div key={kpi.label} className="glass rounded-xl p-4">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                    <p className="mt-1 text-2xl font-semibold text-foreground">{kpi.value}</p>
                    <span className="text-[10px] text-citrus-lime">{kpi.sub}</span>
                  </div>
                ))}
              </div>

              <div className="glass rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1fr_100px_80px_80px_100px] gap-4 border-b border-border px-5 py-3 text-[10px] text-muted-foreground uppercase tracking-wider">
                  <span>Campaign</span>
                  <span>Status</span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> Opens
                  </span>
                  <span className="flex items-center gap-1">
                    <MousePointerClick className="h-3 w-3" /> Clicks
                  </span>
                  <span>Date</span>
                </div>
                {campaigns.map((c) => {
                  const st = statusConfig[c.status]
                  return (
                    <div
                      key={c.name}
                      className="grid grid-cols-[1fr_100px_80px_80px_100px] gap-4 border-b border-border/50 px-5 py-3.5 transition-colors hover:bg-secondary/30 items-center"
                    >
                      <div>
                        <span className="text-sm font-medium text-foreground">{c.name}</span>
                        <span className="ml-2 text-[10px] text-muted-foreground">{c.recipients.toLocaleString()} recipients</span>
                      </div>
                      <span className={`flex items-center gap-1.5 text-xs ${st.color}`}>
                        <st.icon className="h-3 w-3" />
                        {st.label}
                      </span>
                      <span className="font-mono text-sm text-foreground">{c.openRate ? `${c.openRate}%` : '—'}</span>
                      <span className="font-mono text-sm text-foreground">{c.clickRate ? `${c.clickRate}%` : '—'}</span>
                      <span className="text-xs text-muted-foreground">{c.sentAt}</span>
                    </div>
                  )
                })}
              </div>
            </>
          ))}

        {activeTab === 'templates' && (
          <div className="mx-auto w-full max-w-[88rem] space-y-6 px-4 py-3 md:px-6 md:py-4 lg:px-8">
            {templatesLoading ? (
              <div className="grid grid-cols-1 gap-14 sm:grid-cols-2 sm:gap-16 lg:gap-20 xl:grid-cols-3 xl:gap-24">
                {Array.from({ length: 6 }).map((_, i) => (
                  <MarketingTemplateCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-14 sm:grid-cols-2 sm:gap-16 lg:gap-20 xl:grid-cols-3 xl:gap-24">
                {templates.map((tpl) => (
                  <Card key={tpl.id} className="flex flex-col overflow-hidden border border-border/35 bg-white shadow-sm">
                    <div className="p-2 sm:p-3">
                      <TemplateCardEmailPreview templateId={tpl.id} blocks={tpl.blocks} />
                    </div>
                    <CardContent className="flex flex-1 flex-col space-y-2 p-3 pt-0 sm:p-4 sm:pt-0">
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

        {activeTab === 'compose' && composeLoading ? (
          <ComposeTabSkeleton isLg={isLg} />
        ) : null}

        {activeTab === 'compose' && !composeLoading && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1">
              <Resizable
                direction={isLg ? 'horizontal' : 'vertical'}
                defaultPrimarySize={isLg ? 58 : 54}
                minPrimarySize={isLg ? 38 : 32}
                minSecondarySize={isLg ? 30 : 28}
                className="!border-0 bg-transparent shadow-none ring-0 [&>div:first-child]:border-0 [&>div:first-child]:shadow-none [&>div:first-child]:ring-0"
                primary={
                  <ScrollArea
                    className={`h-full max-h-[calc(100vh-5.5rem)] border-0 bg-transparent shadow-none ring-0 outline-none ${isLg ? 'pr-3' : 'pb-2'}`}
                    maxHeight="calc(100vh - 5.5rem)"
                  >
                    <div className={COMPOSE_FORM_INNER}>
                      <Collapsible
                        title="Sender & subject"
                        defaultOpen
                        className="rounded-xl bg-surface-1/35 px-4 py-3 sm:px-5"
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

                      <Collapsible title="Reply routing" defaultOpen={false} className="rounded-xl bg-surface-1/35 px-4 py-3 sm:px-5">
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

                      <Collapsible title="Tracking & UTM" defaultOpen={false} className="rounded-xl bg-surface-1/35 px-4 py-3 sm:px-5">
                        <div className="mt-3 space-y-4">
                          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/25 px-3 py-2.5">
                              <Label className="text-xs text-foreground">Track opens</Label>
                              <Switch checked={trackOpens} onCheckedChange={setTrackOpens} />
                            </div>
                            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/25 px-3 py-2.5">
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

                      <div className="w-full rounded-xl bg-surface-1/35 px-4 py-4 sm:px-5">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Email body</p>
                        <div className="mt-3 w-full min-w-0">
                          <MarketingComposeBlocks blocks={blocks} onBlocksChange={setBlocks} />
                        </div>
                      </div>

                      <Collapsible title="Plain text fallback" defaultOpen={false} className="rounded-xl bg-surface-1/35 px-4 py-3 sm:px-5">
                        <div className="mt-3">
                          <AutoGrowTextarea
                            value={plainTextFallback}
                            onChange={(e) => setPlainTextFallback(e.target.value)}
                            rows={4}
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
                        className="rounded-xl bg-surface-1/35 px-4 py-3 sm:px-5"
                      >
                        <div className="mt-4 space-y-4">
                          <div className="rounded-xl border border-border/40 bg-white px-3 py-3 shadow-sm sm:px-4 sm:py-4">
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/35 pb-3">
                              <div className="flex min-w-0 items-center gap-2.5">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-citrus-orange/10 text-citrus-orange">
                                  <Users className="h-4 w-4" />
                                </span>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-foreground">Choose recipients</p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {filteredRecipients.length} match filters · {selectedRecipientIds.size} selected
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={clearAudienceFilters}
                                className="shrink-0 rounded-full border border-border/40 bg-muted/30 px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-border/55 hover:bg-muted/50 hover:text-foreground"
                              >
                                Reset filters
                              </button>
                            </div>

                            <div className="mt-4 space-y-3">
                              <div>
                                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tier</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {CUSTOMER_TOGGLE_ITEMS.map((item) => (
                                    <button
                                      key={item.id}
                                      type="button"
                                      onClick={() => setCustomerTier(item.id)}
                                      className={recipientFilterPillClasses(customerTier === item.id)}
                                    >
                                      {item.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Segments</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {SEGMENT_TOGGLE_ITEMS.map((item) => (
                                    <button
                                      key={item.id}
                                      type="button"
                                      onClick={() => toggleSegmentFilter(item.id)}
                                      className={recipientFilterPillClasses(segmentFilter.includes(item.id))}
                                    >
                                      {item.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tags</p>
                                <div className="flex max-h-[5.5rem] flex-wrap gap-1.5 overflow-y-auto pr-0.5">
                                  {allTagOptions.map((t) => (
                                    <button
                                      key={t}
                                      type="button"
                                      onClick={() => toggleTagFilterChip(t)}
                                      className={recipientFilterPillClasses(tagFilters.includes(t))}
                                    >
                                      {t}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-medium text-foreground">Contacts</span>
                            <div className="flex flex-wrap items-center gap-2 text-[11px]">
                              <button
                                type="button"
                                className="font-medium text-citrus-orange hover:underline"
                                onClick={selectAllFiltered}
                              >
                                Select all shown
                              </button>
                              <span className="text-border" aria-hidden>
                                ·
                              </span>
                              <button type="button" className="text-muted-foreground hover:text-foreground" onClick={clearSelection}>
                                Clear selection
                              </button>
                            </div>
                          </div>

                          <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              value={recipientSearchQuery}
                              onChange={(e) => setRecipientSearchQuery(e.target.value)}
                              placeholder="Filter this list as you type…"
                              className="rounded-xl border-border/40 bg-white pl-10 shadow-sm"
                              aria-label="Search contacts"
                            />
                          </div>

                          <div className="overflow-hidden rounded-xl border border-border/40 bg-muted/15">
                            <ScrollArea className="max-h-[min(40vh,18rem)]" maxHeight="min(40vh, 18rem)">
                              {filteredRecipients.length === 0 ? (
                                <p className="px-4 py-10 text-center text-xs text-muted-foreground">
                                  {recipientSearchQuery.trim()
                                    ? `No contacts match “${recipientSearchQuery.trim()}” with the current filters.`
                                    : 'No contacts match these filters. Adjust tier, segments, or tags.'}
                                </p>
                              ) : (
                                <ul className="space-y-2 p-2 sm:p-3">
                                  {filteredRecipients.map((r) => {
                                    const isSelected = selectedRecipientIds.has(r.id)
                                    return (
                                      <li key={r.id}>
                                        <label
                                          className={`flex cursor-pointer gap-3 rounded-xl border px-3 py-3 transition-[border-color,box-shadow,background-color] sm:gap-3.5 sm:px-4 ${
                                            isSelected
                                              ? 'border-citrus-orange/40 bg-white shadow-sm ring-1 ring-citrus-orange/15'
                                              : 'border-border/35 bg-white/90 hover:border-border/55 hover:bg-white'
                                          }`}
                                        >
                                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-citrus-orange/20 to-citrus-orange/5 text-[12px] font-bold tracking-tight text-citrus-orange">
                                            {recipientInitials(r.name)}
                                          </span>
                                          <div className="min-w-0 flex-1 space-y-1.5">
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                              <span className="text-sm font-semibold leading-tight text-foreground">{r.name}</span>
                                              <Badge variant="outline" className="h-5 border-border/50 px-1.5 text-[9px] font-normal text-muted-foreground">
                                                {recipientTierLabel(r.customerType)}
                                              </Badge>
                                            </div>
                                            <p className="truncate text-[11px] leading-snug text-muted-foreground">{r.email}</p>
                                            <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">
                                              {r.company}
                                            </p>
                                            <div className="flex flex-wrap gap-1 pt-0.5">
                                              {r.segments.map((seg) => (
                                                <span
                                                  key={seg}
                                                  className="inline-flex rounded-md border border-border/40 bg-muted/40 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground"
                                                >
                                                  {segmentDisplayLabel(seg)}
                                                </span>
                                              ))}
                                              {r.tags.map((tag) => (
                                                <span
                                                  key={tag}
                                                  className="inline-flex rounded-md bg-citrus-orange/10 px-1.5 py-0.5 text-[9px] font-medium text-citrus-orange"
                                                >
                                                  {tag}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                          <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={(c) => toggleRecipient(r.id, c === true)}
                                            className="mt-0.5 shrink-0 self-start"
                                          />
                                        </label>
                                      </li>
                                    )
                                  })}
                                </ul>
                              )}
                            </ScrollArea>
                          </div>

                          {selectedRecipientsList.length > 0 ? (
                            <div className="rounded-xl border border-border/40 bg-muted/20 px-3 py-3 sm:px-4">
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Will receive</p>
                                <span className="text-[10px] text-muted-foreground">{selectedRecipientsList.length} people</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {selectedRecipientsList.map((r) => (
                                  <span
                                    key={r.id}
                                    className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-border/35 bg-white px-2.5 py-1 text-[10px] text-foreground shadow-sm"
                                    title={`${r.name} · ${r.email}`}
                                  >
                                    <span className="truncate font-medium">{r.name}</span>
                                    <button
                                      type="button"
                                      className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                                      aria-label={`Remove ${r.name}`}
                                      onClick={() => toggleRecipient(r.id, false)}
                                    >
                                      <span className="sr-only">Remove</span>
                                      <span className="text-xs leading-none" aria-hidden>
                                        ×
                                      </span>
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Tick contacts in the list above to add them to this send.
                            </p>
                          )}
                        </div>
                      </Collapsible>

                      <Separator className="opacity-60" />

                      <EmailComposeActionButtons onSendNow={handleSendNow} onSchedule={handleSchedule} onSaveDraft={handleSaveDraft} />
                    </div>
                  </ScrollArea>
                }
                secondary={
                  <ScrollArea
                    className={`h-full max-h-[calc(100vh-5.5rem)] border-0 bg-transparent shadow-none ring-0 outline-none ${isLg ? 'pl-3 pr-2' : 'px-3'}`}
                    maxHeight="calc(100vh - 5.5rem)"
                  >
                    <div className={`mx-auto flex w-full max-w-2xl flex-col ${isLg ? 'sticky top-0 py-4' : 'py-4'}`}>
                      <div className="px-1 pb-4 pt-1 sm:px-2">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-foreground">Live Preview</p>
                          <div
                            role="group"
                            aria-label="Preview width"
                            className="flex w-fit shrink-0 rounded-full border border-border/30 bg-muted/25 p-0.5 shadow-inner"
                          >
                            {(
                              [
                                { id: 'desktop' as const, Icon: Monitor, label: 'Desktop' },
                                { id: 'tablet' as const, Icon: Tablet, label: 'Tablet' },
                                { id: 'mobile' as const, Icon: Smartphone, label: 'Mobile' },
                              ] as const
                            ).map(({ id, Icon, label }) => (
                              <button
                                key={id}
                                type="button"
                                aria-label={`${label} preview`}
                                aria-pressed={previewDevice === id}
                                onClick={() => setPreviewDevice(id)}
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                                  previewDevice === id
                                    ? 'bg-secondary text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:bg-white/70 hover:text-foreground'
                                }`}
                              >
                                <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="min-h-[min(60vh,580px)] px-2 py-8 sm:min-h-[min(65vh,640px)] sm:px-4 sm:py-10">
                        <EmailClientPreview blocks={blocks} device={previewDevice} />
                      </div>
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
