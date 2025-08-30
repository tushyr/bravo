import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { LuX as X, LuMapPin as MapPin, LuStar as Star, LuNavigation as Navigation, LuFilter as Filter } from 'react-icons/lu'

const CityMap = ({ isOpen, onClose, allShops, isDark = false }) => {
  const modalRef = useRef(null)

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const openInMaps = (shop) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${shop.coordinates.lat},${shop.coordinates.lng}&destination_place_id=${shop.name}`
    window.open(url, '_blank')
  }

  const isShopOpen = (shop) => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTime = currentHour * 60 + currentMinute

    const [openHour, openMin] = shop.openTime.split(':').map(Number)
    const [closeHour, closeMin] = shop.closeTime.split(':').map(Number)
    const openTime = openHour * 60 + openMin
    const closeTime = closeHour * 60 + closeMin

    return currentTime >= openTime && currentTime <= closeTime
  }

  const getStatusText = (shop) => {
    if (shop.userReported === 'closed') return 'Reported Closed'
    if (shop.userReported === 'open') return 'Reported Open'
    return isShopOpen(shop) ? 'Open Now' : 'Closed'
  }

  // Categorize shops
  const openShops = allShops.filter(shop => isShopOpen(shop) || shop.userReported === 'open')
  const closedShops = allShops.filter(shop => !isShopOpen(shop) && shop.userReported !== 'open')
  const liquorStores = allShops.filter(shop => shop.type === 'liquor_store')
  const bars = allShops.filter(shop => shop.type === 'bar')
  const premiumShops = allShops.filter(shop => shop.isPremium)

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className={isDark ? 'absolute inset-0 bg-black/80 backdrop-blur-sm' : 'absolute inset-0 bg-black/50 backdrop-blur-sm'} />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className={isDark 
          ? 'relative w-full max-w-6xl max-h-[95vh] bg-neutral-900 rounded-3xl shadow-2xl border border-white/10 overflow-hidden'
          : 'relative w-full max-w-6xl max-h-[95vh] bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="city-map-title"
      >
        {/* Header */}
        <div className={isDark ? 'flex items-center justify-between p-6 border-b border-white/10' : 'flex items-center justify-between p-6 border-b border-gray-200'}>
          <div>
            <h2 id="city-map-title" className={isDark ? 'text-2xl font-bold text-white' : 'text-2xl font-bold text-gray-900'}>
              Delhi Liquor & Bar Map
            </h2>
            <p className={isDark ? 'text-sm text-gray-400 mt-1' : 'text-sm text-gray-600 mt-1'}>
              All {allShops.length} locations across the city
            </p>
          </div>
          <button
            onClick={onClose}
            className={isDark 
              ? 'p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors'
              : 'p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors'}
            aria-label="Close city map"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(95vh-120px)]">
          {/* Left Sidebar - Stats & Filters */}
          <div className={isDark ? 'w-80 border-r border-white/10 p-6 overflow-y-auto' : 'w-80 border-r border-gray-200 p-6 overflow-y-auto'}>
            <div className="space-y-6">
              {/* Quick Stats */}
              <div>
                <h3 className={isDark ? 'text-lg font-semibold text-white mb-4' : 'text-lg font-semibold text-gray-900 mb-4'}>
                  Quick Stats
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className={isDark ? 'bg-neutral-800 rounded-xl p-3 border border-white/10' : 'bg-gray-50 rounded-xl p-3 border border-gray-200'}>
                    <div className={isDark ? 'text-green-400 text-2xl font-bold' : 'text-green-600 text-2xl font-bold'}>
                      {openShops.length}
                    </div>
                    <div className={isDark ? 'text-gray-400 text-xs' : 'text-gray-600 text-xs'}>Open Now</div>
                  </div>
                  <div className={isDark ? 'bg-neutral-800 rounded-xl p-3 border border-white/10' : 'bg-gray-50 rounded-xl p-3 border border-gray-200'}>
                    <div className={isDark ? 'text-rose-400 text-2xl font-bold' : 'text-red-600 text-2xl font-bold'}>
                      {closedShops.length}
                    </div>
                    <div className={isDark ? 'text-gray-400 text-xs' : 'text-gray-600 text-xs'}>Closed</div>
                  </div>
                  <div className={isDark ? 'bg-neutral-800 rounded-xl p-3 border border-white/10' : 'bg-gray-50 rounded-xl p-3 border border-gray-200'}>
                    <div className={isDark ? 'text-blue-400 text-2xl font-bold' : 'text-blue-600 text-2xl font-bold'}>
                      {liquorStores.length}
                    </div>
                    <div className={isDark ? 'text-gray-400 text-xs' : 'text-gray-600 text-xs'}>Liquor Stores</div>
                  </div>
                  <div className={isDark ? 'bg-neutral-800 rounded-xl p-3 border border-white/10' : 'bg-gray-50 rounded-xl p-3 border border-gray-200'}>
                    <div className={isDark ? 'text-purple-400 text-2xl font-bold' : 'text-purple-600 text-2xl font-bold'}>
                      {bars.length}
                    </div>
                    <div className={isDark ? 'text-gray-400 text-xs' : 'text-gray-600 text-xs'}>Bars</div>
                  </div>
                </div>
              </div>

              {/* Premium Locations */}
              <div>
                <h3 className={isDark ? 'text-lg font-semibold text-white mb-3' : 'text-lg font-semibold text-gray-900 mb-3'}>
                  👑 Premium Locations ({premiumShops.length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {premiumShops.slice(0, 5).map(shop => (
                    <div
                      key={shop.id}
                      className={isDark 
                        ? 'bg-neutral-800 rounded-lg p-3 border border-white/10'
                        : 'bg-gray-50 rounded-lg p-3 border border-gray-200'}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className={isDark ? 'font-medium text-white text-sm' : 'font-medium text-gray-900 text-sm'}>
                            {shop.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              isShopOpen(shop)
                                ? (isDark ? 'bg-green-600/70 text-white' : 'bg-green-600/70 text-white')
                                : (isDark ? 'bg-rose-600/70 text-white' : 'bg-red-600/70 text-white')
                            }`}>
                              {getStatusText(shop)}
                            </span>
                            <span className={isDark ? 'text-gray-400 text-xs' : 'text-gray-600 text-xs'}>
                              {shop.area}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => openInMaps(shop)}
                          className={isDark 
                            ? 'p-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors'
                            : 'p-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors'}
                          title="Get directions"
                        >
                          <Navigation className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Map Area */}
          <div className="flex-1 p-6">
            {/* Placeholder for future map integration */}
            <div className={isDark 
              ? 'h-full bg-neutral-800 rounded-2xl border border-white/10 flex items-center justify-center'
              : 'h-full bg-gray-100 rounded-2xl border border-gray-200 flex items-center justify-center'}>
              <div className="text-center">
                <MapPin className={isDark ? 'h-16 w-16 text-gray-500 mx-auto mb-4' : 'h-16 w-16 text-gray-400 mx-auto mb-4'} />
                <h3 className={isDark ? 'text-xl font-semibold text-white mb-2' : 'text-xl font-semibold text-gray-900 mb-2'}>
                  Interactive City Map
                </h3>
                <p className={isDark ? 'text-gray-400 text-sm mb-4' : 'text-gray-600 text-sm mb-4'}>
                  Full Delhi map with all {allShops.length} locations coming soon
                </p>
                <div className="space-y-2 text-sm">
                  <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                    • Real-time open/closed status
                  </p>
                  <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                    • Cluster view for dense areas
                  </p>
                  <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                    • Filter by type, distance & ratings
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default CityMap
