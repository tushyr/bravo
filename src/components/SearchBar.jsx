import { useRef } from 'react'
import { LuSearch as Search, LuMapPin as MapPin } from 'react-icons/lu'
import { haptics } from '../utils/haptics'

const SearchBar = ({ searchQuery, setSearchQuery, isDark = false, onNearMe, onNearMeLongPress, isNearMeActive = false }) => {
  const longPressTimeoutRef = useRef(null)
  const longPressTriggeredRef = useRef(false)

  const startLongPress = () => {
    longPressTriggeredRef.current = false
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current)
    longPressTimeoutRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true
      try {
        haptics.impact('heavy') // Heavy intensity for long press (opens modal)
      } catch {}
      onNearMeLongPress && onNearMeLongPress()
    }, 500)
  }

  const cancelLongPress = () => {
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current)
  }

  return (
    <div className="px-4 py-3">
      <div className={isDark ? 'flex items-center bg-white/8 backdrop-blur-md ring-1 ring-white/20 rounded-2xl px-3 py-2 shadow-md' : 'flex items-center bg-white/70 backdrop-blur-md ring-1 ring-gray-200 rounded-2xl px-3 py-2 shadow-sm'}>
        <div className="flex-1 flex items-center">
          <Search className={isDark ? 'h-4 w-4 text-neon-purple ml-1 mr-2.5' : 'h-4 w-4 text-neon-purple ml-1 mr-2.5'} />
          <input
            type="text"
            placeholder="Search shops, bars, or areas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={isDark ? 'flex-1 bg-transparent text-gray-100 placeholder-gray-400 focus:outline-none py-1.5 text-sm' : 'flex-1 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none py-1.5 text-sm'}
          />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            if (!longPressTriggeredRef.current) {
              try {
                haptics.impact('medium') // Medium intensity for Near Me action
              } catch {}
              onNearMe && onNearMe()
            }
            longPressTriggeredRef.current = false
          }}
          onPointerDown={startLongPress}
          onPointerUp={cancelLongPress}
          onPointerLeave={cancelLongPress}
          onPointerCancel={cancelLongPress}
          className={isNearMeActive
            ? (isDark
                ? 'ml-2 rounded-full px-3 py-1.5 text-xs inline-flex items-center gap-1.5 glass-chip-active text-white transition-all duration-300 ease-out ripple ripple-white active:scale-95 whitespace-nowrap'
                : 'ml-2 rounded-full px-3 py-1.5 text-xs inline-flex items-center gap-1.5 glass-chip-active-light text-white transition-all duration-300 ease-out ripple ripple-white active:scale-95 whitespace-nowrap')
            : (isDark
                ? 'ml-2 rounded-full px-3 py-1.5 text-xs inline-flex items-center gap-1.5 glass-chip text-gray-200 transition-all duration-300 ease-out ripple ripple-white active:scale-95 motion-sensitive whitespace-nowrap'
                : 'ml-2 rounded-full px-3 py-1.5 text-xs inline-flex items-center gap-1.5 glass-chip-light text-gray-800 transition-all duration-300 ease-out ripple ripple-white active:scale-95 motion-sensitive whitespace-nowrap')}>
          <MapPin className="h-4 w-4" />
          <span className="inline-flex items-center whitespace-nowrap">
            <span>Near</span>
            <span className="ml-1 inline-block w-8 text-left relative">
              <span className={`transition-opacity duration-300 ease-out ${isNearMeActive ? 'opacity-0' : 'opacity-100'}`}>Me</span>
              <span className={`absolute top-0 left-0 transition-opacity duration-300 ease-out tabular-nums ${isNearMeActive ? 'opacity-100' : 'opacity-0'}`}>8km</span>
            </span>
          </span>
        </button>
      </div>
    </div>
  )
}

export default SearchBar
