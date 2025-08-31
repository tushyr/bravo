import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { LuX as X, LuMapPin as MapPin } from 'react-icons/lu'

const CityMap = ({ isOpen, onClose, allShops, filteredShops, activeCategory, openNowFilter, isDark = false }) => {
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

  // Counts & filter pills
  const totalCount = Array.isArray(allShops) ? allShops.length : 0
  const visibleCount = Array.isArray(filteredShops) ? filteredShops.length : totalCount
  const categoryLabelMap = {
    all: 'All',
    liquor_store: 'Shops',
    bar: 'Bars',
    premium: 'Premium'
  }
  const categoryLabel = categoryLabelMap?.[activeCategory] || 'All'
  const showFiltersPill = (activeCategory && activeCategory !== 'all') || !!openNowFilter

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 md:p-4">
      {/* Backdrop */}
      <div className={isDark ? 'absolute inset-0 bg-black/80 backdrop-blur-sm' : 'absolute inset-0 bg-black/50 backdrop-blur-sm'} />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className={isDark 
          ? 'relative w-full max-w-6xl max-h-[82dvh] md:max-h-[95vh] bg-neutral-900 rounded-3xl shadow-2xl border border-white/10 overflow-hidden'
          : 'relative w-full max-w-6xl max-h-[82dvh] md:max-h-[95vh] bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="city-map-title"
      >
        {/* Header */}
        <div className={isDark ? 'flex items-center justify-between p-4 md:p-6 border-b border-white/10' : 'flex items-center justify-between p-4 md:p-6 border-b border-gray-200'}>
          <div>
            <h2 id="city-map-title" className={isDark ? 'text-2xl font-bold text-white' : 'text-2xl font-bold text-gray-900'}>
              Delhi Liquor & Bar Map
            </h2>
            <p className={isDark ? 'text-sm text-gray-400 mt-1' : 'text-sm text-gray-600 mt-1'}>
              Showing {visibleCount} of {totalCount} locations across the city
            </p>
            {showFiltersPill && (
              <div className="mt-2">
                <span className={isDark ? 'inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-gray-200' : 'inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-[11px] text-gray-700'}>
                  <span className={isDark ? 'text-rose-300' : 'text-purple-600'}>Filters</span>
                  {activeCategory && activeCategory !== 'all' && (
                    <span>{categoryLabel}</span>
                  )}
                  {openNowFilter && (
                    <span>Open Now</span>
                  )}
                </span>
              </div>
            )}
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

        {/* Content: Full-width Map Area */}
        <div className="h-[calc(82dvh-96px)] md:h-[calc(95vh-120px)] p-3 md:p-6 safe-area-bottom no-scrollbar">
          <div className={isDark 
            ? 'h-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-xl md:rounded-2xl border border-white/5 relative overflow-hidden'
            : 'h-full bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-xl md:rounded-2xl border border-gray-200 relative overflow-hidden'}>
            
            {/* Background pattern/texture */}
            {isDark && (
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-rose-900/10 via-transparent to-red-900/5"></div>
                <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-rose-600/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/3 left-1/3 w-48 h-48 bg-red-500/5 rounded-full blur-2xl"></div>
              </div>
            )}
            
            {/* Grid pattern */}
            <div className={isDark 
              ? 'absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] bg-[length:24px_24px]'
              : 'absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,_gray_1px,_transparent_0)] bg-[length:24px_24px]'}></div>
            
            {/* Content */}
            <div className="relative z-10 h-full flex items-center justify-center">
              <div className="text-center max-w-lg">
                {/* Icon with glow effect */}
                <div className="relative mb-4 md:mb-6">
                  <div className={isDark ? 'absolute inset-0 bg-rose-500/20 rounded-full blur-xl' : 'absolute inset-0 bg-purple-500/20 rounded-full blur-xl'}></div>
                  <div className={isDark 
                    ? 'relative w-16 h-16 md:w-20 md:h-20 mx-auto bg-gradient-to-br from-rose-600/80 to-red-700/80 rounded-2xl flex items-center justify-center border border-rose-500/30'
                    : 'relative w-16 h-16 md:w-20 md:h-20 mx-auto bg-gradient-to-br from-purple-600/80 to-blue-700/80 rounded-2xl flex items-center justify-center border border-purple-500/30'}>
                    <MapPin className="h-8 w-8 md:h-10 md:w-10 text-white" />
                  </div>
                </div>
                
                <h3 className={isDark ? 'text-xl md:text-2xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent' : 'text-xl md:text-2xl font-bold text-gray-900 mb-3'}>
                  Interactive City Map
                </h3>
                
                <p className={isDark ? 'text-gray-400 text-sm md:text-base mb-5 md:mb-6 leading-relaxed' : 'text-gray-600 text-sm md:text-base mb-5 md:mb-6 leading-relaxed'}>
                  Explore all <span className={isDark ? 'text-rose-400 font-semibold' : 'text-purple-600 font-semibold'}>{allShops.length}</span> locations across Delhi with our interactive map experience
                </p>
                
                {/* Feature list */}
                <div className="space-y-3 text-sm">
                  <div className={isDark ? 'flex items-center justify-center gap-3 text-gray-300' : 'flex items-center justify-center gap-3 text-gray-600'}>
                    <div className={isDark ? 'w-1.5 h-1.5 bg-rose-500 rounded-full' : 'w-1.5 h-1.5 bg-purple-500 rounded-full'}></div>
                    <span>Real-time open/closed status</span>
                  </div>
                  <div className={isDark ? 'flex items-center justify-center gap-3 text-gray-300' : 'flex items-center justify-center gap-3 text-gray-600'}>
                    <div className={isDark ? 'w-1.5 h-1.5 bg-rose-500 rounded-full' : 'w-1.5 h-1.5 bg-purple-500 rounded-full'}></div>
                    <span>Smart clustering for dense areas</span>
                  </div>
                  <div className={isDark ? 'flex items-center justify-center gap-3 text-gray-300' : 'flex items-center justify-center gap-3 text-gray-600'}>
                    <div className={isDark ? 'w-1.5 h-1.5 bg-rose-500 rounded-full' : 'w-1.5 h-1.5 bg-purple-500 rounded-full'}></div>
                    <span>Advanced filtering & search</span>
                  </div>
                </div>
                
                {/* Coming soon badge */}
                <div className="mt-6 md:mt-8">
                  <span className={isDark 
                    ? 'inline-flex items-center px-4 py-2 rounded-full text-xs font-medium bg-gradient-to-r from-rose-600/20 to-red-600/20 text-rose-300 border border-rose-500/30'
                    : 'inline-flex items-center px-4 py-2 rounded-full text-xs font-medium bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-purple-700 border border-purple-500/30'}>
                    Coming Soon
                  </span>
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
