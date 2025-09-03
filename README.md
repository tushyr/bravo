# ThekaBar — Alcohol Locator (Community-first)

Mobile-first React app to find liquor stores and bars in Delhi NCR with filters, maps, reminders, and community-reported open/closed status.

## Features

- Community status: users report open/closed; backend aggregates votes and recency
- Filters by category, favorites-only, distance radius; map views (nearby and city)
- Reminders and notifications (local)
- PWA-ready (service worker registered in production)

## Getting Started

Prerequisites: Node >= 20.19.0

Install deps:

```bash
npm install
```

Run dev client and API together (recommended):

```bash
npm run dev:all
```

Or run separately:

```bash
# API server on http://localhost:4000
npm run server:dev

# Vite dev server on http://localhost:5173 (proxies /api -> :4000)
npm run dev
```

Production build and preview:

```bash
npm run build
npm run preview
```

## API

Base URL in dev: proxied via Vite to http://localhost:4000 (see `vite.config.js`).

- GET `/api/health`
  - Returns `{ status, time }`

- GET `/api/shops`
  - Returns `{ shops: Shop[], count }`
  - Each `Shop` includes `reportSummary`:
    - `openCount: number`
    - `closedCount: number`
    - `lastReportedAt: string | null` (ISO)
    - `status: 'open' | 'closed' | 'unknown'`
    - `confidence: 'low' | 'medium' | 'high'`

- POST `/api/shops/:id/report`
  - Body: `{ isOpen: boolean }`
  - Updates in-memory aggregation and sets `userReported` for quick client fallback

- GET `/` (root)
  - Health text: "ThekaBar API running"

Removed legacy endpoints: `/api/areas`, `/api/types`, and all ledger/inventory routes.

## Notes

- Mock data is served from `src/data/mockData.js` with an in-memory copy inside the API for ephemeral mutations.
- Service worker is registered only in production builds.

