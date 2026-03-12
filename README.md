# Citron CRM — Marketing Module

Standalone email campaigns module extracted from the Citron CRM monorepo. Served as a **remote** via Module Federation and exposes the `MarketingPage` component for consumption by a host (e.g. the main CRM app).

## Requirements

- Node.js 18+
- npm 9+

## Installation

```bash
cd frontend
npm install
```

## Running

### Standalone development

To develop and test the module in isolation (without a host):

```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173`. It uses `ToastProvider` and a catch-all route that renders `MarketingPage` directly.

### Build preview (simulates production)

To serve the built assets, including `remoteEntry.js`:

```bash
cd frontend
npm run build
npm run preview
```

The remote is served at `http://localhost:5001`. This is the URL the host will use to load the module.

## Exposing the Module to the Host

### What this remote exposes

| Entry         | Content                                   |
|---------------|-------------------------------------------|
| `./Marketing` | `MarketingPage` component (default export) |

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
├── frontend/
│   ├── src/
│   │   ├── marketing/
│   │   │   └── MarketingPage.tsx    # Main page (exported as ./Marketing)
│   │   ├── lib/
│   │   │   └── ToastContext.tsx     # Toast context
│   │   ├── App.tsx                  # Shell for standalone development
│   │   ├── main.tsx                 # Entry point
│   │   └── index.css                # Styles (Tailwind + citron-ds)
│   ├── index.html
│   ├── vite.config.ts               # Module Federation config
│   └── package.json
├── backend/                         # Placeholder for future API
│   └── package.json
└── README.md
```

## Production build

```bash
cd frontend
npm run build
```

Output in `frontend/dist/`:

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
│  remoteEntry.js  exposes  ./Marketing  ──►  MarketingPage    │
│                                                              │
│  Dependencies: ToastContext, citron-ui, citron-ds           │
└─────────────────────────────────────────────────────────────┘
```

## Notes

- **ToastProvider**: `MarketingPage` uses `useToast()`. If the host does not provide a `ToastProvider`, you must wrap `MarketingPage` in one.
- **Design system**: Styles depend on `@citron-systems/citron-ds`. Ensure the host imports its CSS (`import '@citron-systems/citron-ds/css'`).
- **Port**: Preview uses port 5001. In dev (`npm run dev`), Vite uses 5173 by default.
