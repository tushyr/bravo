import { useState, useEffect } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import CategoryChips from './components/CategoryChips'
import ShopCard from './components/ShopCard'
import { mockShops } from './data/mockData'

function App() {
  const [shops, setShops] = useState(mockShops)
  const [filteredShops, setFilteredShops] = useState(mockShops)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [openNowFilter, setOpenNowFilter] = useState(false)
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites')
    return saved ? JSON.parse(saved) : []
  })

  // Dark mode forced globally (pure black with reddish tint)
  const isDark = true

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites))
  }, [favorites])

  

  useEffect(() => {
    let filtered = shops

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(shop => 
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.speciality.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Open Now filter
    if (openNowFilter) {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentTime = currentHour * 60 + currentMinute

      filtered = filtered.filter(shop => {
        const [openHour, openMin] = shop.openTime.split(':').map(Number)
        const [closeHour, closeMin] = shop.closeTime.split(':').map(Number)
        const openTime = openHour * 60 + openMin
        const closeTime = closeHour * 60 + closeMin

        return currentTime >= openTime && currentTime <= closeTime
      })
    }

    // Category filter
    if (activeCategory !== 'all') {
      if (activeCategory === 'premium') {
        filtered = filtered.filter(shop => shop.isPremium)
      } else {
        filtered = filtered.filter(shop => shop.type === activeCategory)
      }
    }

    setFilteredShops(filtered)
  }, [shops, activeCategory, openNowFilter, searchQuery])

  const toggleFavorite = (shopId) => {
    setFavorites(prev => 
      prev.includes(shopId) 
        ? prev.filter(id => id !== shopId)
        : [...prev, shopId]
    )
  }

  const updateShopStatus = (shopId, isOpen) => {
    setShops(prev => prev.map(shop => 
      shop.id === shopId 
        ? { ...shop, userReported: isOpen ? 'open' : 'closed' }
        : shop
    ))
  }

  return (
    <div className={isDark ? 'min-h-screen bg-black text-gray-100 relative overflow-hidden' : 'min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400 relative overflow-hidden'}>
      {isDark && (
        <div aria-hidden className="absolute inset-0 z-0 pointer-events-none">
          {/* YouTube Music inspired red-black gradient */}
          <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-red-900/30 via-red-800/15 to-transparent"></div>
          <div className="absolute -top-24 -right-16 h-80 w-80 rounded-full bg-rose-700/25 blur-3xl"></div>
          <div className="absolute bottom-[-96px] left-1/4 h-96 w-96 rounded-full bg-red-500/10 blur-3xl"></div>
        </div>
      )}

      <div className="relative z-10">
        <Header isDark={isDark} />
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} isDark={isDark} />
        <CategoryChips 
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          openNowFilter={openNowFilter}
          setOpenNowFilter={setOpenNowFilter}
          isDark={isDark}
        />
        
        <div className="px-4 py-4">
          <div className="space-y-3">
            {filteredShops.map(shop => (
              <ShopCard
                key={shop.id}
                shop={shop}
                isFavorite={favorites.includes(shop.id)}
                onToggleFavorite={toggleFavorite}
                onUpdateStatus={updateShopStatus}
                isDark={isDark}
              />
            ))}
          </div>
  
          {filteredShops.length === 0 && (
            <div className="text-center py-16">
              <div className={isDark ? 'bg-white/10 backdrop-blur-lg ring-1 ring-white/10 rounded-2xl shadow-lg p-8 max-w-md mx-auto' : 'bg-white/25 backdrop-blur-lg ring-1 ring-white/40 rounded-2xl shadow-lg p-8 max-w-md mx-auto'}>
                <div className="text-6xl mb-4">🍻</div>
                <p className={isDark ? 'text-white text-xl font-semibold mb-2' : 'text-gray-900 text-xl font-semibold mb-2'}>No shops around...</p>
                <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>Looks like it's a detox day 🔥</p>
                <p className={isDark ? 'text-gray-400 text-sm mt-2' : 'text-gray-600 text-sm mt-2'}>Try adjusting your filters or search radius</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
