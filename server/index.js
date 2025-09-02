import express from 'express'
import cors from 'cors'
import { mockShops, areas, shopTypes } from '../src/data/mockData.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

// Maintain a mutable in-memory copy for this process
let shops = mockShops.map(s => ({ ...s }))
// Simple in-memory mocks for ledger/inventory
let inventory = [
  { id: 1, item: 'Kingfisher Beer', outlet: 'Bar Central', currentStock: 220, reorderLevel: 50, lastSale: '2023-02-14', cost: 45, selling: 65 },
  { id: 2, item: 'Premium Whiskey', outlet: 'Lounge Elite', currentStock: 85, reorderLevel: 20, lastSale: '2023-02-10', cost: 120, selling: 200 }
]
let accounts = [
  { id: 1, name: 'Cash', type: 'Asset', balance: 15750, lastUpdated: '2023-02-14 18:30' },
  { id: 2, name: 'Bank Account', type: 'Asset', balance: 45200, lastUpdated: '2023-02-14 17:45' },
  { id: 3, name: 'Inventory', type: 'Asset', balance: 2850, lastUpdated: '2023-02-14 18:30' },
  { id: 4, name: 'Sales Revenue', type: 'Revenue', balance: 8950, lastUpdated: '2023-02-14 18:30' }
]
let transactions = [
  { id: 1, date: '2023-02-14', item: 'Kingfisher Beer', account: 'Inventory', debit: 0, credit: 150, balance: 2850, outlet: 'Bar Central', type: 'sale' },
  { id: 2, date: '2023-02-14', item: 'Cash Sale', account: 'Cash', debit: 150, credit: 0, balance: 15750, outlet: 'Bar Central', type: 'sale' },
  { id: 3, date: '2023-02-10', item: 'Premium Whiskey', account: 'Inventory', debit: 0, credit: 200, balance: 3000, outlet: 'Lounge Elite', type: 'sale' },
  { id: 4, date: '2023-02-10', item: 'Card Payment', account: 'Bank', debit: 200, credit: 0, balance: 45200, outlet: 'Lounge Elite', type: 'sale' }
]
let sales = [
  { id: 1, date: '2023-02-14', outlet: 'Bar Central', amount: 1500, items: 23, profit: 450 },
  { id: 2, date: '2023-02-13', outlet: 'Lounge Elite', amount: 2200, items: 18, profit: 780 }
]
let pendingOrders = [
  { id: 1234, outlet: 'Bar Central', items: 5, total: 2500, status: 'Pending', date: '2023-02-14' },
  { id: 1235, outlet: 'Lounge Elite', items: 8, total: 4200, status: 'Pending', date: '2023-02-13' }
]

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

// Ledger API (mock)
app.get('/api/ledger', (req, res) => {
  res.json({ accounts, transactions })
})

// Inventory API (mock)
app.get('/api/inventory', (req, res) => {
  res.json({ inventory, sales, pendingOrders })
})

// SSE for inventory updates
app.get('/api/stream/inventory', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  const send = (event, data) => {
    res.write(`event: ${event}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  // Send initial snapshot
  send('snapshot', { inventory, sales })

  // Periodic fake updates
  const interval = setInterval(() => {
    // Decrement a random item's stock to simulate sales
    const idx = Math.floor(Math.random() * inventory.length)
    if (inventory[idx]) {
      inventory[idx].currentStock = Math.max(0, inventory[idx].currentStock - Math.floor(Math.random() * 3))
      inventory[idx].lastSale = new Date().toISOString().slice(0, 10)
      send('stock_update', { item: inventory[idx] })
    }
  }, 5000)

  req.on('close', () => {
    clearInterval(interval)
  })
})

app.get('/', (req, res) => {
  res.send('ThekaBar API running')
})

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
