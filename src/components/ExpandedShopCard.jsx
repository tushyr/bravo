import { useState, useEffect, useRef, useMemo, memo } from 'react'
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
} from 'react-icons/lu'
import { haptics } from '../utils/haptics'
import { lockScroll } from '../utils/scrollLock'
import { isShopOpen, openShopInMaps, getStatusText as getShopStatusText } from '../utils/shop'

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

  // Keep mounted during closing animation
  const [rendered, setRendered] = useState(isOpen)
  const [closing, setClosing] = useState(false)

  const getStatusText = () => getShopStatusText(shop)

  const distanceText = useMemo(() => {
    if (!shop || typeof shop.distanceKm !== 'number' || !isFinite(shop.distanceKm)) return null
    return shop.distanceKm < 10 ? `${shop.distanceKm.toFixed(1)} km` : `${Math.round(shop.distanceKm)} km`
  }, [shop?.distanceKm])

  const openInMaps = () => {
    openShopInMaps(shop)
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

  // Manage mount/unmount and scroll locking around animations
  useEffect(() => {
    let cleanup = () => {}
    if (isOpen) {
      setRendered(true)
      setClosing(false)
      const release = lockScroll()
      cleanup = release
    } else if (rendered) {
      setClosing(true)
      const t = setTimeout(() => {
        setRendered(false)
        setClosing(false)
      }, 220)
      cleanup = () => clearTimeout(t)
    }
    return () => cleanup()
  }, [isOpen, rendered])

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

  if (!rendered) return null

  return createPortal(
    <div 
      className={`fixed inset-0 z-[9999] flex items-end justify-center p-4 ${isDark ? 'bg-black/95' : 'bg-black/70'} overscroll-contain overlay-boost touch-none select-none ${closing ? 'sheet-overlay-exit' : 'sheet-overlay-enter'}`}
      onWheel={(e) => { e.preventDefault() }}
      onTouchMove={(e) => { e.preventDefault() }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setClosing(true)
          onClose()
        }
      }}
    >
      <div 
        ref={modalRef}
        className={`w-[96%] max-w-[360px] md:max-w-[420px] max-h-[78vh] md:max-h-[80vh] overflow-hidden rounded-2xl md:rounded-3xl sheet-panel ${closing ? 'sheet-exit' : 'sheet-enter'} ${
          isDark
            ? 'bg-neutral-950 ring-1 ring-white/10 shadow-2xl shadow-black/40'
            : 'bg-white ring-1 ring-gray-200 shadow-xl shadow-black/20'
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="expanded-shop-title"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 md:pt-4 pb-2.5 md:pb-3">
          <div className={`w-10 h-1 md:w-12 md:h-1.5 rounded-full ${isDark ? 'bg-gradient-to-r from-white/40 to-white/20' : 'bg-gradient-to-r from-gray-400 to-gray-300'}`} />
        </div>

        {/* Modern Header */}
        <div className="p-5 md:p-6 pb-3 md:pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h2 id="expanded-shop-title" className={`text-lg md:text-xl font-bold mb-1.5 md:mb-2 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {shop.name}
              </h2>
              <div className="flex items-center gap-2.5 md:gap-3 mb-2.5 md:mb-3">
                <span className={`px-2.5 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold ${
                  shop.userReported === 'closed' || !isShopOpen() 
                    ? 'bg-rose-500 text-white' 
                    : 'bg-green-500 text-white'
                }`}>
                  {getStatusText()}
                </span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className={`text-sm md:text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {shop.rating}
                  </span>
                </div>
              </div>
              <p className={`text-[13px] md:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {shop.type === 'liquor_store' ? 'Liquor Store' : 'Bar'} • {shop.priceRange} Price Range
              </p>
            </div>
            <button
              ref={closeButtonRef}
              onClick={() => { setClosing(true); onClose() }}
              className={`p-2.5 rounded-full transition-colors hover-bounce ${
                isDark
                  ? 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
              type="button"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Location & Hours Card */}
          <div className={`p-3.5 md:p-4 rounded-2xl mb-3.5 md:mb-4 ${isDark ? 'bg-neutral-900 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="flex items-start gap-2.5 md:gap-3 mb-2.5 md:mb-3">
              <MapPin className="h-4 w-4 md:h-5 md:w-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <p className={`text-[13px] md:text-sm font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {shop.area}
                </p>
                <p className={`text-[13px] md:text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {shop.address}
                </p>
                {distanceText && (
                  <p className={`text-[11px] md:text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {distanceText} away
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2.5 md:gap-3">
              <Clock className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`text-[13px] md:text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {shop.openTime} - {shop.closeTime}
              </span>
            </div>
          </div>

          {/* Speciality */}
          <div className={`p-3.5 md:p-4 rounded-2xl mb-3.5 md:mb-4 ${isDark ? 'bg-neutral-900 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
            <p className={`text-[13px] md:text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {shop.speciality}
            </p>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-2 mb-5 md:mb-6">
            {shop.isPremium && (
              <span className="px-2.5 md:px-3 py-1.5 rounded-full text-[11px] md:text-xs font-medium bg-gradient-to-r from-yellow-400/20 to-purple-500/20 text-yellow-300 border border-yellow-400/30">
                👑 Premium
              </span>
            )}
            <span className={`px-2.5 md:px-3 py-1.5 rounded-full text-[11px] md:text-xs font-medium ${isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
              <CreditCard className="h-3 w-3 inline mr-1" />
              Cards Accepted
            </span>
            <span className={`px-2.5 md:px-3 py-1.5 rounded-full text-[11px] md:text-xs font-medium ${isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
              <Car className="h-3 w-3 inline mr-1" />
              Parking Available
            </span>
          </div>

          {/* Primary Actions */}
          <div className="grid grid-cols-2 gap-2.5 md:gap-3 mb-3.5 md:mb-4">
            <button
              onClick={callShop}
              className="flex items-center justify-center gap-2 py-2.5 md:py-3 px-4 rounded-xl md:rounded-2xl text-sm md:text-base font-semibold transition-all active:scale-95 hover-bounce bg-green-600 text-white hover:bg-green-700 shadow-lg"
            >
              <Phone className="h-5 w-5" />
              Call Now
            </button>
            <button
              onClick={openInMaps}
              className="flex items-center justify-center gap-2 py-2.5 md:py-3 px-4 rounded-xl md:rounded-2xl text-sm md:text-base font-semibold transition-all active:scale-95 hover-bounce bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
            >
              <Navigation className="h-5 w-5" />
              Directions
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="grid grid-cols-4 gap-2 md:gap-3">
            <button
              onClick={() => {
                onToggleFavorite(shop.id)
                try { haptics.toggle(!isFavorite) } catch {}
              }}
              className={`flex flex-col items-center p-2.5 md:p-3 rounded-xl md:rounded-2xl transition-all duration-300 active:scale-95 hover-bounce ${
                isFavorite
                  ? 'bg-rose-100 text-rose-600 border border-rose-200'
                  : (isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200')
              }`}
            >
              <Heart className={`h-5 w-5 mb-1 ${isFavorite ? 'fill-current' : ''}`} />
              <span className="text-[11px] md:text-xs font-medium">
                {isFavorite ? 'Saved' : 'Save'}
              </span>
            </button>

            <button
              onClick={() => {
                setShowReminderMenu(true)
                try { haptics.light() } catch {}
              }}
              className={`flex flex-col items-center p-2.5 md:p-3 rounded-xl md:rounded-2xl transition-all duration-300 active:scale-95 hover-bounce ${
                hasReminder
                  ? 'bg-yellow-100 text-yellow-600 border border-yellow-200'
                  : (isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200')
              }`}
            >
              {hasReminder ? <BellRing className="h-5 w-5 mb-1" /> : <Bell className="h-5 w-5 mb-1" />}
              <span className="text-[11px] md:text-xs font-medium">Remind</span>
            </button>

            <button
              onClick={() => {
                onShowNearbyMap?.(shop)
                onClose()
                try { haptics.light() } catch {}
              }}
              className={`flex flex-col items-center p-2.5 md:p-3 rounded-xl md:rounded-2xl transition-all duration-300 active:scale-95 hover-bounce ${
                isDark ? 'bg-white/5 text-blue-400 hover:bg-white/10 border border-white/10' : 'bg-gray-100 text-blue-600 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              <Map className="h-5 w-5 mb-1" />
              <span className="text-[11px] md:text-xs font-medium">Map</span>
            </button>

            <button
              onClick={shareShop}
              className={`flex flex-col items-center p-2.5 md:p-3 rounded-xl md:rounded-2xl transition-all duration-300 active:scale-95 hover-bounce ${
                isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              <Share className="h-5 w-5 mb-1" />
              <span className="text-[11px] md:text-xs font-medium">Share</span>
            </button>
          </div>
        </div>

        {/* Reminder Menu Overlay */}
        {showReminderMenu && (
          <div className="absolute inset-0 bg-black/95 overlay-boost flex items-center justify-center p-4">
            <div
              ref={reminderMenuRef}
              className={`w-full max-w-xs rounded-3xl p-6 ${
                isDark 
                  ? 'bg-neutral-900 ring-1 ring-white/15 shadow-2xl shadow-black/40' 
                  : 'bg-white ring-1 ring-gray-200 shadow-xl shadow-black/20'
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

export default memo(ExpandedShopCard)
