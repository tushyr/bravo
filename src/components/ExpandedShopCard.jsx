import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  LuX as X,
  LuMapPin as MapPin,
  LuStar as Star,
  LuHeart as Heart,
  LuBell as Bell,
  LuBellRing as BellRing,
  LuMap as Map,
  LuShare2 as Share,
  LuPhone as Phone,
  LuClock as Clock,
  LuNavigation as Navigation,
  LuWifi as Wifi,
  LuCreditCard as CreditCard,
  LuCar as Car,
  LuShield as Shield
} from 'react-icons/lu'
import { haptics } from '../utils/haptics'

const ExpandedShopCard = ({ 
  shop, 
  isOpen, 
  onClose, 
  isFavorite, 
  onToggleFavorite, 
  onSetReminder, 
  hasReminder, 
  onShowNearbyMap, 
  isDark = true 
}) => {
  const [showReminderMenu, setShowReminderMenu] = useState(false)
  const [mode, setMode] = useState('before_close')
  const [customBeforeMinutes, setCustomBeforeMinutes] = useState('')
  const [inHours, setInHours] = useState('')
  const [inMinutes, setInMinutes] = useState('')
  const modalRef = useRef(null)
  const reminderMenuRef = useRef(null)

  const isShopOpen = () => {
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
    return isShopOpen() ? 'Open Now' : 'Closed'
  }

  const distanceText = (shop && typeof shop.distanceKm === 'number' && isFinite(shop.distanceKm))
    ? (shop.distanceKm < 10 ? `${shop.distanceKm.toFixed(1)} km` : `${Math.round(shop.distanceKm)} km`)
    : null

  const openInMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${shop.coordinates.lat},${shop.coordinates.lng}&destination_place_id=${shop.name}`
    window.open(url, '_blank')
    try { haptics.success() } catch {}
  }

  const callShop = () => {
    window.open(`tel:${shop.phone}`, '_self')
    try { haptics.light() } catch {}
  }

  const shareShop = async () => {
    const shareData = {
      title: `${shop.name} - ThekaBar`,
      text: `Check out ${shop.name} in ${shop.area}. ${getStatusText()}.`,
      url: window.location.href
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        try { haptics.success() } catch {}
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
        try { haptics.light() } catch {}
        // Could show a toast here
      }
    } catch {
      // Share failed; ignore to keep UI silent in client
    }
  }

  const setAndCloseReminder = (min) => {
    if (!min || isNaN(min) || min <= 0) return
    onSetReminder({ type: 'before_close', minutes: parseInt(min) })
    setCustomBeforeMinutes('')
    setShowReminderMenu(false)
    try { haptics.success() } catch {}
  }

  const setInAndCloseReminder = (mins) => {
    if (!mins || isNaN(mins) || mins <= 0) return
    onSetReminder({ type: 'in', minutes: parseInt(mins) })
    setInHours('')
    setInMinutes('')
    setShowReminderMenu(false)
    try { haptics.success() } catch {}
  }

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Close reminder menu when clicking outside
  useEffect(() => {
    if (!showReminderMenu) return
    const onDocClick = (e) => {
      if (reminderMenuRef.current && !reminderMenuRef.current.contains(e.target)) {
        setShowReminderMenu(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [showReminderMenu])

  if (!isOpen) return null

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-slide-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div 
        ref={modalRef}
        className={`w-full max-w-md max-h-[85vh] overflow-y-auto no-scrollbar rounded-t-3xl animate-slide-up ${
          isDark 
            ? 'bg-neutral-900 border-t border-white/10' 
            : 'bg-white border-t border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-white/20' : 'bg-gray-300'}`} />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex-1">
            <h2 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {shop.name}
            </h2>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                shop.userReported === 'closed' || !isShopOpen() 
                  ? 'bg-rose-600/70 text-white' 
                  : 'bg-green-600/70 text-white'
              }`}>
                {getStatusText()}
              </span>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {shop.type === 'liquor_store' ? 'Liquor Store' : 'Bar'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors hover-bounce ${
              isDark 
                ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={() => {
                onToggleFavorite(shop.id)
                try { haptics.toggle(!isFavorite) } catch {}
              }}
              className={`flex flex-col items-center p-3 rounded-2xl transition-all active:scale-95 hover-bounce ${
                isFavorite
                  ? (isDark ? 'bg-rose-600/20 text-rose-400' : 'bg-rose-100 text-rose-600')
                  : (isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
              }`}
            >
              <Heart className={`h-6 w-6 mb-1 ${isFavorite ? 'pulse-glow-rose' : ''}`} />
              <span className="text-xs font-medium">
                {isFavorite ? 'Saved' : 'Save'}
              </span>
            </button>

            <button
              onClick={() => {
                setShowReminderMenu(true)
                try { haptics.light() } catch {}
              }}
              className={`flex flex-col items-center p-3 rounded-2xl transition-all active:scale-95 hover-bounce ${
                hasReminder
                  ? (isDark ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600')
                  : (isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
              }`}
            >
              {hasReminder ? <BellRing className="h-6 w-6 mb-1 pulse-glow-amber" /> : <Bell className="h-6 w-6 mb-1" />}
              <span className="text-xs font-medium">Remind</span>
            </button>

            <button
              onClick={() => {
                onShowNearbyMap?.(shop)
                onClose()
                try { haptics.light() } catch {}
              }}
              className={`flex flex-col items-center p-3 rounded-2xl transition-all active:scale-95 hover-bounce ${
                isDark ? 'bg-white/5 text-blue-400 hover:bg-white/10' : 'bg-gray-100 text-blue-600 hover:bg-gray-200'
              }`}
            >
              <Map className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Map</span>
            </button>

            <button
              onClick={shareShop}
              className={`flex flex-col items-center p-3 rounded-2xl transition-all active:scale-95 hover-bounce ${
                isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Share className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Share</span>
            </button>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="px-6 pb-6 space-y-4">
          {/* Location & Rating */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-purple-400" />
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {shop.area}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-400" />
              <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {shop.rating}
              </span>
            </div>
          </div>

          {/* Address */}
          <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <div className="flex items-start gap-2">
              <Navigation className={`h-4 w-4 mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {shop.address}
                </p>
                {distanceText && (
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {distanceText} away
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Hours
              </span>
            </div>
            <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {shop.openTime} - {shop.closeTime}
            </p>
          </div>

          {/* Speciality */}
          <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {shop.speciality}
            </p>
          </div>

          {/* Features */}
          <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Shield className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Features
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`px-2 py-1 rounded-lg text-xs ${isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                {shop.priceRange} Price Range
              </span>
              {shop.isPremium && (
                <span className="px-2 py-1 rounded-lg text-xs bg-gradient-to-r from-yellow-400/20 to-purple-500/20 text-yellow-300 border border-yellow-400/30">
                  👑 Premium
                </span>
              )}
              <span className={`px-2 py-1 rounded-lg text-xs ${isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                <CreditCard className="h-3 w-3 inline mr-1" />
                Cards Accepted
              </span>
              <span className={`px-2 py-1 rounded-lg text-xs ${isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                <Car className="h-3 w-3 inline mr-1" />
                Parking
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={callShop}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all active:scale-95 hover-bounce ${
                isDark 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <Phone className="h-4 w-4" />
              Call
            </button>
            <button
              onClick={openInMaps}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all active:scale-95 hover-bounce ${
                isDark 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Navigation className="h-4 w-4" />
              Directions
            </button>
          </div>
        </div>

        {/* Reminder Menu Overlay */}
        {showReminderMenu && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div
              ref={reminderMenuRef}
              className={`w-full max-w-xs rounded-2xl p-5 ${
                isDark 
                  ? 'bg-neutral-800 border border-white/10' 
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Set Reminder
                </h3>
                <button
                  onClick={() => setShowReminderMenu(false)}
                  className={`p-1 rounded-full ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Mode selector */}
              <div className={`relative grid grid-cols-2 items-center mb-4 p-1 rounded-full ${
                isDark ? 'bg-neutral-700 border border-white/10' : 'bg-gray-100 border border-gray-200'
              }`}>
                <div
                  className={`absolute top-1 bottom-1 rounded-full transition-all ${
                    isDark ? 'bg-neutral-600' : 'bg-white shadow'
                  }`}
                  style={{ left: mode === 'before_close' ? '4px' : 'calc(50% + 4px)', width: 'calc(50% - 8px)' }}
                />
                <button
                  onClick={() => setMode('before_close')}
                  className={`relative z-10 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isDark ? 'text-gray-200 hover:text-white' : 'text-gray-800 hover:text-gray-900'
                  }`}
                >
                  Before close
                </button>
                <button
                  onClick={() => setMode('in')}
                  className={`relative z-10 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isDark ? 'text-gray-200 hover:text-white' : 'text-gray-800 hover:text-gray-900'
                  }`}
                >
                  In
                </button>
              </div>

              {/* Before close mode */}
              {mode === 'before_close' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {[
                      { label: '45m', value: 45 },
                      { label: '1h', value: 60 },
                      { label: '2h', value: 120 },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setAndCloseReminder(opt.value)}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                          isDark
                            ? 'bg-neutral-700 text-gray-100 border border-white/10 hover:bg-neutral-600'
                            : 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      max={240}
                      value={customBeforeMinutes}
                      onChange={(e) => setCustomBeforeMinutes(e.target.value)}
                      placeholder="Custom (min)"
                      className={`flex-1 px-3 py-2 rounded-xl text-sm border focus:outline-none ${
                        isDark
                          ? 'bg-neutral-700 text-white placeholder-gray-400 border-white/10 focus:bg-neutral-600'
                          : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300 focus:bg-gray-50'
                      }`}
                    />
                    <button
                      onClick={() => setAndCloseReminder(parseInt(customBeforeMinutes))}
                      disabled={!customBeforeMinutes || parseInt(customBeforeMinutes) <= 0}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 ${
                        isDark
                          ? 'bg-rose-600 text-white hover:bg-rose-700'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      Set
                    </button>
                  </div>
                </div>
              )}

              {/* In duration mode */}
              {mode === 'in' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {[{ label: '1h', value: 60 }, { label: '2h', value: 120 }, { label: '3h', value: 180 }].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setInAndCloseReminder(opt.value)}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                          isDark
                            ? 'bg-neutral-700 text-gray-100 border border-white/10 hover:bg-neutral-600'
                            : 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      max={12}
                      value={inHours}
                      onChange={(e) => setInHours(e.target.value)}
                      placeholder="hrs"
                      className={`w-20 text-center px-3 py-2 rounded-xl text-sm border focus:outline-none ${
                        isDark
                          ? 'bg-neutral-700 text-white placeholder-gray-400 border-white/10 focus:bg-neutral-600'
                          : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300 focus:bg-gray-50'
                      }`}
                    />
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={inMinutes}
                      onChange={(e) => setInMinutes(e.target.value)}
                      placeholder="min"
                      className={`w-20 text-center px-3 py-2 rounded-xl text-sm border focus:outline-none ${
                        isDark
                          ? 'bg-neutral-700 text-white placeholder-gray-400 border-white/10 focus:bg-neutral-600'
                          : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300 focus:bg-gray-50'
                      }`}
                    />
                    <button
                      onClick={() => {
                        const h = parseInt(inHours || 0)
                        const m = parseInt(inMinutes || 0)
                        const total = (isNaN(h) ? 0 : h * 60) + (isNaN(m) ? 0 : m)
                        setInAndCloseReminder(total)
                      }}
                      disabled={((parseInt(inHours || 0) || 0) * 60 + (parseInt(inMinutes || 0) || 0)) <= 0}
                      className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 ${
                        isDark
                          ? 'bg-rose-600 text-white hover:bg-rose-700'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      Set
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export default ExpandedShopCard
