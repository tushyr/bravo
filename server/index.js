import express from 'express'
import cors from 'cors'
import { mockShops, areas, shopTypes } from '../src/data/mockData.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

// Maintain a mutable in-memory copy for this process
let shops = mockShops.map(s => ({ ...s }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

app.get('/api/shops', (req, res) => {
  res.json({ shops, count: shops.length })
})

app.get('/api/areas', (req, res) => {
  res.json({ areas })
})

app.get('/api/types', (req, res) => {
  res.json({ types: shopTypes })
})

// User status report: mark shop as open/closed (ephemeral)
app.post('/api/shops/:id/report', (req, res) => {
  const id = parseInt(req.params.id, 10)
  const { isOpen } = req.body || {}
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid shop id' })
  if (typeof isOpen !== 'boolean') return res.status(400).json({ error: 'isOpen (boolean) required' })
  const idx = shops.findIndex(s => s.id === id)
  if (idx === -1) return res.status(404).json({ error: 'Shop not found' })
  shops[idx] = { ...shops[idx], userReported: isOpen ? 'open' : 'closed' }
  return res.json({ ok: true, shop: shops[idx] })
})

app.get('/', (req, res) => {
  res.send('ThekaBar API running')
})

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
