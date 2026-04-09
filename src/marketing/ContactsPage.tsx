import { CircularScore, Button, Input, Select, Label } from '@citron-systems/citron-ui'
import * as Popover from '@radix-ui/react-popover'
import { Search, Filter, Plus, Building2, Star } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/lib/ToastContext'

interface Contact {
  id: string
  name: string
  company: string
  role: string
  score: number
  tags: string[]
  lastActivity: string
  starred: boolean
}

const initialContacts: Contact[] = [
  { id: '1', name: 'Sarah Chen', company: 'Acme Corp', role: 'VP of Engineering', score: 92, tags: ['Champion', 'Decision Maker'], lastActivity: '2h ago', starred: true },
  { id: '2', name: 'Marcus Johnson', company: 'TechVentures', role: 'CTO', score: 78, tags: ['Technical Buyer'], lastActivity: '1d ago', starred: false },
  { id: '3', name: 'Elena Rodriguez', company: 'GlobalTech Inc', role: 'Head of Product', score: 45, tags: ['At Risk'], lastActivity: '12d ago', starred: false },
  { id: '4', name: 'David Park', company: 'DataFlow Labs', role: 'CEO', score: 67, tags: ['Executive Sponsor'], lastActivity: '3h ago', starred: true },
  { id: '5', name: 'Lisa Wang', company: 'StartupXYZ', role: 'COO', score: 88, tags: ['Champion', 'Budget Holder'], lastActivity: '5h ago', starred: false },
  { id: '6', name: 'James Miller', company: 'Acme Corp', role: 'Engineering Manager', score: 71, tags: ['End User'], lastActivity: '6h ago', starred: false },
  { id: '7', name: 'Anna Fischer', company: 'GlobalTech Inc', role: 'CFO', score: 34, tags: ['At Risk', 'Budget Holder'], lastActivity: '21d ago', starred: false },
  { id: '8', name: 'Tom Nakamura', company: 'TechVentures', role: 'VP Sales', score: 83, tags: ['Decision Maker'], lastActivity: '8h ago', starred: true },
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
const allCompanies = [...new Set(initialContacts.map((c) => c.company))]

type ContactsPageProps = { embedded?: boolean }

export default function ContactsPage({ embedded = false }: ContactsPageProps) {
  const hPad = embedded ? 'px-0' : 'px-8'
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterTag, setFilterTag] = useState<string>('')
  const [filterCompany, setFilterCompany] = useState<string>('')
  const [newContact, setNewContact] = useState({ name: '', company: '', role: '', tags: [] as string[] })
  const { addToast } = useToast()

  const filtered = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase())
    const matchesTag = !filterTag || c.tags.includes(filterTag)
    const matchesCompany = !filterCompany || c.company === filterCompany
    return matchesSearch && matchesTag && matchesCompany
  })

  const toggleStar = (id: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, starred: !c.starred } : c))
    )
  }

  const handleAddContact = () => {
    if (!newContact.name.trim()) return
    const contact: Contact = {
      id: crypto.randomUUID(),
      name: newContact.name.trim(),
      company: newContact.company.trim() || 'New Company',
      role: newContact.role.trim() || 'Contact',
      score: Math.floor(Math.random() * 40) + 50,
      tags: newContact.tags.length ? newContact.tags : ['End User'],
      lastActivity: 'Just now',
      starred: false,
    }
    setContacts((prev) => [contact, ...prev])
    setNewContact({ name: '', company: '', role: '', tags: [] })
    setAddOpen(false)
    addToast({ title: 'Contact added', variant: 'success' })
  }

  const clearFilters = () => {
    setFilterTag('')
    setFilterCompany('')
  }

  const getScoreColor = (score: number) =>
    score >= 70
      ? 'var(--inkblot-semantic-color-status-success)'
      : score >= 50
        ? 'var(--inkblot-semantic-color-status-warning)'
        : 'var(--inkblot-color-accent-citron-600)'

  const dropdownPanel = 'mt-2 p-4 glass rounded-xl border border-border shadow-lg z-50'

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
        <Popover.Root open={addOpen} onOpenChange={setAddOpen}>
          <Popover.Trigger className="flex shrink-0 items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-3 h-3" />
            Add Contact
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content side="bottom" align="end" sideOffset={8} collisionPadding={16} className={`w-80 ${dropdownPanel}`}>
            <p className="text-xs font-medium text-foreground mb-3">Add Contact</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[10px]">Name</Label>
                <Input
                  value={newContact.name}
                  onChange={(e) => setNewContact((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px]">Company</Label>
                <Input
                  value={newContact.company}
                  onChange={(e) => setNewContact((p) => ({ ...p, company: e.target.value }))}
                  placeholder="Company name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px]">Role</Label>
                <Input
                  value={newContact.role}
                  onChange={(e) => setNewContact((p) => ({ ...p, role: e.target.value }))}
                  placeholder="Job title"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px]">Tags</Label>
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
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-border">
              <Button variant="secondary" onClick={() => setAddOpen(false)} className="flex-1 text-xs">
                Cancel
              </Button>
              <Button onClick={handleAddContact} disabled={!newContact.name.trim()} className="flex-1 text-xs">
                Add Contact
              </Button>
            </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        <Popover.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
          <Popover.Trigger
            className={`flex shrink-0 items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs transition-colors ${
              filterTag || filterCompany
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/30'
            }`}
          >
            <Filter className="w-3 h-3" />
            Filters
            {(filterTag || filterCompany) && (
              <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content side="left" align="end" sideOffset={8} collisionPadding={16} className={`w-64 ${dropdownPanel}`}>
            <p className="text-xs font-medium text-foreground mb-3">Filter Contacts</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[10px]">Tag</Label>
                <Select
                  options={[{ value: '', label: 'All tags' }, ...allTags.map((t) => ({ value: t, label: t }))]}
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px]">Company</Label>
                <Select
                  options={[{ value: '', label: 'All companies' }, ...allCompanies.map((c) => ({ value: c, label: c }))]}
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border">
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
          <div className="grid grid-cols-[40px_1fr_140px_120px_1fr_80px] gap-4 px-5 py-3 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider">
            <span />
            <span>Name</span>
            <span>Company</span>
            <span>Role</span>
            <span>Tags</span>
            <span>Score</span>
          </div>
          {filtered.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[40px_1fr_140px_120px_1fr_80px] gap-4 px-5 py-3 border-b border-border/50 hover:bg-secondary/30 transition-colors items-center"
            >
              <button
                onClick={() => toggleStar(c.id)}
                className="w-5 h-5 flex items-center justify-center"
                aria-label={c.starred ? 'Remove from starred' : 'Add to starred'}
              >
                <Star
                  className={`w-3.5 h-3.5 ${c.starred ? 'text-citrus-lemon fill-citrus-lemon' : 'text-muted-foreground/30 hover:text-citrus-lemon/70'}`}
                />
              </button>
              <div>
                <span className="text-sm font-medium text-foreground">{c.name}</span>
                <span className="text-[10px] text-muted-foreground ml-2">{c.lastActivity}</span>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Building2 className="w-3 h-3" />
                {c.company}
              </span>
              <span className="text-xs text-muted-foreground">{c.role}</span>
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
              <CircularScore label="" value={c.score} color={getScoreColor(c.score)} size={32} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
