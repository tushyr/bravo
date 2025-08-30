import { useRef } from 'react'
import { LuSearch as Search, LuMapPin as MapPin } from 'react-icons/lu'

const SearchBar = ({ searchQuery, setSearchQuery, isDark = false, onNearMe, onNearMeLongPress, isNearMeActive = false }) => {
  const longPressTimeoutRef = useRef(null)
  const longPressTriggeredRef = useRef(false)

  const startLongPress = () => {
    longPressTriggeredRef.current = false
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current)
    longPressTimeoutRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true
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
          <Search className={isDark ? 'h-4 w-4 text-rose-400 ml-1 mr-2.5' : 'h-4 w-4 text-purple-600 ml-1 mr-2.5'} />
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
                ? 'ml-2 bg-rose-500/20 backdrop-blur-md border border-rose-400/50 text-rose-300 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs shadow-md glow-rose transition-all duration-500 ease-out whitespace-nowrap'
                : 'ml-2 bg-purple-500/15 backdrop-blur-md border border-purple-400/50 text-purple-700 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs shadow-md transition-all duration-500 ease-out whitespace-nowrap')
            : (isDark
                ? 'ml-2 border border-rose-500/40 text-rose-400 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs hover:bg-rose-500/10 transition-all duration-300 ease-out glow-rose ripple ripple-rose active:scale-95 motion-sensitive whitespace-nowrap'
                : 'ml-2 border border-purple-500/40 text-purple-700 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs hover:bg-purple-50 transition-all duration-300 ease-out glow-rose ripple ripple-rose active:scale-95 motion-sensitive whitespace-nowrap')}>
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
