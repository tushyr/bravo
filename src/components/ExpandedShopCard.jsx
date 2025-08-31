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
  LuCreditCard as CreditCard,
  LuCar as Car,
  LuShield as Shield
} from 'react-icons/lu'
import { haptics } from '../utils/haptics'
import { lockScroll } from '../utils/scrollLock'

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
  const closeButtonRef = useRef(null)
  const previouslyFocusedRef = useRef(null)
  const reminderCloseButtonRef = useRef(null)
  const prevFocusReminderRef = useRef(null)

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

  // Lock scroll using centralized helper when modal is open
  useEffect(() => {
    if (!isOpen) return
    const release = lockScroll()
    return () => release()
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

  // Focus management for main modal (trap and restore)
  useEffect(() => {
    if (!isOpen) return

    previouslyFocusedRef.current = document.activeElement

    // Move initial focus to close button (or first focusable)
    const focusInitial = () => {
      const target = closeButtonRef.current
      if (target && modalRef.current?.contains(target)) {
        target.focus()
      } else if (modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        const elements = Array.from(focusable).filter(el => el.offsetParent !== null)
        elements[0]?.focus()
      }
    }
    const t = setTimeout(focusInitial, 0)

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return
      // If a nested menu is open, let that trap handle focus
      if (showReminderMenu) return
      if (!modalRef.current) return
      const focusable = modalRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      const elements = Array.from(focusable).filter(el => el.offsetParent !== null)
      if (elements.length === 0) return
      const first = elements[0]
      const last = elements[elements.length - 1]
      const active = document.activeElement
      if (e.shiftKey) {
        if (active === first || !modalRef.current.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last || !modalRef.current.contains(active)) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKeyDown)
      try {
        previouslyFocusedRef.current && previouslyFocusedRef.current.focus()
      } catch {}
    }
  }, [isOpen, showReminderMenu])

  // Reminder menu: outside click, ESC, focus trap, initial focus, and focus restoration
  useEffect(() => {
    if (!showReminderMenu) return

    prevFocusReminderRef.current = document.activeElement

    // Initial focus to close button or first focusable
    const t = setTimeout(() => {
      const target = reminderCloseButtonRef.current
      if (target && reminderMenuRef.current?.contains(target)) {
        target.focus()
      } else if (reminderMenuRef.current) {
        const focusable = reminderMenuRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        const elements = Array.from(focusable).filter(el => el.offsetParent !== null)
        elements[0]?.focus()
      }
    }, 0)

    const onDocClick = (e) => {
      if (reminderMenuRef.current && !reminderMenuRef.current.contains(e.target)) {
        setShowReminderMenu(false)
      }
    }
    const onKeyDown = (e) => {
      if (!showReminderMenu) return
      if (e.key === 'Escape') {
        e.stopPropagation()
        setShowReminderMenu(false)
        return
      }
      if (e.key === 'Tab' && reminderMenuRef.current) {
        const focusable = reminderMenuRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        const elements = Array.from(focusable).filter(el => el.offsetParent !== null)
        if (elements.length === 0) return
        const first = elements[0]
        const last = elements[elements.length - 1]
        const active = document.activeElement
        if (e.shiftKey) {
          if (active === first || !reminderMenuRef.current.contains(active)) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (active === last || !reminderMenuRef.current.contains(active)) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKeyDown)
      try {
        prevFocusReminderRef.current && prevFocusReminderRef.current.focus()
      } catch {}
    }
  }, [showReminderMenu])

  if (!isOpen) return null

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-slide-in overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div 
        ref={modalRef}
        className={`w-[95%] max-w-[380px] max-h-[80vh] overflow-y-auto no-scrollbar rounded-3xl animate-slide-up ${
          isDark
            ? 'bg-gradient-to-br from-white/8 via-white/4 to-white/2 backdrop-blur-xl ring-1 ring-white/15 shadow-2xl shadow-black/20'
            : 'bg-gradient-to-br from-white/40 via-white/30 to-white/20 backdrop-blur-xl ring-1 ring-white/50 shadow-xl shadow-black/10'
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="expanded-shop-title"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-4 pb-3">
          <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-gradient-to-r from-white/40 to-white/20' : 'bg-gradient-to-r from-gray-400 to-gray-300'}`} />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex-1">
            <h2 id="expanded-shop-title" className={`text-[17px] font-semibold mb-1 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {shop.name}
            </h2>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                shop.userReported === 'closed' || !isShopOpen() 
                  ? 'bg-rose-600/70 text-white' 
                  : 'bg-green-600/70 text-white'
              }`}>
                {getStatusText()}
              </span>
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {shop.type === 'liquor_store' ? 'Liquor Store' : 'Bar'}
              </span>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className={`p-2 rounded-full transition-colors hover-bounce ${
              isDark
                ? 'bg-white/5 backdrop-blur-md ring-1 ring-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                : 'bg-white/20 backdrop-blur-md ring-1 ring-gray-300 text-gray-700 hover:bg-white/30 hover:text-gray-900'
            }`}
            type="button"
            aria-label="Close"
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
              className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-300 active:scale-95 hover-bounce ${
                isFavorite
                  ? (isDark ? 'bg-gradient-to-br from-rose-500/25 to-rose-600/15 text-rose-300 ring-1 ring-rose-400/40 shadow-lg shadow-rose-500/10' : 'bg-gradient-to-br from-rose-100 to-rose-50 text-rose-600 ring-1 ring-rose-300 shadow-md')
                  : (isDark ? 'bg-gradient-to-br from-white/8 to-white/4 text-gray-300 hover:from-white/12 hover:to-white/6 ring-1 ring-white/15 hover:ring-white/25' : 'bg-gradient-to-br from-white/30 to-white/20 text-gray-700 hover:from-white/40 hover:to-white/30 ring-1 ring-gray-300/50')
              }`}
            >
              <Heart className={`h-5 w-5 mb-1 ${isFavorite ? 'pulse-glow-rose' : ''}`} />
              <span className="text-[11px] font-medium">
                {isFavorite ? 'Saved' : 'Save'}
              </span>
            </button>

            <button
              onClick={() => {
                setShowReminderMenu(true)
                try { haptics.light() } catch {}
              }}
              className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-300 active:scale-95 hover-bounce ${
                hasReminder
                  ? (isDark ? 'bg-gradient-to-br from-yellow-500/25 to-amber-600/15 text-yellow-300 ring-1 ring-yellow-400/40 shadow-lg shadow-yellow-500/10' : 'bg-gradient-to-br from-yellow-100 to-amber-50 text-yellow-600 ring-1 ring-yellow-300 shadow-md')
                  : (isDark ? 'bg-gradient-to-br from-white/8 to-white/4 text-gray-300 hover:from-white/12 hover:to-white/6 ring-1 ring-white/15 hover:ring-white/25' : 'bg-gradient-to-br from-white/30 to-white/20 text-gray-700 hover:from-white/40 hover:to-white/30 ring-1 ring-gray-300/50')
              }`}
            >
              {hasReminder ? <BellRing className="h-5 w-5 mb-1 pulse-glow-amber" /> : <Bell className="h-5 w-5 mb-1" />}
              <span className="text-[11px] font-medium">Remind</span>
            </button>

            <button
              onClick={() => {
                onShowNearbyMap?.(shop)
                onClose()
                try { haptics.light() } catch {}
              }}
              className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-300 active:scale-95 hover-bounce ${
                isDark ? 'bg-gradient-to-br from-white/8 to-white/4 text-blue-400 hover:from-blue-500/10 hover:to-blue-600/5 ring-1 ring-white/15 hover:ring-blue-400/30' : 'bg-gradient-to-br from-white/30 to-white/20 text-blue-600 hover:from-blue-50 hover:to-blue-25 ring-1 ring-gray-300/50 hover:ring-blue-300'
              }`}
            >
              <Map className="h-5 w-5 mb-1" />
              <span className="text-[11px] font-medium">Map</span>
            </button>

            <button
              onClick={shareShop}
              className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-300 active:scale-95 hover-bounce ${
                isDark ? 'bg-gradient-to-br from-white/8 to-white/4 text-gray-300 hover:from-white/12 hover:to-white/6 ring-1 ring-white/15 hover:ring-white/25' : 'bg-gradient-to-br from-white/30 to-white/20 text-gray-700 hover:from-white/40 hover:to-white/30 ring-1 ring-gray-300/50'
              }`}
            >
              <Share className="h-5 w-5 mb-1" />
              <span className="text-[11px] font-medium">Share</span>
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
          <div className={`p-4 rounded-2xl ${isDark ? 'bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-sm ring-1 ring-white/15 shadow-lg shadow-black/5' : 'bg-gradient-to-br from-white/60 to-white/40 ring-1 ring-gray-200/60 shadow-md'}`}>
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
          <div className={`p-4 rounded-2xl ${isDark ? 'bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-sm ring-1 ring-white/15 shadow-lg shadow-black/5' : 'bg-gradient-to-br from-white/60 to-white/40 ring-1 ring-gray-200/60 shadow-md'}`}>
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
          <div className={`p-4 rounded-2xl ${isDark ? 'bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-sm ring-1 ring-white/15 shadow-lg shadow-black/5' : 'bg-gradient-to-br from-white/60 to-white/40 ring-1 ring-gray-200/60 shadow-md'}`}>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {shop.speciality}
            </p>
          </div>

          {/* Features */}
          <div className={`p-4 rounded-2xl ${isDark ? 'bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-sm ring-1 ring-white/15 shadow-lg shadow-black/5' : 'bg-gradient-to-br from-white/60 to-white/40 ring-1 ring-gray-200/60 shadow-md'}`}>
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
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-medium transition-all active:scale-95 hover-bounce shadow-md ${
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
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-medium transition-all active:scale-95 hover-bounce shadow-md ${
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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
            <div
              ref={reminderMenuRef}
              className={`w-full max-w-xs rounded-3xl p-6 ${
                isDark 
                  ? 'bg-gradient-to-br from-white/12 via-white/8 to-white/4 backdrop-blur-xl ring-1 ring-white/20 shadow-2xl shadow-black/30' 
                  : 'bg-gradient-to-br from-white/70 via-white/60 to-white/50 backdrop-blur-xl ring-1 ring-white/60 shadow-xl shadow-black/15'
              }`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="reminder-title"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 id="reminder-title" className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Set Reminder
                </h3>
                <button
                  ref={reminderCloseButtonRef}
                  onClick={() => {
                    setShowReminderMenu(false)
                    try { haptics.light() } catch {}
                  }}
                  className={`p-2 rounded-full transition-all duration-300 hover-bounce active:scale-90 ${isDark ? 'bg-white/8 text-gray-300 hover:bg-white/15 hover:text-white ring-1 ring-white/10' : 'bg-white/30 text-gray-700 hover:bg-white/50 hover:text-gray-900 ring-1 ring-gray-300/50'}`}
                  type="button"
                  aria-label="Close reminder menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Mode selector */}
              <div className={`relative grid grid-cols-2 items-center mb-4 p-1 rounded-full ${
                isDark ? 'bg-gradient-to-r from-white/10 to-white/5 ring-1 ring-white/15' : 'bg-gradient-to-r from-white/40 to-white/30 ring-1 ring-gray-300/60'
              }`}>
                <div
                  className={`absolute top-1 bottom-1 rounded-full transition-all duration-300 ${
                    isDark ? 'bg-gradient-to-r from-white/20 to-white/15 shadow-lg' : 'bg-gradient-to-r from-white to-white/90 shadow-md'
                  }`}
                  style={{ left: mode === 'before_close' ? '4px' : 'calc(50% + 4px)', width: 'calc(50% - 8px)' }}
                />
                <button
                  onClick={() => {
                    setMode('before_close')
                    try { haptics.selection() } catch {}
                  }}
                  className={`relative z-10 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 active:scale-95 ${
                    isDark ? 'text-gray-200 hover:text-white' : 'text-gray-800 hover:text-gray-900'
                  }`}
                >
                  Before close
                </button>
                <button
                  onClick={() => {
                    setMode('in')
                    try { haptics.selection() } catch {}
                  }}
                  className={`relative z-10 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 active:scale-95 ${
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
                        onClick={() => {
                          setAndCloseReminder(opt.value)
                          try { haptics.impact('light') } catch {}
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-300 active:scale-95 hover-bounce ${
                          isDark
                            ? 'bg-gradient-to-br from-white/10 to-white/5 text-gray-100 ring-1 ring-white/15 hover:from-white/15 hover:to-white/8'
                            : 'bg-gradient-to-br from-gray-100/80 to-gray-50/60 text-gray-800 ring-1 ring-gray-300/60 hover:from-gray-200/80 hover:to-gray-100/60'
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
                      className={`flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none transition-all duration-300 ${
                        isDark
                          ? 'bg-gradient-to-br from-black/50 to-black/30 text-white placeholder-gray-300 ring-1 ring-white/15 focus:from-black/60 focus:to-black/40 focus:ring-white/30'
                          : 'bg-gradient-to-br from-gray-100/90 to-gray-50/70 text-gray-900 placeholder-gray-500 ring-1 ring-gray-300/60 focus:from-gray-200/90 focus:to-gray-100/70 focus:ring-gray-400/70'
                      }`}
                    />
                    <button
                      onClick={() => {
                        setAndCloseReminder(parseInt(customBeforeMinutes))
                        try { haptics.success() } catch {}
                      }}
                      disabled={!customBeforeMinutes || parseInt(customBeforeMinutes) <= 0}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 active:scale-95 hover-bounce disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ring-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 ${
                        isDark
                          ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white ring-rose-300/60 shadow-rose-500/40'
                          : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white ring-rose-400/60 shadow-rose-600/30'
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
                        onClick={() => {
                          setInAndCloseReminder(opt.value)
                          try { haptics.impact('light') } catch {}
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-300 active:scale-95 hover-bounce ${
                          isDark
                            ? 'bg-gradient-to-br from-white/10 to-white/5 text-gray-100 ring-1 ring-white/15 hover:from-white/15 hover:to-white/8'
                            : 'bg-gradient-to-br from-gray-100/80 to-gray-50/60 text-gray-800 ring-1 ring-gray-300/60 hover:from-gray-200/80 hover:to-gray-100/60'
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
                      className={`w-20 text-center px-3 py-2 rounded-xl text-sm focus:outline-none transition-all duration-300 ${
                        isDark
                          ? 'bg-gradient-to-br from-black/50 to-black/30 text-white placeholder-gray-300 ring-1 ring-white/15 focus:from-black/60 focus:to-black/40 focus:ring-white/30'
                          : 'bg-gradient-to-br from-gray-100/90 to-gray-50/70 text-gray-900 placeholder-gray-500 ring-1 ring-gray-300/60 focus:from-gray-200/90 focus:to-gray-100/70 focus:ring-gray-400/70'
                      }`}
                    />
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={inMinutes}
                      onChange={(e) => setInMinutes(e.target.value)}
                      placeholder="min"
                      className={`w-20 text-center px-3 py-2 rounded-xl text-sm focus:outline-none transition-all duration-300 ${
                        isDark
                          ? 'bg-gradient-to-br from-black/50 to-black/30 text-white placeholder-gray-300 ring-1 ring-white/15 focus:from-black/60 focus:to-black/40 focus:ring-white/30'
                          : 'bg-gradient-to-br from-gray-100/90 to-gray-50/70 text-gray-900 placeholder-gray-500 ring-1 ring-gray-300/60 focus:from-gray-200/90 focus:to-gray-100/70 focus:ring-gray-400/70'
                      }`}
                    />
                    <button
                      onClick={() => {
                        const h = parseInt(inHours || 0)
                        const m = parseInt(inMinutes || 0)
                        const total = (isNaN(h) ? 0 : h * 60) + (isNaN(m) ? 0 : m)
                        setInAndCloseReminder(total)
                        try { haptics.success() } catch {}
                      }}
                      disabled={((parseInt(inHours || 0) || 0) * 60 + (parseInt(inMinutes || 0) || 0)) <= 0}
                      className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-300 active:scale-95 hover-bounce disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ring-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 ${
                        isDark
                          ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white ring-rose-300/60 shadow-rose-500/40'
                          : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white ring-rose-400/60 shadow-rose-600/30'
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
