import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  LuMapPin as MapPin,
  LuStar as Star,
  LuHeart as Heart,
  LuBell as Bell,
  LuBellRing as BellRing,
  LuMap as Map
} from 'react-icons/lu'
import { haptics } from '../utils/haptics'

const ShopCard = ({ shop, isFavorite, onToggleFavorite, onUpdateStatus, onSetReminder, hasReminder = false, isDark = false, isLoading = false, onShowNearbyMap, activeCategory = 'all' }) => {
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

  // Format distance when available (e.g., 1.2 km or 12 km)
  const distanceText = (shop && typeof shop.distanceKm === 'number' && isFinite(shop.distanceKm))
    ? (shop.distanceKm < 10 ? `${shop.distanceKm.toFixed(1)} km` : `${Math.round(shop.distanceKm)} km`)
    : null

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

  const [showReminderMenu, setShowReminderMenu] = useState(false)
  const [mode, setMode] = useState('before_close') // 'before_close' | 'in'
  const [customBeforeMinutes, setCustomBeforeMinutes] = useState('')
  const [inHours, setInHours] = useState('')
  const [inMinutes, setInMinutes] = useState('')
  const menuRef = useRef(null)
  const buttonRef = useRef(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })

  // Segmented slider interaction (drag/keys)
  const startXRef = useRef(null)
  const handleSlideStart = (x) => { startXRef.current = x }
  const handleSlideEnd = (x) => {
    if (startXRef.current == null) return
    const dx = x - startXRef.current
    if (Math.abs(dx) > 12) setMode(dx > 0 ? 'in' : 'before_close')
    startXRef.current = null
  }

  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return
      if (!showReminderMenu) return
      // Ignore clicks inside the menu
      if (menuRef.current.contains(e.target)) return
      // Ignore clicks on the trigger button
      if (buttonRef.current && buttonRef.current.contains(e.target)) return
      setShowReminderMenu(false)
    }
    const onKey = (e) => {
      if (!showReminderMenu) return
      if (e.key === 'Escape') setShowReminderMenu(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [showReminderMenu])

  const setAndClose = (min) => {
    if (!min || isNaN(min) || min <= 0) return
    onSetReminder({ type: 'before_close', minutes: parseInt(min) })
    setCustomBeforeMinutes('')
    setShowReminderMenu(false)
    try { haptics.success() } catch {}
  }

  // 'at' mode removed

  const setInAndClose = (mins) => {
    if (!mins || isNaN(mins) || mins <= 0) return
    onSetReminder({ type: 'in', minutes: parseInt(mins) })
    setInHours('')
    setInMinutes('')
    setShowReminderMenu(false)
    try { haptics.success() } catch {}
  }

  // Get themed card styling based on active category
  const getThemedCardStyle = () => {
    if (!isDark) return 'bg-white/25 backdrop-blur-lg rounded-3xl shadow-md ring-1 ring-white/40 overflow-visible hover:shadow-lg hover:bg-white/35 transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.995] ripple ripple-white motion-sensitive'
    
    switch(activeCategory) {
      case 'all':
        return 'bg-white/5 backdrop-blur-lg rounded-3xl shadow-lg overflow-visible hover:shadow-xl hover:bg-red-500/10 transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.995] ripple ripple-white motion-sensitive ring-1 ring-red-500/20'
      case 'liquor_store':
        return 'bg-white/5 backdrop-blur-lg rounded-3xl shadow-lg overflow-visible hover:shadow-xl hover:bg-emerald-500/10 transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.995] ripple ripple-white motion-sensitive ring-1 ring-emerald-500/20'
      case 'bar':
        return 'bg-white/5 backdrop-blur-lg rounded-3xl shadow-lg overflow-visible hover:shadow-xl hover:bg-cyan-500/10 transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.995] ripple ripple-white motion-sensitive ring-1 ring-cyan-500/20'
      case 'premium':
        return 'bg-white/5 backdrop-blur-lg rounded-3xl shadow-lg overflow-visible hover:shadow-xl hover:bg-gradient-to-br hover:from-purple-500/10 hover:to-yellow-500/10 transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.995] ripple ripple-white motion-sensitive ring-1 ring-purple-500/20'
      default:
        return 'bg-white/5 backdrop-blur-lg rounded-3xl shadow-lg overflow-visible hover:shadow-xl hover:bg-white/10 transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.995] ripple ripple-white motion-sensitive'
    }
  }

  return (
    <div className={`${isLoading ? 'card-shimmer' : ''} ${getThemedCardStyle()} h-full`}>
      <div className="p-[18px] lg:p-[17px] flex flex-col h-full min-h-[176px] lg:min-h-[172px]">
        {/* Header with name and actions */}
        <div className="flex items-start justify-between mb-4">
          <h3 className={isDark ? 'text-[17px] lg:text-[16.5px] font-semibold text-white leading-tight lg-clamp-1' : 'text-[17px] lg:text-[16.5px] font-semibold text-gray-900 leading-tight lg-clamp-1'}>{shop.name}</h3>
          <div className="flex items-center gap-2 relative z-50">
            <button
              ref={buttonRef}
              onClick={() => setShowReminderMenu((s) => {
                const next = !s
                if (next && buttonRef.current) {
                  const rect = buttonRef.current.getBoundingClientRect()
                  // Position below and align right edge with button; clamp to viewport
                  const width = 256 // tailwind w-64
                  const margin = 8
                  const maxLeft = Math.max(margin, window.innerWidth - width - margin)
                  const desiredLeft = rect.right - width
                  const left = Math.min(Math.max(margin, desiredLeft), maxLeft)
                  const top = rect.bottom + 8
                  setMenuPos({ top, left })
                }
                return next
              })}
              className={isDark ? `p-2 rounded-full bg-white/5 backdrop-blur-md hover:bg-white/10 transition-colors ripple active:scale-95 transition-transform ${hasReminder ? 'text-yellow-400' : 'text-gray-400'}` : `p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors ripple active:scale-95 transition-transform ${hasReminder ? 'text-yellow-500' : 'text-gray-600'}`}
              title={hasReminder ? 'Reminder set' : 'Set reminder'}
              aria-haspopup="dialog"
              aria-expanded={showReminderMenu}
            >
              {hasReminder ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            </button>
            <button
              onClick={() => { onToggleFavorite(shop.id); try { haptics.toggle(!isFavorite) } catch {} }}
              className={isDark
                ? `p-2 rounded-full bg-white/5 backdrop-blur-md ${isFavorite ? 'text-yellow-400' : 'text-rose-400'} hover:bg-white/10 transition-colors ripple active:scale-95 transition-transform`
                : `p-2 rounded-full bg-white/20 backdrop-blur-md ${isFavorite ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-700 hover:text-red-500'} hover:bg-white/30 transition-colors ripple active:scale-95 transition-transform`}
            >
              <Heart className="h-4 w-4" />
            </button>
            {showReminderMenu && createPortal(
              (
                <div
                  ref={menuRef}
                  role="dialog"
                  aria-modal="true"
                  className={isDark
                    ? 'w-64 bg-neutral-900 rounded-3xl shadow-lg overflow-hidden p-5 border border-white/10 animate-fade-slide-in'
                    : 'w-64 bg-white rounded-3xl shadow-md border border-gray-200 overflow-hidden p-5 animate-fade-slide-in'}
                  style={{ position: 'fixed', top: `${menuPos.top}px`, left: `${menuPos.left}px`, zIndex: 9999 }}
                >
                  <span className="sr-only">Set reminder</span>

                  {/* Mode selector (segmented slider) */}
                  <div
                    role="tablist"
                    aria-label="Reminder mode slider"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'ArrowLeft') setMode('before_close'); if (e.key === 'ArrowRight') setMode('in') }}
                    onTouchStart={(e) => handleSlideStart(e.touches[0].clientX)}
                    onTouchEnd={(e) => handleSlideEnd(e.changedTouches[0].clientX)}
                    onMouseDown={(e) => handleSlideStart(e.clientX)}
                    onMouseUp={(e) => handleSlideEnd(e.clientX)}
                    className={isDark
                      ? 'relative grid grid-cols-2 items-center mb-2 p-1 rounded-full bg-neutral-800 border border-white/10'
                      : 'relative grid grid-cols-2 items-center mb-2 p-1 rounded-full bg-gray-100 border border-gray-200'}
                  >
                    <div
                      className={isDark ? 'absolute top-1 bottom-1 rounded-full bg-neutral-700 transition-all' : 'absolute top-1 bottom-1 rounded-full bg-white shadow transition-all'}
                      style={{ left: mode === 'before_close' ? '4px' : 'calc(50% + 4px)', width: 'calc(50% - 8px)' }}
                      aria-hidden="true"
                    />
                    <button
                      onClick={() => setMode('before_close')}
                      aria-pressed={mode === 'before_close'}
                      className={isDark ? 'relative z-10 px-3 py-1.5 rounded-full text-xs font-medium text-gray-200 hover:text-white transition-colors ripple ripple-rose active:scale-95' : 'relative z-10 px-3 py-1.5 rounded-full text-xs font-medium text-gray-800 hover:text-gray-900 transition-colors ripple ripple-rose active:scale-95'}
                    >
                      Before close
                    </button>
                    <button
                      onClick={() => setMode('in')}
                      aria-pressed={mode === 'in'}
                      className={isDark ? 'relative z-10 px-3 py-1.5 rounded-full text-xs font-medium text-gray-200 hover:text-white transition-colors ripple ripple-rose active:scale-95' : 'relative z-10 px-3 py-1.5 rounded-full text-xs font-medium text-gray-800 hover:text-gray-900 transition-colors ripple ripple-rose active:scale-95'}
                    >
                      In
                    </button>
                  </div>

                  {/* Before close mode */}
                  {mode === 'before_close' && (
                    <>
                      <div className="flex items-center gap-2">
                        {[
                          { label: '45m', value: 45 },
                          { label: '1h', value: 60 },
                          { label: '2h', value: 120 },
                          { label: '3h', value: 180 },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setAndClose(opt.value)}
                            className={isDark
                              ? 'px-3 py-1.5 rounded-full bg-neutral-800 text-xs text-gray-100 border border-white/10 hover:bg-neutral-700 transition-colors transition-transform ripple ripple-rose active:scale-95'
                              : 'px-3 py-1.5 rounded-full bg-gray-100 text-xs text-gray-800 border border-gray-300 hover:bg-gray-200 transition-colors transition-transform ripple ripple-rose active:scale-95'}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={240}
                          value={customBeforeMinutes}
                          onChange={(e) => setCustomBeforeMinutes(e.target.value)}
                          placeholder="Custom (min)"
                          className={isDark
                            ? 'flex-1 px-3.5 py-1.5 rounded-full bg-neutral-800 text-sm text-white placeholder-gray-400 border border-white/10 focus:outline-none focus:bg-neutral-700'
                            : 'flex-1 px-3.5 py-1.5 rounded-full bg-white text-sm text-gray-900 placeholder-gray-500 border border-gray-300 focus:outline-none focus:bg-gray-50'}
                        />
                        <button
                          onClick={() => setAndClose(parseInt(customBeforeMinutes))}
                          disabled={!customBeforeMinutes || parseInt(customBeforeMinutes) <= 0}
                          className={isDark
                            ? 'px-4 py-1.5 rounded-full bg-rose-500 text-white text-sm font-semibold shadow-lg shadow-rose-900/30 ring-2 ring-rose-400/60 ring-offset-2 ring-offset-neutral-900 hover:bg-rose-600 transition-colors ripple ripple-rose active:scale-95 disabled:opacity-50 disabled:hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-2'
                            : 'px-4 py-1.5 rounded-full bg-purple-700 text-white text-sm font-semibold shadow-lg shadow-purple-900/20 ring-2 ring-purple-600/50 ring-offset-2 ring-offset-white hover:bg-purple-800 transition-colors ripple ripple-rose active:scale-95 disabled:opacity-50 disabled:hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2'}
                        >
                          Set
                        </button>
                      </div>
                    </>
                  )}

                  {/* 'At' mode removed */}

                  {/* In duration mode */}
                  {mode === 'in' && (
                    <>
                      <div className="flex items-center gap-2">
                        {[{ label: '1h', value: 60 }, { label: '2h', value: 120 }, { label: '3h', value: 180 }].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setInAndClose(opt.value)}
                            className={isDark
                              ? 'px-3 py-1.5 rounded-full bg-neutral-800 text-xs text-gray-100 border border-white/10 hover:bg-neutral-700 transition-colors transition-transform ripple ripple-rose active:scale-95'
                              : 'px-3 py-1.5 rounded-full bg-gray-100 text-xs text-gray-800 border border-gray-300 hover:bg-gray-200 transition-colors transition-transform ripple ripple-rose active:scale-95'}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={12}
                          value={inHours}
                          onChange={(e) => setInHours(e.target.value)}
                          placeholder="hrs"
                          className={isDark
                            ? 'w-16 text-center px-3 py-1.5 rounded-full bg-neutral-800 text-sm text-white placeholder-gray-400 border border-white/10 focus:outline-none focus:bg-neutral-700'
                            : 'w-16 text-center px-3 py-1.5 rounded-full bg-white text-sm text-gray-900 placeholder-gray-500 border border-gray-300 focus:outline-none focus:bg-gray-50'}
                        />
                        <input
                          type="number"
                          min={0}
                          max={59}
                          value={inMinutes}
                          onChange={(e) => setInMinutes(e.target.value)}
                          placeholder="min"
                          className={isDark
                            ? 'w-16 text-center px-3 py-1.5 rounded-full bg-neutral-800 text-sm text-white placeholder-gray-400 border border-white/10 focus:outline-none focus:bg-neutral-700'
                            : 'w-16 text-center px-3 py-1.5 rounded-full bg-white text-sm text-gray-900 placeholder-gray-500 border border-gray-300 focus:outline-none focus:bg-gray-50'}
                        />
                        <button
                          onClick={() => {
                            const h = parseInt(inHours || 0)
                            const m = parseInt(inMinutes || 0)
                            const total = (isNaN(h) ? 0 : h * 60) + (isNaN(m) ? 0 : m)
                            setInAndClose(total)
                          }}
                          disabled={((parseInt(inHours || 0) || 0) * 60 + (parseInt(inMinutes || 0) || 0)) <= 0}
                          className={isDark
                            ? 'px-4 py-1.5 rounded-full bg-rose-500 text-white text-sm font-semibold shadow-lg shadow-rose-900/30 ring-2 ring-rose-400/60 ring-offset-2 ring-offset-neutral-900 hover:bg-rose-600 transition-colors ripple ripple-rose active:scale-95 disabled:opacity-50 disabled:hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-2'
                            : 'px-4 py-1.5 rounded-full bg-purple-700 text-white text-sm font-semibold shadow-lg shadow-purple-900/20 ring-2 ring-purple-600/50 ring-offset-2 ring-offset-white hover:bg-purple-800 transition-colors ripple ripple-rose active:scale-95 disabled:opacity-50 disabled:hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2'}
                        >
                          Set
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ),
              document.body
            )}

          </div>
        </div>

        {/* Status and type */}
        <div className="flex items-center space-x-3 mb-3">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              shop.userReported === 'closed' || !isOpen() 
                ? (isDark ? 'bg-rose-600/70 text-white' : 'bg-red-600/70 text-white') 
                : (isDark ? 'bg-green-600/70 text-white' : 'bg-green-600/70 text-white')
            }`}>
              {getStatusText()}
            </span>
            <button
              onClick={() => onShowNearbyMap && onShowNearbyMap(shop)}
              className={isDark 
                ? 'p-1.5 rounded-full bg-white/5 backdrop-blur-md text-blue-400 hover:bg-white/10 transition-colors ripple active:scale-95'
                : 'p-1.5 rounded-full bg-white/20 backdrop-blur-md text-blue-600 hover:bg-white/30 transition-colors ripple active:scale-95'}
              title="Show nearby liquor stores & bars"
            >
              <Map className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className={isDark ? 'text-xs text-gray-400' : 'text-xs text-gray-600'}>
            {shop.type === 'liquor_store' ? 'Liquor Store' : 'Bar'}
          </span>
        </div>

        {/* Location and rating */}
        <div className={isDark ? 'flex items-center space-x-3 text-[13px] lg:text-[12.5px] text-gray-300 mb-3' : 'flex items-center space-x-3 text-[13px] lg:text-[12.5px] text-gray-600 mb-3'}>
          <div className="flex items-center gap-1.5">
            <MapPin className={isDark ? 'h-4 w-4 text-rose-400' : 'h-4 w-4 text-purple-600'} />
            <span className="font-medium">{shop.area}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-yellow-400" />
            <span className="font-medium">{shop.rating}</span>
          </div>
          {distanceText && (
            <span
              title="Distance from you"
              className={isDark
                ? 'px-2 py-0.5 rounded-md border border-white/15 text-gray-200 text-[10px] tracking-wide font-light'
                : 'px-2 py-0.5 rounded-md border border-gray-300 text-gray-700 text-[10px] tracking-wide font-light'}
            >
              {distanceText}
            </span>
          )}
          <span className={isDark ? 'px-2 py-0.5 rounded-md border border-white/15 text-gray-200 uppercase tracking-wide text-[10px] font-light' : 'px-2 py-0.5 rounded-md border border-gray-300 text-gray-700 uppercase tracking-wide text-[10px] font-light'}>{shop.priceRange}</span>
        </div>

        {/* Address */}
        <p className={isDark ? 'text-[13px] lg:text-[12.5px] text-gray-300 mb-2.5 leading-snug lg-clamp-2' : 'text-[13px] lg:text-[12.5px] text-gray-700 mb-2.5 leading-snug lg-clamp-2'}>{shop.address}</p>

        {/* Speciality */}
        <p className={isDark ? 'text-[11px] lg:text-[10.5px] text-gray-400 leading-snug lg-clamp-1' : 'text-[11px] lg:text-[10.5px] text-gray-600 leading-snug lg-clamp-1'}>{shop.speciality}</p>
      </div>
    </div>
  )
}

export default ShopCard
