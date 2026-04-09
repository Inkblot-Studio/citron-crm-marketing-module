# Citron CRM — Marketing Module

Standalone **Marketing** module (campaigns, **Contacts**, templates, compose) extracted from the Citron CRM monorepo. Served as a **remote** via Module Federation and exposes `MarketingWithProvider` for consumption by a host (e.g. the main CRM app). Contacts UI is bundled here so it can be removed from the host CRM after deploy.

## Requirements

- Node.js 18+
- npm 9+

## Installation

```bash
npm install
```

## Running

### Standalone development

To develop and test the module in isolation (without a host):

```bash
npm run dev
```

The app will be available at `http://localhost:5173`. It uses `ToastProvider` and a catch-all route that renders `MarketingPage` directly.

### Build preview (simulates production)

To serve the built assets, including `remoteEntry.js`:

```bash
npm run build
npm run preview
```

The remote is served at `http://localhost:5001`. This is the URL the host will use to load the module.

## Exposing the Module to the Host

### What this remote exposes

| Entry         | Content                                                          |
|---------------|------------------------------------------------------------------|
| `./Marketing` | `MarketingWithProvider` (MarketingPage wrapped with ToastProvider + Toaster) |

### Remote entry URL

After `npm run build` and `npm run preview`, the host must point to:

```
http://localhost:5001/assets/remoteEntry.js
```

For production, replace with the URL where the module is deployed (e.g. `https://marketing.yourapp.com/assets/remoteEntry.js`).

### Host configuration (Vite)

The host must use `@originjs/vite-plugin-federation` and declare this module as a remote:

```ts
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'host',
      remotes: {
        marketing: 'http://localhost:5001/assets/remoteEntry.js',
      },
      shared: ['react', 'react-dom', 'react-router-dom'],
    }),
  ],
})
```

### Consuming MarketingPage in the Host

```tsx
import { lazy, Suspense } from 'react'

const MarketingPage = lazy(() => import('marketing/Marketing'))

function App() {
  return (
    <Suspense fallback={<div>Loading marketing...</div>}>
      <MarketingPage />
    </Suspense>
  )
}
```

### Host routes

In the host, register a route that renders `MarketingPage`, for example:

```tsx
<Route path="/campaigns" element={<MarketingPage />} />
```

## Shared dependencies

The remote shares with the host:

- `react`
- `react-dom`
- `react-router-dom`

Ensure the host has compatible versions and declares them in `shared`. `@citron-systems/citron-ui` and `@citron-systems/citron-ds` must be available in the host if you want to avoid duplication.

## Project structure

```
citron-crm-marketing-module/
├── src/
│   ├── marketing/
│   │   ├── MarketingPage.tsx        # Tabs: Campaigns, Contacts, Templates, Compose
│   │   ├── ContactsPage.tsx         # Contacts (from CRM; optional embedded layout)
│   │   └── MarketingWithProvider.tsx # Wrapped export (ToastProvider + Toaster)
│   ├── lib/
│   │   └── ToastContext.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts
├── package.json
└── README.md
```

## Production build

```bash
npm run build
```

Output in `dist/`:

- `index.html` — Standalone app
- `assets/remoteEntry.js` — Remote entry point
- `assets/__federation_expose_Marketing-*.js` — MarketingPage code
- CSS and additional chunks

For production, deploy the contents of `dist/` to a CDN or static server and use the base URL as the `remote` in the host.

## Load flow (Module Federation)

```
┌─────────────────────────────────────────────────────────────┐
│ Host (main CRM)                                             │
│                                                              │
│  import('marketing/Marketing')  ──►  Loads remoteEntry.js   │
│         │                                    │               │
│         │                                    ▼               │
│         │                    http://localhost:5001/assets/   │
│         │                    remoteEntry.js                  │
└─────────│────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ Remote (this module)                                        │
│                                                              │
│  remoteEntry.js  exposes  ./Marketing  ──►  MarketingWithProvider │
│  (includes ToastProvider, Toaster, ToastContext)                 │
└─────────────────────────────────────────────────────────────┘
```

## Notes

- **ToastProvider**: The remote exports `MarketingWithProvider`, which bundles its own `ToastProvider`, `Toaster`, and `ToastContext`. The host needs no additional setup.
- **Design system**: Styles depend on `@citron-systems/citron-ds`. Ensure the host imports its CSS (`import '@citron-systems/citron-ds/css'`).
- **Port**: Preview uses port 5001. In dev (`npm run dev`), Vite uses 5173 by default.

## Removing Contacts from the host CRM

After this marketing remote is deployed and the host loads it on `/campaigns` (or your chosen route), you can remove the duplicate Contacts module from **citron-crm**:

1. Remove the `/contacts` route (lazy import of `ContactsPage`) and any `Route` that renders it.
2. Remove the sidebar item (nav item) pointing to Contacts.
3. Delete `src/pages/ContactsPage.tsx` from the CRM if it is no longer referenced elsewhere.
4. Remove unused imports (e.g. `Users` icon) from `App.tsx` or navigation config.

Keep the marketing remote URL in the host federation `remotes` configuration so the unified Marketing experience (including Contacts tab) remains available.
