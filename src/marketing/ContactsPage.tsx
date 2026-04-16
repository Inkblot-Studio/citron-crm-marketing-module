import {
  Button,
  Input,
  Label,
  AdvancedDropdown,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Skeleton,
} from '@citron-systems/citron-ui'
import * as Popover from '@radix-ui/react-popover'
import { Search, Filter, Plus, Building2, Star, Pencil, X } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useToast } from '@/lib/ToastContext'
import { AutoGrowTextarea } from '@/lib/AutoGrowTextarea'
import {
  isValidEmail,
  isValidPersonName,
  stripDigitsFromName,
  normalizePhoneDigits,
  isValidPhoneDigits,
  isOptionalHttpUrl,
} from '@/lib/formValidation'

interface Contact {
  id: string
  name: string
  email: string
  phone: string
  company: string
  role: string
  timezone: string
  country: string
  linkedInUrl: string
  notes: string
  tags: string[]
  starred: boolean
}

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern (US)' },
  { value: 'America/Chicago', label: 'Central (US)' },
  { value: 'America/Denver', label: 'Mountain (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific (US)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Europe/Madrid', label: 'Madrid' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Seoul', label: 'Seoul' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Australia/Sydney', label: 'Sydney' },
  { value: 'UTC', label: 'UTC' },
]

const initialContacts: Contact[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    email: 'sarah.chen@acme.com',
    phone: '14155550142',
    company: 'Acme Corp',
    role: 'VP of Engineering',
    timezone: 'America/Los_Angeles',
    country: 'United States',
    linkedInUrl: 'https://linkedin.com/in/example-sarah',
    notes: 'Key champion for the renewal.',
    tags: ['Champion', 'Decision Maker'],
    starred: true,
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    email: 'marcus@techventures.io',
    phone: '16465550199',
    company: 'TechVentures',
    role: 'CTO',
    timezone: 'America/New_York',
    country: 'United States',
    linkedInUrl: '',
    notes: '',
    tags: ['Technical Buyer'],
    starred: false,
  },
  {
    id: '3',
    name: 'Elena Rodriguez',
    email: 'elena@globaltech.com',
    phone: '34915550100',
    company: 'GlobalTech Inc',
    role: 'Head of Product',
    timezone: 'Europe/Madrid',
    country: 'Spain',
    linkedInUrl: '',
    notes: 'Re-engage after quiet quarter.',
    tags: ['At Risk'],
    starred: false,
  },
  {
    id: '4',
    name: 'David Park',
    email: 'david@dataflow.dev',
    phone: '8225550188',
    company: 'DataFlow Labs',
    role: 'CEO',
    timezone: 'Asia/Seoul',
    country: 'South Korea',
    linkedInUrl: 'https://linkedin.com/in/example-david',
    notes: '',
    tags: ['Executive Sponsor'],
    starred: true,
  },
  {
    id: '5',
    name: 'Lisa Wang',
    email: 'lisa@startupxyz.com',
    phone: '15105550160',
    company: 'StartupXYZ',
    role: 'COO',
    timezone: 'America/Los_Angeles',
    country: 'United States',
    linkedInUrl: '',
    notes: '',
    tags: ['Champion', 'Budget Holder'],
    starred: false,
  },
  {
    id: '6',
    name: 'James Miller',
    email: 'james.miller@acme.com',
    phone: '442055550140',
    company: 'Acme Corp',
    role: 'Engineering Manager',
    timezone: 'Europe/London',
    country: 'United Kingdom',
    linkedInUrl: '',
    notes: '',
    tags: ['End User'],
    starred: false,
  },
  {
    id: '7',
    name: 'Anna Fischer',
    email: 'anna.fischer@globaltech.com',
    phone: '493055550120',
    company: 'GlobalTech Inc',
    role: 'CFO',
    timezone: 'Europe/Berlin',
    country: 'Germany',
    linkedInUrl: '',
    notes: '',
    tags: ['At Risk', 'Budget Holder'],
    starred: false,
  },
  {
    id: '8',
    name: 'Tom Nakamura',
    email: 'tom@techventures.io',
    phone: '81355550177',
    company: 'TechVentures',
    role: 'VP Sales',
    timezone: 'Asia/Tokyo',
    country: 'Japan',
    linkedInUrl: '',
    notes: '',
    tags: ['Decision Maker'],
    starred: true,
  },
]

const tagColors: Record<string, string> = {
  Champion: 'bg-citrus-lime/10 text-citrus-lime',
  'Decision Maker': 'bg-citrus-lemon/10 text-citrus-lemon',
  'Technical Buyer': 'bg-status-info/10 text-status-info',
  'At Risk': 'bg-destructive/10 text-destructive',
  'Executive Sponsor': 'bg-citrus-orange/10 text-citrus-orange',
  'Budget Holder': 'bg-citrus-green/10 text-citrus-green',
  'End User': 'bg-secondary text-secondary-foreground',
}

const allTags = ['Champion', 'Decision Maker', 'Technical Buyer', 'At Risk', 'Executive Sponsor', 'Budget Holder', 'End User']

type ContactsPageProps = { embedded?: boolean; loading?: boolean }

type FieldErrors = Partial<Record<'name' | 'email' | 'phone' | 'linkedin', string>>

/** Icon-only control size (dialogs, popover chrome). */
const HEADER_ICON_BTN =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-citrus-orange/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background'

/** Matches Marketing shell primary icon button (compose +, top right). */
const MARKETING_PRIMARY_ICON_BTN =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-all duration-150 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-citrus-orange/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95'

/** Contact dialog — close: same frame as compose +, white fill. */
const CONTACT_DETAIL_CLOSE_BTN =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-foreground shadow-sm transition-all duration-150 hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-citrus-orange/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95 dark:bg-card'

/** Filters trigger: same 32×32 frame as primary; white surface, sin borde. */
const CONTACTS_FILTER_ICON_BTN =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-white text-foreground shadow-none transition-all duration-150 hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-citrus-orange/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95 dark:bg-card'

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/35 px-3 py-2.5 shadow-sm dark:bg-muted/25 sm:px-3.5 sm:py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-2 break-words text-sm font-medium leading-snug text-foreground">{value.trim() ? value : '—'}</p>
    </div>
  )
}

const emptyNewContact = () => ({
  name: '',
  email: '',
  phone: '',
  company: '',
  role: '',
  timezone: 'America/New_York',
  country: '',
  linkedInUrl: '',
  notes: '',
  tags: [] as string[],
})

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const a = parts[0]?.[0]
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1]
  return `${a ?? ''}${b ?? ''}`.toUpperCase() || '?'
}

function validateContactFields(input: {
  name: string
  email: string
  phone: string
  linkedInUrl: string
}): FieldErrors {
  const errors: FieldErrors = {}
  if (!isValidPersonName(input.name)) {
    errors.name = 'Use a real name (letters only, no numbers).'
  }
  if (!isValidEmail(input.email)) {
    errors.email = 'Enter a valid email address.'
  }
  if (input.phone.trim() && !isValidPhoneDigits(input.phone)) {
    errors.phone = 'Use 7–15 digits (country code included).'
  }
  if (!isOptionalHttpUrl(input.linkedInUrl)) {
    errors.linkedin = 'Enter a valid http(s) URL or leave blank.'
  }
  return errors
}

export default function ContactsPage({ embedded = false, loading = false }: ContactsPageProps) {
  const hPad = embedded ? 'px-0' : 'px-8'
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterTags, setFilterTags] = useState<Set<string>>(() => new Set())
  const [filterCompany, setFilterCompany] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [starredOnly, setStarredOnly] = useState(false)
  const [newContact, setNewContact] = useState(emptyNewContact)
  const [addErrors, setAddErrors] = useState<FieldErrors>({})
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailEditing, setDetailEditing] = useState(false)
  const [draft, setDraft] = useState<Contact | null>(null)
  const [draftErrors, setDraftErrors] = useState<FieldErrors>({})
  const { addToast } = useToast()

  const openDetail = (c: Contact) => {
    setDetailEditing(false)
    setDraft({
      ...c,
      phone: normalizePhoneDigits(c.phone),
      name: stripDigitsFromName(c.name),
    })
    setDraftErrors({})
    setDetailOpen(true)
  }

  const closeDetail = (open: boolean) => {
    setDetailOpen(open)
    if (!open) {
      setDraft(null)
      setDraftErrors({})
      setDetailEditing(false)
    }
  }

  const saveDetail = () => {
    if (!draft) return
    const errs = validateContactFields({
      name: draft.name,
      email: draft.email,
      phone: draft.phone,
      linkedInUrl: draft.linkedInUrl,
    })
    setDraftErrors(errs)
    if (Object.keys(errs).length > 0) {
      addToast({ title: 'Fix the highlighted fields', variant: 'warning' })
      return
    }
    setContacts((prev) =>
      prev.map((c) =>
        c.id === draft.id
          ? {
              ...draft,
              phone: normalizePhoneDigits(draft.phone),
              name: draft.name.trim(),
              email: draft.email.trim(),
              linkedInUrl: draft.linkedInUrl.trim(),
            }
          : c,
      ),
    )
    addToast({ title: 'Contact updated', variant: 'success' })
    setDetailEditing(false)
    setDetailOpen(false)
    setDraft(null)
    setDraftErrors({})
  }

  const cancelDetailEdit = () => {
    const id = draft?.id
    if (!id) return
    const orig = contacts.find((c) => c.id === id)
    if (orig) {
      setDraft({
        ...orig,
        phone: normalizePhoneDigits(orig.phone),
        name: stripDigitsFromName(orig.name),
      })
    }
    setDraftErrors({})
    setDetailEditing(false)
  }

  const allCompanies = useMemo(
    () => [...new Set(contacts.map((c) => c.company))].sort((a, b) => a.localeCompare(b)),
    [contacts],
  )

  const allRoles = useMemo(
    () => [...new Set(contacts.map((c) => c.role))].sort((a, b) => a.localeCompare(b)),
    [contacts],
  )

  const toggleFilterTag = (tag: string) => {
    setFilterTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  const filtered = contacts.filter((c) => {
    const matchesSearch =
      !search.trim() ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase()) ||
      normalizePhoneDigits(c.phone).includes(normalizePhoneDigits(search))
    const matchesTags = filterTags.size === 0 || c.tags.some((t) => filterTags.has(t))
    const matchesCompany = !filterCompany || c.company === filterCompany
    const matchesRole = !filterRole || c.role === filterRole
    const matchesStarred = !starredOnly || c.starred
    return matchesSearch && matchesTags && matchesCompany && matchesRole && matchesStarred
  })

  const toggleStar = (id: string) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, starred: !c.starred } : c)))
    setDraft((d) => (d && d.id === id ? { ...d, starred: !d.starred } : d))
  }

  const handleAddContact = () => {
    const errs = validateContactFields({
      name: newContact.name,
      email: newContact.email,
      phone: newContact.phone,
      linkedInUrl: newContact.linkedInUrl,
    })
    setAddErrors(errs)
    if (Object.keys(errs).length > 0) {
      addToast({ title: 'Fix the highlighted fields', variant: 'warning' })
      return
    }
    const contact: Contact = {
      id: crypto.randomUUID(),
      name: newContact.name.trim(),
      email: newContact.email.trim(),
      phone: normalizePhoneDigits(newContact.phone),
      company: newContact.company.trim() || 'New company',
      role: newContact.role.trim() || 'Contact',
      timezone: newContact.timezone,
      country: newContact.country.trim(),
      linkedInUrl: newContact.linkedInUrl.trim(),
      notes: newContact.notes.trim(),
      tags: newContact.tags.length ? newContact.tags : ['End User'],
      starred: false,
    }
    setContacts((prev) => [contact, ...prev])
    setNewContact(emptyNewContact())
    setAddErrors({})
    setAddOpen(false)
    addToast({ title: 'Contact added', variant: 'success' })
  }

  const clearFilters = () => {
    setFilterTags(new Set())
    setFilterCompany('')
    setFilterRole('')
    setStarredOnly(false)
  }

  const filtersPanelClass =
    'mt-2 w-[min(100vw-1.5rem,20rem)] p-4 sm:p-5 z-[100] max-h-[min(85vh,520px)] overflow-y-auto rounded-xl border border-border bg-background shadow-lg'

  const addContactPanelClass =
    'mt-2 z-[100] flex w-[min(100vw-1.25rem,24rem)] max-h-[min(88vh,640px)] flex-col overflow-hidden rounded-xl border border-border bg-background p-0 shadow-lg outline-none'

  const hasActiveFilters = filterTags.size > 0 || !!filterCompany || !!filterRole || starredOnly


  const dialogShellClass =
    'relative flex max-h-[min(92dvh,760px)] w-[calc(100vw-1.25rem)] max-w-xl flex-col gap-0 overflow-hidden rounded-2xl border-0 bg-background p-0 shadow-2xl shadow-black/18 sm:max-w-xl dark:shadow-black/45'

  const dialogBodyClass =
    'overflow-y-auto bg-gradient-to-b from-muted/20 to-background/95 px-5 py-2.5 sm:px-6 sm:py-3 max-h-[min(75dvh,600px)]'

  const dialogFooterClass = 'shrink-0 border-0 bg-muted/25 px-5 py-3 backdrop-blur-md sm:px-6 sm:py-3'

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className={`flex flex-wrap items-center gap-2 border-b border-border py-3 md:py-4 ${hPad}`}>
          <Skeleton className="h-8 w-full max-w-[14rem] rounded-lg sm:max-w-[16rem]" />
          <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
          <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto hide-scrollbar py-3 md:py-4 ${hPad}`}>
          <div className="glass overflow-hidden rounded-xl">
            <div className="grid grid-cols-[40px_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-3 border-b border-border px-5 py-3">
              <span />
              <Skeleton className="h-3 w-10 rounded" />
              <Skeleton className="h-3 w-12 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-3 w-10 rounded" />
              <Skeleton className="h-3 w-10 rounded" />
            </div>
            {Array.from({ length: 8 }).map((_, ri) => (
              <div
                key={ri}
                className="grid grid-cols-[40px_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-3 border-b border-border/50 px-5 py-3 items-center"
              >
                <Skeleton className="mx-auto h-4 w-4 rounded" />
                <Skeleton className="h-4 w-full max-w-[9rem] rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-full max-w-[7rem] rounded-md" />
                <Skeleton className="h-4 w-full max-w-[6rem] rounded-md" />
                <div className="flex flex-wrap gap-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className={`flex flex-wrap items-center gap-2 border-b border-border py-3 md:py-4 ${hPad}`}>
        <div className="relative w-full max-w-[14rem] sm:max-w-[16rem]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-stone-200/85 bg-surface-1 py-0 pl-9 pr-3 text-sm leading-none text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-citrus-orange/45 dark:border-stone-600/65"
            placeholder="Search contacts..."
          />
        </div>
        <Popover.Root
          open={addOpen}
          onOpenChange={(open) => {
            setAddOpen(open)
            if (open) {
              setNewContact(emptyNewContact())
              setAddErrors({})
            }
          }}
        >
          <Popover.Trigger asChild>
            <button type="button" className={MARKETING_PRIMARY_ICON_BTN} aria-label="Add contact">
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              side="bottom"
              align="start"
              sideOffset={10}
              collisionPadding={16}
              className={addContactPanelClass}
            >
              <div className="flex min-h-0 max-h-[min(88vh,640px)] flex-col">
                <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border px-4 py-3 sm:px-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Add contact</p>
                    <p className="text-xs text-muted-foreground">Required fields are validated. Phone accepts digits only.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddOpen(false)}
                    className={`${HEADER_ICON_BTN} text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground`}
                    aria-label="Close"
                  >
                    <X className="h-4 w-4 shrink-0" />
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                  <div className="space-y-5">
                    <Card className="border-0 bg-muted/20 shadow-none">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Profile</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="space-y-1.5">
                          <Label className="text-[10px]">Name</Label>
                          <Input
                            value={newContact.name}
                            error={!!addErrors.name}
                            onChange={(e) => {
                              setAddErrors((p) => ({ ...p, name: undefined }))
                              setNewContact((p) => ({ ...p, name: stripDigitsFromName(e.target.value) }))
                            }}
                            placeholder="Full name"
                          />
                          {addErrors.name ? <p className="text-[10px] text-destructive">{addErrors.name}</p> : null}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px]">Email</Label>
                          <Input
                            type="email"
                            value={newContact.email}
                            error={!!addErrors.email}
                            onChange={(e) => {
                              setAddErrors((p) => ({ ...p, email: undefined }))
                              setNewContact((p) => ({ ...p, email: e.target.value }))
                            }}
                            placeholder="name@company.com"
                          />
                          {addErrors.email ? <p className="text-[10px] text-destructive">{addErrors.email}</p> : null}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label className="text-[10px]">Phone (digits)</Label>
                            <Input
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={newContact.phone}
                              error={!!addErrors.phone}
                              onChange={(e) => {
                                setAddErrors((p) => ({ ...p, phone: undefined }))
                                setNewContact((p) => ({ ...p, phone: normalizePhoneDigits(e.target.value) }))
                              }}
                              placeholder="14155550100"
                            />
                            {addErrors.phone ? <p className="text-[10px] text-destructive">{addErrors.phone}</p> : null}
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px]">Time zone</Label>
                            <AdvancedDropdown
                              options={TIMEZONE_OPTIONS}
                              value={newContact.timezone}
                              onChange={(v) => setNewContact((p) => ({ ...p, timezone: v ?? 'UTC' }))}
                              placeholder="Select time zone"
                              searchPlaceholder="Search time zones…"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 bg-muted/20 shadow-none">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Organization</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="space-y-1.5">
                          <Label className="text-[10px]">Company</Label>
                          <Input
                            value={newContact.company}
                            onChange={(e) => setNewContact((p) => ({ ...p, company: e.target.value }))}
                            placeholder="Company name"
                          />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label className="text-[10px]">Role</Label>
                            <Input
                              value={newContact.role}
                              onChange={(e) => setNewContact((p) => ({ ...p, role: e.target.value }))}
                              placeholder="Job title"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px]">Country / region</Label>
                            <Input
                              value={newContact.country}
                              onChange={(e) => setNewContact((p) => ({ ...p, country: e.target.value }))}
                              placeholder="Country"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 bg-muted/20 shadow-none">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Links & notes</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="space-y-1.5">
                          <Label className="text-[10px]">LinkedIn URL</Label>
                          <Input
                            value={newContact.linkedInUrl}
                            error={!!addErrors.linkedin}
                            onChange={(e) => {
                              setAddErrors((p) => ({ ...p, linkedin: undefined }))
                              setNewContact((p) => ({ ...p, linkedInUrl: e.target.value }))
                            }}
                            placeholder="https://linkedin.com/in/…"
                          />
                          {addErrors.linkedin ? <p className="text-[10px] text-destructive">{addErrors.linkedin}</p> : null}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px]">Notes</Label>
                          <AutoGrowTextarea
                            value={newContact.notes}
                            onChange={(e) => setNewContact((p) => ({ ...p, notes: e.target.value }))}
                            rows={3}
                            placeholder="Context, preferences, or next steps"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 bg-muted/20 shadow-none">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Tags</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-1.5">
                          {allTags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() =>
                                setNewContact((p) => ({
                                  ...p,
                                  tags: p.tags.includes(tag) ? p.tags.filter((t) => t !== tag) : [...p.tags, tag],
                                }))
                              }
                              className={`rounded-full px-2 py-1 text-[10px] transition-colors ${
                                newContact.tags.includes(tag)
                                  ? tagColors[tag] || 'bg-secondary text-secondary-foreground'
                                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-surface-1/90 px-4 py-3 sm:flex-row sm:justify-end">
                  <Button variant="secondary" type="button" onClick={() => setAddOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleAddContact} className="w-full sm:w-auto">
                    Add contact
                  </Button>
                </div>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        <Popover.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              className={`${CONTACTS_FILTER_ICON_BTN} ${hasActiveFilters ? 'text-citrus-orange' : 'text-muted-foreground'}`}
              aria-label="Filters"
            >
              <Filter className="h-4 w-4 shrink-0" aria-hidden />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content side="bottom" align="end" sideOffset={10} collisionPadding={20} className={filtersPanelClass}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Filters</p>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className={`${HEADER_ICON_BTN} text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground`}
                    aria-label="Clear filters"
                  >
                    <X className="h-4 w-4 shrink-0" />
                  </button>
                ) : null}
              </div>
              <div className="flex flex-col gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Tags{filterTags.size ? ` · ${filterTags.size}` : ''}
                  </Label>
                  <div className="max-h-36 space-y-1.5 overflow-y-auto rounded-lg border border-border/70 bg-surface-1/40 px-2 py-2">
                    {allTags.map((t) => (
                      <label key={t} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-0.5 text-xs hover:bg-secondary/50">
                        <Checkbox checked={filterTags.has(t)} onCheckedChange={() => toggleFilterTag(t)} />
                        <span>{t}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Company</Label>
                  <div className="max-h-32 overflow-y-auto rounded-lg border border-border/70 bg-surface-1/40 p-1">
                    <button
                      type="button"
                      className={`flex w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-secondary ${
                        !filterCompany ? 'bg-secondary/60 font-medium' : ''
                      }`}
                      onClick={() => setFilterCompany('')}
                    >
                      Any company
                    </button>
                    {allCompanies.map((co) => (
                      <button
                        key={co}
                        type="button"
                        className={`flex w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-secondary ${
                          filterCompany === co ? 'bg-citrus-orange/15 font-medium text-foreground' : ''
                        }`}
                        onClick={() => setFilterCompany(co)}
                      >
                        {co}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Role</Label>
                  <div className="max-h-32 overflow-y-auto rounded-lg border border-border/70 bg-surface-1/40 p-1">
                    <button
                      type="button"
                      className={`flex w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-secondary ${
                        !filterRole ? 'bg-secondary/60 font-medium' : ''
                      }`}
                      onClick={() => setFilterRole('')}
                    >
                      Any role
                    </button>
                    {allRoles.map((role) => (
                      <button
                        key={role}
                        type="button"
                        className={`flex w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-secondary ${
                          filterRole === role ? 'bg-citrus-orange/15 font-medium text-foreground' : ''
                        }`}
                        onClick={() => setFilterRole(role)}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Starred</Label>
                  <button
                    type="button"
                    onClick={() => setStarredOnly((s) => !s)}
                    className={`${HEADER_ICON_BTN} border transition-colors ${
                      starredOnly
                        ? 'border-citrus-lemon/50 bg-citrus-lemon/10 text-citrus-lemon'
                        : 'border-border bg-surface-1 text-muted-foreground hover:bg-secondary/40'
                    }`}
                    aria-label={starredOnly ? 'Show all contacts' : 'Starred only'}
                    aria-pressed={starredOnly}
                  >
                    <Star className={`h-4 w-4 shrink-0 ${starredOnly ? 'fill-citrus-lemon' : ''}`} />
                  </button>
                </div>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>

      <div className={`min-h-0 flex-1 overflow-y-auto hide-scrollbar ${hPad} py-3 md:py-4`}>
        <div className="glass rounded-xl overflow-hidden">
          <div className="grid grid-cols-[40px_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-3 px-5 py-3 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider">
            <span />
            <span>Name</span>
            <span>Email</span>
            <span>Company</span>
            <span>Role</span>
            <span>Tags</span>
          </div>
          {filtered.map((c) => (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              onClick={() => openDetail(c)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openDetail(c)
                }
              }}
              className="grid grid-cols-[40px_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-3 px-5 py-3 border-b border-border/50 hover:bg-secondary/30 transition-colors items-center cursor-pointer text-left"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleStar(c.id)
                }}
                className="w-5 h-5 flex items-center justify-center"
                aria-label={c.starred ? 'Remove from starred' : 'Add to starred'}
              >
                <Star
                  className={`w-3.5 h-3.5 ${c.starred ? 'text-citrus-lemon fill-citrus-lemon' : 'text-muted-foreground/30 hover:text-citrus-lemon/70'}`}
                />
              </button>
              <span className="text-sm font-medium text-foreground truncate">{c.name}</span>
              <span className="text-xs text-muted-foreground truncate">{c.email}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 min-w-0">
                <Building2 className="w-3 h-3 shrink-0" />
                <span className="truncate">{c.company}</span>
              </span>
              <span className="text-xs text-muted-foreground truncate">{c.role}</span>
              <div className="flex flex-wrap gap-1">
                {c.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${tagColors[tag] || 'bg-secondary text-secondary-foreground'}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={detailOpen} onOpenChange={closeDetail}>
        <DialogContent showCloseButton={false} className={dialogShellClass}>
          {draft ? (
            <>
              <DialogHeader className="shrink-0 space-y-0 border-0 bg-gradient-to-br from-citrus-orange/[0.08] via-muted/25 to-background px-5 pb-3 pt-4 text-left sm:px-6 sm:pb-3 sm:pt-4">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-citrus-orange/25 to-citrus-orange/8 text-sm font-bold tracking-tight text-citrus-orange shadow-md sm:h-[3.25rem] sm:w-[3.25rem] sm:rounded-2xl sm:text-base">
                    {initialsFromName(draft.name)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <DialogTitle className="text-left text-lg font-semibold leading-tight tracking-tight text-foreground sm:text-xl">
                        {draft.name || 'Contact'}
                      </DialogTitle>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          detailEditing
                            ? 'bg-accent/15 text-accent'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {detailEditing ? 'Editing' : 'View'}
                      </span>
                    </div>
                    <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground">
                      {detailEditing ? 'Edit fields below, then save.' : 'View profile and details.'}
                    </DialogDescription>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {!detailEditing ? (
                      <button
                        type="button"
                        className={MARKETING_PRIMARY_ICON_BTN}
                        aria-label="Edit contact"
                        onClick={() => setDetailEditing(true)}
                      >
                        <Pencil className="h-4 w-4 shrink-0" aria-hidden />
                      </button>
                    ) : null}
                    <button type="button" className={CONTACT_DETAIL_CLOSE_BTN} aria-label="Close" onClick={() => closeDetail(false)}>
                      <X className="h-4 w-4 shrink-0" aria-hidden />
                    </button>
                  </div>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-xl bg-muted/30 px-3 py-2 sm:px-3.5">
                  <button
                    type="button"
                    onClick={() => toggleStar(draft.id)}
                    className={`${HEADER_ICON_BTN} bg-muted/50 text-muted-foreground transition-colors hover:bg-citrus-lemon/10 hover:text-citrus-lemon`}
                    aria-label={draft.starred ? 'Remove star' : 'Add star'}
                  >
                    <Star className={`h-4 w-4 shrink-0 ${draft.starred ? 'fill-citrus-lemon text-citrus-lemon' : ''}`} />
                  </button>
                  {draft.tags.length > 0 ? (
                    <span className="hidden h-4 w-px shrink-0 bg-stone-300/70 dark:bg-stone-600/70 sm:block" aria-hidden />
                  ) : null}
                  {draft.tags.map((t) => (
                    <span
                      key={t}
                      className={`text-[10px] font-medium shadow-sm px-2.5 py-1 rounded-full ${tagColors[t] || 'bg-secondary text-secondary-foreground'}`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </DialogHeader>

              <div className={dialogBodyClass}>
                {!detailEditing ? (
                  <div className="rounded-2xl bg-muted/25 p-3 shadow-sm sm:p-4 dark:bg-muted/20">
                    <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                      <ReadField label="Email" value={draft.email} />
                      <ReadField label="Phone" value={draft.phone} />
                      <ReadField label="Time zone" value={TIMEZONE_OPTIONS.find((o) => o.value === draft.timezone)?.label ?? draft.timezone} />
                      <ReadField label="Company" value={draft.company} />
                      <ReadField label="Role" value={draft.role} />
                      <ReadField label="Country" value={draft.country} />
                      <div className="sm:col-span-2">
                        <ReadField label="LinkedIn" value={draft.linkedInUrl} />
                      </div>
                      <div className="sm:col-span-2">
                        <ReadField label="Notes" value={draft.notes} />
                      </div>
                    </div>
                  </div>
                ) : (
                <div className="space-y-3 sm:space-y-4">
                  <Card className="overflow-hidden rounded-2xl border-0 bg-card/95 shadow-md">
                    <CardHeader className="border-0 bg-muted/30 px-4 pb-2 pt-3 sm:px-5 sm:pb-2.5 sm:pt-3.5">
                      <CardTitle className="text-[11px] font-bold uppercase tracking-[0.1em] text-foreground/90">Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 px-4 pb-4 pt-3 sm:px-5 sm:pb-4 sm:pt-3.5">
                      <div className="space-y-1.5">
                        <Label className="text-[10px]">Name</Label>
                        <Input
                          value={draft.name}
                          error={!!draftErrors.name}
                          onChange={(e) => {
                            setDraftErrors((p) => ({ ...p, name: undefined }))
                            setDraft({ ...draft, name: stripDigitsFromName(e.target.value) })
                          }}
                        />
                        {draftErrors.name ? <p className="text-[10px] text-destructive">{draftErrors.name}</p> : null}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px]">Email</Label>
                        <Input
                          type="email"
                          value={draft.email}
                          error={!!draftErrors.email}
                          onChange={(e) => {
                            setDraftErrors((p) => ({ ...p, email: undefined }))
                            setDraft({ ...draft, email: e.target.value })
                          }}
                        />
                        {draftErrors.email ? <p className="text-[10px] text-destructive">{draftErrors.email}</p> : null}
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-[10px]">Phone (digits)</Label>
                          <Input
                            inputMode="numeric"
                            value={draft.phone}
                            error={!!draftErrors.phone}
                            onChange={(e) => {
                              setDraftErrors((p) => ({ ...p, phone: undefined }))
                              setDraft({ ...draft, phone: normalizePhoneDigits(e.target.value) })
                            }}
                          />
                          {draftErrors.phone ? <p className="text-[10px] text-destructive">{draftErrors.phone}</p> : null}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px]">Time zone</Label>
                          <AdvancedDropdown
                            options={TIMEZONE_OPTIONS}
                            value={draft.timezone}
                            onChange={(v) => setDraft({ ...draft, timezone: v ?? draft.timezone })}
                            placeholder="Time zone"
                            searchPlaceholder="Search time zones…"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden rounded-2xl border-0 bg-card/95 shadow-md">
                    <CardHeader className="border-0 bg-muted/30 px-4 pb-2 pt-3 sm:px-5 sm:pb-2.5 sm:pt-3.5">
                      <CardTitle className="text-[11px] font-bold uppercase tracking-[0.1em] text-foreground/90">Organization</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 px-4 pb-4 pt-3 sm:px-5 sm:pb-4 sm:pt-3.5">
                      <div className="space-y-1.5">
                        <Label className="text-[10px]">Company</Label>
                        <Input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-[10px]">Role</Label>
                          <Input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px]">Country / region</Label>
                          <Input value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden rounded-2xl border-0 bg-card/95 shadow-md">
                    <CardHeader className="border-0 bg-muted/30 px-4 pb-2 pt-3 sm:px-5 sm:pb-2.5 sm:pt-3.5">
                      <CardTitle className="text-[11px] font-bold uppercase tracking-[0.1em] text-foreground/90">Links & notes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 px-4 pb-4 pt-3 sm:px-5 sm:pb-4 sm:pt-3.5">
                      <div className="space-y-1.5">
                        <Label className="text-[10px]">LinkedIn URL</Label>
                        <Input
                          value={draft.linkedInUrl}
                          error={!!draftErrors.linkedin}
                          onChange={(e) => {
                            setDraftErrors((p) => ({ ...p, linkedin: undefined }))
                            setDraft({ ...draft, linkedInUrl: e.target.value })
                          }}
                        />
                        {draftErrors.linkedin ? <p className="text-[10px] text-destructive">{draftErrors.linkedin}</p> : null}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px]">Notes</Label>
                        <AutoGrowTextarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} rows={4} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden rounded-2xl border-0 bg-card/95 shadow-md">
                    <CardHeader className="border-0 bg-muted/30 px-4 pb-2 pt-3 sm:px-5 sm:pb-2.5 sm:pt-3.5">
                      <CardTitle className="text-[11px] font-bold uppercase tracking-[0.1em] text-foreground/90">Tags</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-3 sm:px-5 sm:pb-4 sm:pt-3.5">
                      <div className="flex flex-wrap gap-2">
                        {allTags.map((tag) => {
                          const on = draft.tags.includes(tag)
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() =>
                                setDraft({
                                  ...draft,
                                  tags: on ? draft.tags.filter((t) => t !== tag) : [...draft.tags, tag],
                                })
                              }
                              className={`text-[10px] font-medium px-2.5 py-1.5 rounded-full shadow-sm transition-colors ${
                                on ? tagColors[tag] || 'bg-secondary text-secondary-foreground' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                              }`}
                            >
                              {tag}
                            </button>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                )}
              </div>

              <DialogFooter className={`${dialogFooterClass} flex-col gap-2 sm:flex-row sm:justify-end`}>
                {detailEditing ? (
                  <>
                    <Button variant="secondary" type="button" onClick={cancelDetailEdit} className="w-full sm:w-auto">
                      Cancel
                    </Button>
                    <Button type="button" onClick={saveDetail} className="w-full sm:w-auto">
                      Save changes
                    </Button>
                  </>
                ) : (
                  <Button variant="secondary" type="button" onClick={() => closeDetail(false)} className="w-full sm:w-auto">
                    Close
                  </Button>
                )}
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
