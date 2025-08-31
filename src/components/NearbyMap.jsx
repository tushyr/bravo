import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { LuX as X, LuMapPin as MapPin, LuStar as Star, LuNavigation as Navigation } from 'react-icons/lu'

const NearbyMap = ({ isOpen, onClose, centerShop, allShops, isDark = false }) => {
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

  // Filter nearby shops (exclude the center shop and get nearby ones)
  const nearbyShops = allShops.filter(shop => shop.id !== centerShop?.id)

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className={isDark ? 'absolute inset-0 bg-black/80 backdrop-blur-sm' : 'absolute inset-0 bg-black/50 backdrop-blur-sm'} />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className={isDark 
          ? 'relative w-full max-w-4xl max-h-[82dvh] md:max-h-[90vh] bg-neutral-900 rounded-3xl shadow-2xl border border-white/10 overflow-hidden'
          : 'relative w-full max-w-4xl max-h-[82dvh] md:max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nearby-map-title"
      >
        {/* Header */}
        <div className={isDark ? 'flex items-center justify-between p-6 border-b border-white/10' : 'flex items-center justify-between p-6 border-b border-gray-200'}>
          <div>
            <h2 id="nearby-map-title" className={isDark ? 'text-xl font-bold text-white' : 'text-xl font-bold text-gray-900'}>
              Nearby Liquor Stores & Bars
            </h2>
            {centerShop && (
              <p className={isDark ? 'text-sm text-gray-400 mt-1' : 'text-sm text-gray-600 mt-1'}>
                Near {centerShop.name}, {centerShop.area}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className={isDark 
              ? 'p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors'
              : 'p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors'}
            aria-label="Close map"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(82dvh-120px)] md:h-[calc(90vh-120px)] safe-area-bottom no-scrollbar">
          {/* Placeholder for future map integration */}
          <div className={isDark 
            ? 'h-48 md:h-64 bg-neutral-800 rounded-2xl border border-white/10 flex items-center justify-center mb-6'
            : 'h-48 md:h-64 bg-gray-100 rounded-2xl border border-gray-200 flex items-center justify-center mb-6'}>
            <div className="text-center">
              <MapPin className={isDark ? 'h-12 w-12 text-gray-500 mx-auto mb-3' : 'h-12 w-12 text-gray-400 mx-auto mb-3'} />
              <p className={isDark ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>
                Interactive map coming soon
              </p>
              <p className={isDark ? 'text-gray-500 text-xs mt-1' : 'text-gray-500 text-xs mt-1'}>
                For now, browse the list below
              </p>
            </div>
          </div>

          {/* Shops List */}
          <div className="space-y-4">
            <h3 className={isDark ? 'text-lg font-semibold text-white mb-4' : 'text-lg font-semibold text-gray-900 mb-4'}>
              All Locations ({nearbyShops.length})
            </h3>
            
            {nearbyShops.map(shop => (
              <div
                key={shop.id}
                className={isDark 
                  ? 'bg-neutral-800 rounded-2xl p-4 border border-white/10 hover:bg-neutral-750 transition-colors'
                  : 'bg-gray-50 rounded-2xl p-4 border border-gray-200 hover:bg-gray-100 transition-colors'}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className={isDark ? 'font-semibold text-white' : 'font-semibold text-gray-900'}>
                        {shop.name}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        shop.userReported === 'closed' || !isShopOpen(shop)
                          ? (isDark ? 'bg-rose-600/70 text-white' : 'bg-red-600/70 text-white')
                          : (isDark ? 'bg-green-600/70 text-white' : 'bg-green-600/70 text-white')
                      }`}>
                        {getStatusText(shop)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm mb-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className={isDark ? 'h-4 w-4 text-rose-400' : 'h-4 w-4 text-purple-600'} />
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{shop.area}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{shop.rating}</span>
                      </div>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                        {shop.type === 'liquor_store' ? 'Liquor Store' : 'Bar'}
                      </span>
                    </div>
                    
                    <p className={isDark ? 'text-sm text-gray-400' : 'text-sm text-gray-600'}>
                      {shop.address}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => openInMaps(shop)}
                    className={isDark 
                      ? 'ml-4 p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors'
                      : 'ml-4 p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors'}
                    title="Get directions"
                  >
                    <Navigation className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default NearbyMap
