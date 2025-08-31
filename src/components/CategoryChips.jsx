import { useState, useEffect, useRef } from 'react'
import { LuClock as Clock, LuMap as Map, LuHeart as Heart } from 'react-icons/lu'
import { haptics } from '../utils/haptics'

const CategoryChips = ({ activeCategory, setActiveCategory, openNowFilter, setOpenNowFilter, onShowCityMap, isDark = false, distanceRadiusKm, setDistanceRadiusKm, bindOpenRadiusModal, maskDistanceSelection = false, favoritesOnly = false, setFavoritesOnly }) => {
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'liquor_store', label: '🏪 Shops' },
    { id: 'bar', label: '🍺 Bars' },
    { id: 'premium', label: '👑 Premium' }
  ]

  // Distance slider bounds tuned for Delhi NCR coverage
  const MIN_RADIUS_KM = 0.5
  const MAX_RADIUS_KM = 150

  // Bottom sheet state for custom radius
  const [showRadiusSheet, setShowRadiusSheet] = useState(false)
  const [tempRadius, setTempRadius] = useState(distanceRadiusKm || 10)
  // Track previous slider value to modulate haptic intensity while sliding
  const sliderPrevRef = useRef(distanceRadiusKm || 10)

  // When maskDistanceSelection is true, do not highlight any distance chip in the UI
  const showDistanceSelection = !maskDistanceSelection
  const uiDistance = showDistanceSelection ? distanceRadiusKm : undefined
  const isCustomSelected = showDistanceSelection && typeof distanceRadiusKm === 'number' && ![5, 10, 50].includes(distanceRadiusKm)
  const isAnySelected = showDistanceSelection && (distanceRadiusKm == null)

  // Dynamic noun for modal text based on current category
  const nounMap = {
    all: 'places',
    liquor_store: 'shops',
    bar: 'bars',
    premium: 'premium places',
  }
  const currentNoun = nounMap[activeCategory] || 'places'

  // Allow parent to open the radius modal, syncing temp to current distance
  useEffect(() => {
    if (typeof bindOpenRadiusModal === 'function') {
      bindOpenRadiusModal(() => {
        setTempRadius(distanceRadiusKm || 10)
        sliderPrevRef.current = distanceRadiusKm || 10
        setShowRadiusSheet(true)
      })
    }
  }, [bindOpenRadiusModal, distanceRadiusKm])

  // Lock body scroll and add ESC-to-close while modal is open
  useEffect(() => {
    if (!showRadiusSheet) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') setShowRadiusSheet(false) }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [showRadiusSheet])

  return (
    <div className="px-4 py-3">
      {/* Open Now Button & City Map */}
      <div className="mb-3 flex flex-wrap items-center gap-2 lg:gap-3">
        <button
          onClick={() => {
            const next = !openNowFilter
            setOpenNowFilter(next)
            try { haptics.toggle(next) } catch {}
          }}
          className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ripple ripple-white active:scale-95 ${
            openNowFilter
              ? 'glass-chip-active-success text-white'
              : (isDark
                  ? 'glass-chip text-gray-200'
                  : 'glass-chip-light text-gray-800')
          }`}
        >
          <Clock className={`h-4 w-4 mr-2 ${openNowFilter ? 'text-white' : (isDark ? 'text-gray-300' : 'text-gray-600')}`} />
          Open Now
        </button>
        
        <button
          onClick={() => {
            try {
              haptics.light() // Light haptic for map view
            } catch {}
            onShowCityMap && onShowCityMap()
          }}
          className={isDark
            ? 'inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-medium glass-chip text-blue-300 transition-all ripple ripple-white active:scale-95'
            : 'inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-medium glass-chip-light text-blue-600 transition-all ripple ripple-white active:scale-95'}
          title="View city map with all locations"
        >
          <Map className="h-4 w-4 mr-2" />
          City Map
        </button>
        <button
          onClick={() => {
            if (!setFavoritesOnly) return
            const next = !favoritesOnly
            setFavoritesOnly(next)
            try { haptics.toggle(next) } catch {}
          }}
          className={isDark
            ? `inline-flex items-center px-2.5 py-1.5 rounded-full text-sm font-medium ${favoritesOnly ? 'glass-chip-active text-white' : 'glass-chip text-gray-200'} transition-all ripple ripple-white active:scale-95`
            : `inline-flex items-center px-2.5 py-1.5 rounded-full text-sm font-medium ${favoritesOnly ? 'glass-chip-active-light text-white' : 'glass-chip-light text-gray-800'} transition-all ripple ripple-white active:scale-95`}
          title={favoritesOnly ? 'Showing favorites' : 'Show favorites only'}
          aria-pressed={favoritesOnly}
        >
          <Heart className={`h-4 w-4 ${favoritesOnly ? '' : (isDark ? 'text-gray-300' : 'text-gray-600')}`} />
          <span className="sr-only">Favorites</span>
        </button>
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap px-1 py-1 overscroll-contain lg:flex-wrap lg:whitespace-normal lg:overflow-visible">
        {categories.map((category, index) => (
          <button
            key={category.id}
            onClick={() => { try { haptics.selection() } catch {}; setActiveCategory(category.id) }}
            className={`px-3.5 py-1.5 lg:px-4 lg:py-2 rounded-full text-[13px] lg:text-sm font-poppins font-semibold whitespace-nowrap transition-all duration-300 ease-out ripple active:scale-95 ${
              activeCategory === category.id
                ? (isDark
                    ? 'glass-chip-active text-white'
                    : 'glass-chip-active-light text-white')
                : (isDark
                    ? 'glass-chip text-gray-200'
                    : 'glass-chip-light text-gray-800')
            }`}
            style={{
              transitionDelay: `${index * 50}ms`,
              animationDelay: `${index * 100}ms`
            }}
          >
            <span className="relative z-10">{category.label}</span>
          </button>
        ))}
      </div>

      {/* Distance Chips */}
      <div className="mt-3">
        <div className={isDark ? 'text-gray-300 text-xs mb-2 font-poppins font-semibold tracking-wide' : 'text-gray-800 text-xs mb-2 font-poppins font-semibold tracking-wide'}>Distance</div>
        <div className="flex flex-wrap items-center gap-1.5 lg:gap-2">
          {/* Any (disable proximity) */}
          {(() => {
            const selected = isAnySelected
            const common = 'px-3 py-1.5 text-xs lg:px-3.5 lg:py-1.5 lg:text-[13px] rounded-full transition-all duration-300 ease-out font-poppins font-medium ripple active:scale-95'
            const cls = selected
              ? (isDark
                  ? `glass-chip-active text-white ${common}`
                  : `glass-chip-active-light text-white ${common}`)
              : (isDark
                  ? `glass-chip text-gray-200 ${common}`
                  : `glass-chip-light text-gray-800 ${common}`)
            return (
              <button
                key="any"
                onClick={() => { try { haptics.selection() } catch {}; setDistanceRadiusKm && setDistanceRadiusKm(null) }}
                aria-pressed={selected}
                className={cls}
              >
                Any
              </button>
            )
          })()}

          {/* Preset distances */}
          {[5, 10, 50].map((km, index) => {
            const selected = (showDistanceSelection && distanceRadiusKm === km) || (maskDistanceSelection && distanceRadiusKm === km)
            const common = 'px-3 py-1.5 text-xs lg:px-3.5 lg:py-1.5 lg:text-[13px] rounded-full transition-all duration-300 ease-out font-poppins font-medium ripple active:scale-95'
            const cls = selected
              ? (isDark
                  ? `glass-chip-active text-white ${common}`
                  : `glass-chip-active-light text-white ${common}`)
              : (isDark
                  ? `glass-chip text-gray-200 ${common}`
                  : `glass-chip-light text-gray-800 ${common}`)
            return (
              <button
                key={km}
                onClick={() => { try { haptics.selection() } catch {}; setDistanceRadiusKm && setDistanceRadiusKm(km) }}
                aria-pressed={selected}
                className={cls}
                style={{
                  transitionDelay: `${(index + 1) * 75}ms`
                }}
              >
                {km} km
              </button>
            )
          })}

          {/* Custom radius button */}
          {(() => {
            const selected = isCustomSelected
            const common = 'px-3 py-1.5 text-xs lg:px-3.5 lg:py-1.5 lg:text-[13px] rounded-full transition-all duration-300 ease-out font-poppins font-medium ripple active:scale-95'
            const cls = selected
              ? (isDark
                  ? `glass-chip-active text-white ${common}`
                  : `glass-chip-active-light text-white ${common}`)
              : (isDark
                  ? `glass-chip text-gray-200 ${common}`
                  : `glass-chip-light text-gray-800 ${common}`)
            return (
              <button
                key="custom"
                onClick={() => {
                  setTempRadius(distanceRadiusKm || 10)
                  sliderPrevRef.current = distanceRadiusKm || 10
                  setShowRadiusSheet(true)
                  try { haptics.light() } catch {}
                }}
                aria-pressed={selected}
                className={cls}
              >
                {selected ? `${distanceRadiusKm} km` : 'Custom'}
              </button>
            )
          })()}
        </div>
      </div>

      {/* Distance Modal: compact centered card */}
      {showRadiusSheet && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowRadiusSheet(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Set distance radius"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={isDark
              ? 'w-64 bg-neutral-900 rounded-2xl shadow-lg overflow-hidden p-4 border border-white/10 animate-fade-slide-in overscroll-contain'
              : 'w-64 bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden p-4 animate-fade-slide-in overscroll-contain'}
          >
            {/* Header */}
            <div className="text-center mb-3">
              <h3 className={isDark ? 'text-white text-sm font-semibold' : 'text-gray-900 text-sm font-semibold'}>
                Set Distance Radius
              </h3>
              <p className={isDark ? 'text-gray-400 text-xs mt-0.5' : 'text-gray-600 text-xs mt-0.5'}>
                Show {currentNoun} within {tempRadius} km
              </p>
            </div>

            {/* Slider */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="range"
                  min={MIN_RADIUS_KM}
                  max={MAX_RADIUS_KM}
                  step="0.5"
                  value={tempRadius}
                  onChange={(e) => setTempRadius(parseFloat(e.target.value))}
                  onInput={(e) => {
                    const v = parseFloat(e.target.value)
                    setTempRadius(v)
                    try {
                      const prev = sliderPrevRef.current ?? v
                      // Heavy when crossing tens, medium on integer km steps, light for minor steps
                      if (Math.floor(v / 10) !== Math.floor(prev / 10)) {
                        haptics.impact('heavy')
                      } else if (Math.floor(v) !== Math.floor(prev)) {
                        haptics.impact('medium')
                      } else {
                        haptics.light()
                      }
                      sliderPrevRef.current = v
                    } catch {}
                  }}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDark ? 'bg-gray-700 slider-thumb-dark' : 'bg-gray-200 slider-thumb-light'}`}
                  style={{ touchAction: 'pan-x' }}
                />
                {/* Range labels */}
                <div className="flex justify-between text-[11px] mt-2">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{MIN_RADIUS_KM} km</span>
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{MAX_RADIUS_KM} km</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowRadiusSheet(false) }}
                className={isDark
                  ? 'flex-1 py-2 px-3 bg-white/10 text-gray-200 rounded-xl text-sm font-medium transition-colors hover:bg-white/20'
                  : 'flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium transition-colors hover:bg-gray-200'}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setDistanceRadiusKm && setDistanceRadiusKm(tempRadius)
                  setShowRadiusSheet(false)
                  try { haptics.success() } catch {}
                }}
                className={isDark
                  ? 'flex-1 py-2 px-3 bg-rose-600 text-white rounded-xl text-sm font-medium transition-colors hover:bg-rose-700'
                  : 'flex-1 py-2 px-3 bg-purple-600 text-white rounded-xl text-sm font-medium transition-colors hover:bg-purple-700'}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryChips
