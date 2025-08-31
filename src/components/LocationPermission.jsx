import { useState } from 'react'
import { LuMapPin as MapPin } from 'react-icons/lu'
import { haptics } from '../utils/haptics'

const LocationPermission = ({ isDark = false, onLocationEnabled }) => {
  const sassyMessages = [
    "Can't help if you wanna stay a mystery novel.",
    "Playing hard to get? The liquor isn't.",
    "You're basically on airplane mode IRL."
  ]
  const [currentMessageIndex, setCurrentMessageIndex] = useState(() => Math.floor(Math.random() * sassyMessages.length))

  const getRandomDifferentIndex = (prev) => {
    if (sassyMessages.length <= 1) return 0
    let next = prev
    let guard = 0
    while (next === prev && guard < 6) {
      next = Math.floor(Math.random() * sassyMessages.length)
      guard++
    }
    return next
  }

  const handleEnableLocation = async () => {
    try {
      haptics.heavy() // Heavy vibration for important permission action
    } catch {}
    
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        })
      })
      
      try {
        haptics.success() // Success pattern when location is granted
      } catch {}
      
      onLocationEnabled({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      })
    } catch {
      try {
        haptics.error() // Error pattern when denied
      } catch {}
      // On denial/failure, pick a random new message (no immediate repeats)
      setCurrentMessageIndex((prev) => getRandomDifferentIndex(prev))
    }
  }

  return (
    <div className="px-4 py-6">
      <div className={isDark 
        ? 'bg-white/10 backdrop-blur-lg ring-1 ring-white/10 rounded-2xl shadow-lg p-6 max-w-sm mx-auto text-center glass-sheen motion-sensitive' 
        : 'bg-white/25 backdrop-blur-lg ring-1 ring-white/40 rounded-2xl shadow-lg p-6 max-w-sm mx-auto text-center glass-sheen motion-sensitive'
      }>
        {/* Icon */}
        <div className={isDark 
          ? 'w-12 h-12 mx-auto mb-4 bg-rose-500/20 rounded-full flex items-center justify-center ring-1 ring-rose-400/40 animate-float motion-sensitive' 
          : 'w-12 h-12 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center ring-1 ring-purple-400/40 animate-float motion-sensitive'
        }>
          <MapPin className={isDark ? 'h-6 w-6 text-rose-400' : 'h-6 w-6 text-purple-600'} />
        </div>

        {/* Permission message (advances only on denial) */}
        <div className="mb-5" role="status" aria-live="polite" aria-atomic="true">
          <h2
            key={currentMessageIndex}
            className={isDark 
              ? 'text-base leading-snug tracking-tight font-semibold text-white mb-2 min-h-[2.25rem] flex items-center justify-center animate-fade-slide-in' 
              : 'text-base leading-snug tracking-tight font-semibold text-gray-900 mb-2 min-h-[2.25rem] flex items-center justify-center animate-fade-slide-in'
            }
          >
            {sassyMessages[currentMessageIndex]}
          </h2>
          
          {/* Subtext */}
          <p className={isDark ? 'text-gray-300 text-xs leading-relaxed' : 'text-gray-700 text-xs leading-relaxed'}>
            Turn on location so we can show you the nearest buzz spots.
          </p>
        </div>

        {/* Action button */}
        <button
          onClick={handleEnableLocation}
          aria-label="Enable location services"
          className={isDark
            ? 'w-full glass-chip-active text-white font-medium py-2.5 px-5 rounded-full transition-all duration-200 ripple ripple-white active:scale-95 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A020F0] focus-visible:ring-offset-2 focus-visible:ring-offset-black'
            : 'w-full glass-chip-active-light text-white font-medium py-2.5 px-5 rounded-full transition-all duration-200 ripple ripple-white active:scale-95 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A020F0] focus-visible:ring-offset-2 focus-visible:ring-offset-white'
          }
        >
          Enable Location
        </button>

        {/* SR-only message index for screen readers */}
        <span className="sr-only">Tip {(currentMessageIndex % sassyMessages.length) + 1} of {sassyMessages.length}</span>
        
      </div>
    </div>
  )
}

export default LocationPermission
