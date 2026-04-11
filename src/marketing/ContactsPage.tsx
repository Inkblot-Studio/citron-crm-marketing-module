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
  Textarea,
  Switch,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@citron-systems/citron-ui'
import * as Popover from '@radix-ui/react-popover'
import { Search, Filter, Plus, Building2, Star } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useToast } from '@/lib/ToastContext'
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
const allCompanies = [...new Set(initialContacts.map((c) => c.company))].sort()

type ContactsPageProps = { embedded?: boolean }

type FieldErrors = Partial<Record<'name' | 'email' | 'phone' | 'linkedin', string>>

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

export default function ContactsPage({ embedded = false }: ContactsPageProps) {
  const hPad = embedded ? 'px-0' : 'px-8'
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterTag, setFilterTag] = useState<string>('')
  const [filterCompanyQuery, setFilterCompanyQuery] = useState('')
  const [filterRoleQuery, setFilterRoleQuery] = useState('')
  const [starredOnly, setStarredOnly] = useState(false)
  const [newContact, setNewContact] = useState(emptyNewContact)
  const [addErrors, setAddErrors] = useState<FieldErrors>({})
  const [detailOpen, setDetailOpen] = useState(false)
  const [draft, setDraft] = useState<Contact | null>(null)
  const [draftErrors, setDraftErrors] = useState<FieldErrors>({})
  const { addToast } = useToast()

  const openAdd = () => {
    setNewContact(emptyNewContact())
    setAddErrors({})
    setAddOpen(true)
  }

  const openDetail = (c: Contact) => {
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
    setDetailOpen(false)
    setDraft(null)
    setDraftErrors({})
  }

  const companySuggestions = useMemo(() => {
    const q = filterCompanyQuery.trim().toLowerCase()
    return allCompanies.filter((c) => !q || c.toLowerCase().includes(q))
  }, [filterCompanyQuery])

  const filtered = contacts.filter((c) => {
    const matchesSearch =
      !search.trim() ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase()) ||
      normalizePhoneDigits(c.phone).includes(normalizePhoneDigits(search))
    const matchesTag = !filterTag || c.tags.includes(filterTag)
    const matchesCompany =
      !filterCompanyQuery.trim() || c.company.toLowerCase().includes(filterCompanyQuery.trim().toLowerCase())
    const matchesRole =
      !filterRoleQuery.trim() || c.role.toLowerCase().includes(filterRoleQuery.trim().toLowerCase())
    const matchesStarred = !starredOnly || c.starred
    return matchesSearch && matchesTag && matchesCompany && matchesRole && matchesStarred
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
    setFilterTag('')
    setFilterCompanyQuery('')
    setFilterRoleQuery('')
    setStarredOnly(false)
  }

  const filtersPanelClass =
    'mt-2 w-[min(100vw-1.5rem,22rem)] p-6 sm:p-7 glass rounded-xl border border-border shadow-lg z-[100] max-h-[min(85vh,560px)] overflow-y-auto'

  const hasActiveFilters = !!(filterTag || filterCompanyQuery.trim() || filterRoleQuery.trim() || starredOnly)

  const dialogShellClass =
    'flex max-h-[min(92dvh,760px)] w-[calc(100vw-1.25rem)] max-w-xl flex-col gap-0 overflow-hidden border-border p-0 sm:max-w-xl'

  const dialogBodyClass = 'min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8'

  const dialogFooterClass = 'shrink-0 border-t border-border bg-surface-1/90 px-6 py-4 sm:px-8 backdrop-blur-sm'

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className={`${hPad} py-3 border-b border-border flex flex-wrap items-center gap-3`}>
        <div className="relative flex-1 min-w-[min(100%,12rem)] max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-1 border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Search contacts..."
          />
        </div>
        <Button type="button" onClick={openAdd} className="h-10 w-10 shrink-0 rounded-lg p-0" aria-label="Add contact">
          <Plus className="h-6 w-6" />
        </Button>
        <Popover.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
          <Popover.Trigger
            className={`flex shrink-0 items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs transition-colors ${
              hasActiveFilters
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/30'
            }`}
          >
            <Filter className="w-3 h-3" />
            Filters
            {hasActiveFilters ? <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-primary" /> : null}
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content side="bottom" align="end" sideOffset={10} collisionPadding={20} className={filtersPanelClass}>
              <p className="text-xs font-medium text-foreground mb-4">Filter contacts</p>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px]">Tag</Label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFilterTag('')}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                        !filterTag ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      All tags
                    </button>
                    {allTags.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFilterTag(t)}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                          filterTag === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px]">Company contains</Label>
                  <Input value={filterCompanyQuery} onChange={(e) => setFilterCompanyQuery(e.target.value)} placeholder="Type to filter companies" />
                  {filterCompanyQuery.trim() ? (
                    <p className="text-[10px] text-muted-foreground">
                      {companySuggestions.length} known {companySuggestions.length === 1 ? 'match' : 'matches'} in directory
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px]">Role contains</Label>
                  <Input value={filterRoleQuery} onChange={(e) => setFilterRoleQuery(e.target.value)} placeholder="e.g. VP, CFO, Sales" />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-1/50 px-4 py-3">
                  <div>
                    <p className="text-xs font-medium text-foreground">Starred only</p>
                    <p className="text-[10px] text-muted-foreground">Show contacts you marked</p>
                  </div>
                  <Switch checked={starredOnly} onCheckedChange={setStarredOnly} />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-border">
                <Button variant="secondary" onClick={clearFilters} className="w-full text-xs">
                  Clear filters
                </Button>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>

      <div className={`flex-1 overflow-y-auto hide-scrollbar ${hPad} py-6 min-h-0`}>
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent showCloseButton className={dialogShellClass}>
          <DialogHeader className="shrink-0 space-y-1 px-6 pb-2 pt-6 text-left sm:px-8 sm:pt-8">
            <DialogTitle>Add contact</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Required fields are validated. Phone accepts digits only.
            </DialogDescription>
          </DialogHeader>
          <div className={dialogBodyClass}>
            <div className="space-y-6">
              <Card className="border-border/70 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground">Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
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
                  <div className="grid gap-4 sm:grid-cols-2">
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

              <Card className="border-border/70 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground">Organization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="space-y-1.5">
                    <Label className="text-[10px]">Company</Label>
                    <Input
                      value={newContact.company}
                      onChange={(e) => setNewContact((p) => ({ ...p, company: e.target.value }))}
                      placeholder="Company name"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
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

              <Card className="border-border/70 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground">Links & notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
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
                    <Textarea
                      value={newContact.notes}
                      onChange={(e) => setNewContact((p) => ({ ...p, notes: e.target.value }))}
                      rows={3}
                      resize="vertical"
                      placeholder="Context, preferences, or next steps"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-none">
                <CardHeader className="pb-3">
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
                        className={`text-[10px] px-2 py-1 rounded-full transition-colors ${
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
          <DialogFooter className={`${dialogFooterClass} flex-col gap-2 sm:flex-row sm:justify-end`}>
            <Button variant="secondary" type="button" onClick={() => setAddOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="button" onClick={handleAddContact} className="w-full sm:w-auto">
              Add contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={closeDetail}>
        <DialogContent showCloseButton className={dialogShellClass}>
          {draft ? (
            <>
              <DialogHeader className="shrink-0 space-y-3 px-6 pb-2 pt-6 text-left sm:px-8 sm:pt-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                    {initialsFromName(draft.name)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <DialogTitle className="text-lg font-semibold leading-tight">Edit contact</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Update profile, organization, and tags. Changes apply when you save.
                    </DialogDescription>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => toggleStar(draft.id)}
                  >
                    <Star className={`h-3.5 w-3.5 ${draft.starred ? 'fill-citrus-lemon text-citrus-lemon' : ''}`} />
                    {draft.starred ? 'Starred' : 'Mark starred'}
                  </Button>
                  {draft.tags.slice(0, 3).map((t) => (
                    <Badge key={t} variant="outline" className="text-[10px] font-normal">
                      {t}
                    </Badge>
                  ))}
                  {draft.tags.length > 3 ? (
                    <span className="text-[10px] text-muted-foreground">+{draft.tags.length - 3}</span>
                  ) : null}
                </div>
              </DialogHeader>

              <div className={dialogBodyClass}>
                <div className="space-y-6">
                  <Card className="border-border/70 shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xs font-medium text-muted-foreground">Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0">
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
                            clearable
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/70 shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xs font-medium text-muted-foreground">Organization</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0">
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

                  <Card className="border-border/70 shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xs font-medium text-muted-foreground">Links & notes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0">
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
                        <Textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} rows={4} resize="vertical" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/70 shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xs font-medium text-muted-foreground">Tags</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-1.5">
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
                              className={`text-[10px] px-2 py-1 rounded-full transition-colors ${
                                on ? tagColors[tag] || 'bg-secondary text-secondary-foreground' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
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
              </div>

              <DialogFooter className={`${dialogFooterClass} flex-col gap-2 sm:flex-row sm:justify-end`}>
                <Button variant="secondary" type="button" onClick={() => closeDetail(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="button" onClick={saveDetail} className="w-full sm:w-auto">
                  Save changes
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
