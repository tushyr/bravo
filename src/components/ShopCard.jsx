import {
  LuMapPin as MapPin,
  LuStar as Star,
  LuHeart as Heart
} from 'react-icons/lu'

const ShopCard = ({ shop, isFavorite, onToggleFavorite, onUpdateStatus, isDark = false }) => {
  const isOpen = () => {
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

  const getStatusText = () => {
    if (shop.userReported === 'closed') return 'Reported Closed'
    if (shop.userReported === 'open') return 'Reported Open'
    return isOpen() ? 'Open Now' : 'Closed'
  }

  const openInMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${shop.coordinates.lat},${shop.coordinates.lng}&destination_place_id=${shop.name}`
    window.open(url, '_blank')
  }

  const callShop = () => {
    window.open(`tel:${shop.phone}`, '_self')
  }

  return (
    <div className={isDark ? 'bg-white/5 backdrop-blur-lg rounded-3xl shadow-lg overflow-hidden hover:shadow-xl hover:bg-white/10 transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.995] ripple ripple-white motion-sensitive' : 'bg-white/25 backdrop-blur-lg rounded-3xl shadow-md ring-1 ring-white/40 overflow-hidden hover:shadow-lg hover:bg-white/35 transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.995] ripple ripple-white motion-sensitive'}>
      <div className="p-5">
        {/* Header with name and favorite */}
        <div className="flex items-start justify-between mb-4">
          <h3 className={isDark ? 'text-lg font-bold text-white leading-tight' : 'text-lg font-bold text-gray-900 leading-tight'}>{shop.name}</h3>
          <button
            onClick={() => onToggleFavorite(shop.id)}
            className={isDark ? 'p-2 rounded-full bg-white/5 backdrop-blur-md text-rose-400 hover:bg-white/10 transition-colors ripple ripple-rose active:scale-95 transition-transform' : 'p-2 rounded-full bg-white/20 backdrop-blur-md text-gray-700 hover:text-red-500 hover:bg-white/30 transition-colors ripple ripple-rose active:scale-95 transition-transform'}
          >
            <Heart className={`h-5 w-5 ${isFavorite ? 'text-red-500' : ''}`} />
          </button>
        </div>

        {/* Status and type */}
        <div className="flex items-center space-x-3 mb-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            shop.userReported === 'closed' || !isOpen() 
              ? (isDark ? 'bg-rose-600/70 text-white' : 'bg-red-600/70 text-white') 
              : (isDark ? 'bg-green-600/70 text-white' : 'bg-green-600/70 text-white')
          }`}>
            {getStatusText()}
          </span>
          <span className={isDark ? 'text-xs text-gray-400' : 'text-xs text-gray-600'}>
            {shop.type === 'liquor_store' ? 'Liquor Store' : 'Bar'}
          </span>
        </div>

        {/* Location and rating */}
        <div className={isDark ? 'flex items-center space-x-3 text-sm text-gray-300 mb-3' : 'flex items-center space-x-3 text-sm text-gray-600 mb-3'}>
          <div className="flex items-center gap-1.5">
            <MapPin className={isDark ? 'h-4 w-4 text-rose-400' : 'h-4 w-4 text-purple-600'} />
            <span className="font-medium">{shop.area}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-yellow-400" />
            <span className="font-medium">{shop.rating}</span>
          </div>
          <span className={isDark ? 'px-2 py-0.5 rounded-md border border-white/15 text-gray-200 uppercase tracking-wide text-[10px] font-light' : 'px-2 py-0.5 rounded-md border border-gray-300 text-gray-700 uppercase tracking-wide text-[10px] font-light'}>{shop.priceRange}</span>
        </div>

        {/* Address */}
        <p className={isDark ? 'text-sm text-gray-300 mb-2.5' : 'text-sm text-gray-700 mb-2.5'}>{shop.address}</p>

        {/* Speciality */}
        <p className={isDark ? 'text-xs text-gray-400' : 'text-xs text-gray-600'}>{shop.speciality}</p>
      </div>
    </div>
  )
}

export default ShopCard
