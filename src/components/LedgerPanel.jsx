import { useState, useEffect } from 'react'
import { FiSearch, FiUser, FiHome, FiPackage, FiTrendingUp, FiFileText, FiDownload, FiPlus, FiEdit3, FiEye } from 'react-icons/fi'

const LedgerPanel = ({ isDark = true }) => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState('today')
  const [selectedOutlet, setSelectedOutlet] = useState('all')
  const [transactions, setTransactions] = useState([])
  const [accounts, setAccounts] = useState([])
  const [stockData, setStockData] = useState([])
  const [salesData, setSalesData] = useState([])
  const [pendingOrders, setPendingOrders] = useState([])

  useEffect(() => {
    const API = 'http://localhost:4000'

    const fallback = () => {
      setTransactions([
        { id: 1, date: '2023-02-14', item: 'Kingfisher Beer', account: 'Inventory', debit: 0, credit: 150, balance: 2850, outlet: 'Bar Central', type: 'sale' },
        { id: 2, date: '2023-02-14', item: 'Cash Sale', account: 'Cash', debit: 150, credit: 0, balance: 15750, outlet: 'Bar Central', type: 'sale' },
        { id: 3, date: '2023-02-10', item: 'Premium Whiskey', account: 'Inventory', debit: 0, credit: 200, balance: 3000, outlet: 'Lounge Elite', type: 'sale' },
        { id: 4, date: '2023-02-10', item: 'Card Payment', account: 'Bank', debit: 200, credit: 0, balance: 45200, outlet: 'Lounge Elite', type: 'sale' }
      ])
      setAccounts([
        { id: 1, name: 'Cash', type: 'Asset', balance: 15750, lastUpdated: '2023-02-14 18:30' },
        { id: 2, name: 'Bank Account', type: 'Asset', balance: 45200, lastUpdated: '2023-02-14 17:45' },
        { id: 3, name: 'Inventory', type: 'Asset', balance: 2850, lastUpdated: '2023-02-14 18:30' },
        { id: 4, name: 'Sales Revenue', type: 'Revenue', balance: 8950, lastUpdated: '2023-02-14 18:30' }
      ])
      setStockData([
        { id: 1, item: 'Kingfisher Beer', currentStock: 220, reorderLevel: 50, lastSale: '2023-02-14', outlet: 'Bar Central', cost: 45, selling: 65 },
        { id: 2, item: 'Premium Whiskey', currentStock: 85, reorderLevel: 20, lastSale: '2023-02-10', outlet: 'Lounge Elite', cost: 120, selling: 200 }
      ])
      setSalesData([
        { id: 1, date: '2023-02-14', outlet: 'Bar Central', amount: 1500, items: 23, profit: 450 },
        { id: 2, date: '2023-02-13', outlet: 'Lounge Elite', amount: 2200, items: 18, profit: 780 }
      ])
      setPendingOrders([
        { id: 1234, outlet: 'Bar Central', items: 5, total: 2500, status: 'Pending', date: '2023-02-14' },
        { id: 1235, outlet: 'Lounge Elite', items: 8, total: 4200, status: 'Pending', date: '2023-02-13' }
      ])
    }

    const load = async () => {
      try {
        const [ledgerRes, invRes] = await Promise.all([
          fetch(`${API}/api/ledger`).then(r => r.ok ? r.json() : Promise.reject(r.statusText)),
          fetch(`${API}/api/inventory`).then(r => r.ok ? r.json() : Promise.reject(r.statusText)),
        ])
        setAccounts(ledgerRes.accounts || [])
        setTransactions(ledgerRes.transactions || [])
        setStockData(invRes.inventory || [])
        setSalesData(invRes.sales || [])
        setPendingOrders(invRes.pendingOrders || [])
      } catch (e) {
        // Backend not running: use local mocks
        fallback()
      }
    }

    load()

    // SSE subscription for live inventory updates
    let es
    try {
      es = new EventSource(`${API}/api/stream/inventory`)
      es.addEventListener('snapshot', (ev) => {
        try {
          const data = JSON.parse(ev.data)
          if (Array.isArray(data.inventory)) setStockData(data.inventory)
          if (Array.isArray(data.sales)) setSalesData(data.sales)
        } catch {}
      })
      es.addEventListener('stock_update', (ev) => {
        try {
          const { item } = JSON.parse(ev.data)
          setStockData(prev => prev.map(i => i.id === item.id ? item : i))
        } catch {}
      })
    } catch {
      // Ignore if EventSource not available
    }

    return () => {
      if (es && typeof es.close === 'function') es.close()
    }
  }, [])

  const kpiData = { totalSales: 1500, totalStock: 220, pendingOrders: 75 }

  const chartData = [
    { month: 'J', value: 45 }, { month: 'F', value: 52 }, { month: 'M', value: 48 },
    { month: 'A', value: 61 }, { month: 'M', value: 55 }, { month: 'J', value: 67 },
    { month: 'J', value: 73 }, { month: 'A', value: 69 }, { month: 'S', value: 78 }, { month: 'O', value: 85 }
  ]

  const maxValue = Math.max(...chartData.map(d => d.value))

  const sidebarItems = [
    { id: 'dashboard', icon: FiHome, label: 'Dashboard' },
    { id: 'inventory', icon: FiPackage, label: 'Inventory' },
    { id: 'sales', icon: FiTrendingUp, label: 'Sales' },
    { id: 'reports', icon: FiFileText, label: 'Reports' },
    { id: 'accounts', icon: FiUser, label: 'Accounts' }
  ]

  const outlets = [
    { id: 'all', name: 'All Outlets' },
    { id: 'bar_central', name: 'Bar Central' },
    { id: 'lounge_elite', name: 'Lounge Elite' },
    { id: 'wine_bar', name: 'Wine Bar' },
    { id: 'night_club', name: 'Night Club' }
  ]

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchQuery === '' || 
      transaction.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.account.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.outlet.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesOutlet = selectedOutlet === 'all' || 
      transaction.outlet.toLowerCase().includes(selectedOutlet.replace('_', ' '))
    
    return matchesSearch && matchesOutlet
  })

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Sales</p>
              <p className="text-white text-2xl font-bold">{kpiData.totalSales.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Stock</p>
              <p className="text-white text-2xl font-bold">{kpiData.totalStock}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <FiPackage className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Pending Orders</p>
              <p className="text-white text-2xl font-bold">{kpiData.pendingOrders}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <FiFileText className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-white text-lg font-semibold mb-6">Stock Overview</h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {chartData.map((data, index) => (
            <div key={index} className="flex flex-col items-center space-y-2 flex-1">
              <div 
                className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm w-full transition-all duration-300 hover:from-blue-400 hover:to-blue-300"
                style={{ height: `${(data.value / maxValue) * 100}%` }}
              ></div>
              <span className="text-gray-400 text-xs font-medium">{data.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h3 className="text-white text-lg font-semibold mb-4">Recent Sales</h3>
          <div className="space-y-3">
            {salesData.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b border-white/5">
                <div>
                  <p className="text-white font-medium">{sale.outlet}</p>
                  <p className="text-gray-400 text-sm">{sale.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">₹{sale.amount}</p>
                  <p className="text-green-400 text-sm">+₹{sale.profit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h3 className="text-white text-lg font-semibold mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-white font-medium">Order #{order.id}</p>
                  <p className="text-gray-400 text-sm">{order.outlet}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'Pending' ? 'bg-orange-500/20 text-orange-400' : 
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard()
      case 'inventory': return <div className="text-white">Inventory Management Coming Soon</div>
      case 'sales': return <div className="text-white">Sales Ledger Coming Soon</div>
      case 'accounts': return <div className="text-white">Chart of Accounts Coming Soon</div>
      case 'reports': return <div className="text-white">Financial Reports Coming Soon</div>
      default: return renderDashboard()
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex">
        <div className="w-64 bg-gray-800/50 backdrop-blur-sm border-r border-white/10 min-h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
              <h1 className="text-xl font-bold">Ledger Panel</h1>
            </div>
            
            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-gray-800/30 backdrop-blur-sm border-b border-white/10 px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search transactions, items, accounts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg pl-10 pr-4 py-2 w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <select 
                  value={selectedOutlet} 
                  onChange={(e) => setSelectedOutlet(e.target.value)}
                  className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {outlets.map((outlet) => (
                    <option key={outlet.id} value={outlet.id} className="bg-gray-800">
                      {outlet.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <FiUser className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LedgerPanel
