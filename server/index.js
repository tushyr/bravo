import express from 'express'
import cors from 'cors'
import { mockShops } from '../src/data/mockData.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

// Maintain a mutable in-memory copy for this process
let shops = mockShops.map(s => ({ ...s }))

// In-memory aggregation for user reports per shop
// Map<shopId, { open: number, closed: number, lastReportedAt: string|null }>
const reports = new Map()

const summarizeReports = (id) => {
  const r = reports.get(id) || { open: 0, closed: 0, lastReportedAt: null }
  const total = r.open + r.closed
  let status = 'unknown'
  if (total > 0) status = r.open >= r.closed ? 'open' : 'closed'

  let confidence = 'low'
  if (total >= 5 && Math.max(r.open, r.closed) / total >= 0.7) confidence = 'high'
  else if (total >= 2) confidence = 'medium'

  return {
    openCount: r.open,
    closedCount: r.closed,
    lastReportedAt: r.lastReportedAt,
    status,
    confidence
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

app.get('/api/shops', (req, res) => {
  const withSummary = shops.map(s => ({ ...s, reportSummary: summarizeReports(s.id) }))
  res.json({ shops: withSummary, count: withSummary.length })
})

// User status report: mark shop as open/closed (ephemeral)
app.post('/api/shops/:id/report', (req, res) => {
  const id = parseInt(req.params.id, 10)
  const { isOpen } = req.body || {}
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid shop id' })
  if (typeof isOpen !== 'boolean') return res.status(400).json({ error: 'isOpen (boolean) required' })
  const idx = shops.findIndex(s => s.id === id)
  if (idx === -1) return res.status(404).json({ error: 'Shop not found' })
  // Update aggregation store
  const nowIso = new Date().toISOString()
  const r = reports.get(id) || { open: 0, closed: 0, lastReportedAt: null }
  if (isOpen) r.open += 1
  else r.closed += 1
  r.lastReportedAt = nowIso
  reports.set(id, r)

  // Keep simple per-shop flag for quick client fallback
  shops[idx] = { ...shops[idx], userReported: isOpen ? 'open' : 'closed' }
  return res.json({ ok: true, shop: shops[idx] })
})

app.get('/', (req, res) => {
  res.send('ThekaBar API running')
})

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
