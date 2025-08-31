import { useState, useEffect, useRef } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import CategoryChips from './components/CategoryChips'
import ShopCard from './components/ShopCard'
import SkeletonCard from './components/SkeletonCard'
import LocationPermission from './components/LocationPermission'
import NearbyMap from './components/NearbyMap'
import CityMap from './components/CityMap'
import { mockShops } from './data/mockData'
import { initHaptics } from './utils/haptics'

function App() {
  const [shops, setShops] = useState([])
  const [filteredShops, setFilteredShops] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [openNowFilter, setOpenNowFilter] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasLocationPermission, setHasLocationPermission] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [distanceRadiusKm, setDistanceRadiusKm] = useState(null)
  const [maskDistanceSelection, setMaskDistanceSelection] = useState(false)
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites')
    return saved ? JSON.parse(saved) : []
  })
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notifications')
    const parsed = saved ? JSON.parse(saved) : []
    // Ensure a read flag exists for each notification
    return Array.isArray(parsed) ? parsed.map(n => ({ ...n, read: !!n.read })) : []
  })
  
  const [reminders, setReminders] = useState(() => {
    const saved = localStorage.getItem('reminders')
    return saved ? JSON.parse(saved) : []
  })
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationsEnabled')
    return saved ? JSON.parse(saved) : false
  })
  const [showNearbyMap, setShowNearbyMap] = useState(false)
  const [mapCenterShop, setMapCenterShop] = useState(null)
  const [showCityMap, setShowCityMap] = useState(false)
  const openRadiusModalRef = useRef(null)

  const bindOpenRadiusModal = (fn) => {
    openRadiusModalRef.current = fn
  }

  // Dark mode forced globally (pure black with reddish tint)
  const isDark = true

  useEffect(() => {
    try { initHaptics() } catch {}
  }, [])

  // Witty empty-state messages for no results
  const genericEmptyMessages = [
    "No booze in sight. Dry day vibes?",
    "Looks like a desert out here. 🍃",
    "No stores close enough to clink glasses.",
    "This area needs some spirit. Literally.",
    "No shops around… time to BYOB?",
    "Empty streets, empty shelves, empty hopes.",
    "Closest booze is miles away. Road trip?",
    "You’re in the Bermuda Triangle of liquor.",
    "No nearby shops. Move a bit and retry.",
    "It’s just you, me, and sobriety here."
  ]

  // Bar-specific empty-state messages
  const barEmptyMessages = [
    "All bars ghosted you. Tough night.",
    "Bars? Closed. Your liver just sighed in relief.",
    "No bars open. Go hydrate, king/queen.",
    "Every bar said ‘nah fam, not tonight.’",
    "Looks like it’s just you and your fridge.",
    "Bars are sleeping. Unlike your demons.",
    "No bars around. Time to romanticize loneliness.",
    "Bars are closed. Guess it’s self-care night.",
    "No bars. Your therapist would be proud.",
    "City said no bars. Universe said heal."
  ]

  // Premium-specific empty-state messages
  const premiumEmptyMessages = [
    "Premium spots said ‘members only’.",
    "No premium pours nearby. Your black card can rest.",
    "Velvet ropes, nowhere in sight.",
    "No invite-only vibes here. Yet.",
    "Sommelier? Missing. So is the caviar.",
    "Champagne drought. Stay sparkling anyway.",
    "No premium joints. Your driver gets the night off.",
    "Concierge says: try another area.",
    "Not on the list. Not in this radius.",
    "Valet’s gone home. So have the premiums."
  ]

  const activeEmptyMessages =
    activeCategory === 'premium'
      ? premiumEmptyMessages
      : (activeCategory === 'bar' ? barEmptyMessages : genericEmptyMessages)

  const [emptyMsgIndex, setEmptyMsgIndex] = useState(() => Math.floor(Math.random() * genericEmptyMessages.length))
  const prevEmptyRef = useRef(false)

  const getRandomDifferentIndex = (prev, len) => {
    if (len <= 1) return 0
    let next = prev
    let guard = 0
    while (next === prev && guard < 6) {
      next = Math.floor(Math.random() * len)
      guard++
    }
    return next
  }

  // Check for existing location permission on app start
  useEffect(() => {
    let permStatus
    const checkLocationPermission = async () => {
      try {
        // Safeguard for environments without Permissions API or geolocation
        if (!('geolocation' in navigator)) {
          setHasLocationPermission(false)
          setIsLoading(false)
          return
        }

        if (!('permissions' in navigator)) {
          // Fallback path: remember last successful grant in localStorage
          const wasGranted = localStorage.getItem('geoPermissionGranted') === 'true'
          if (wasGranted) {
            setHasLocationPermission(true)
            loadShopsData()
            navigator.geolocation.getCurrentPosition(
              (position) => {
                setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
                setDistanceRadiusKm(null)
              },
              (err) => {
                // If permission is denied now, revert and show prompt
                if (err && err.code === 1 /* PERMISSION_DENIED */) {
                  localStorage.setItem('geoPermissionGranted', 'false')
                  setHasLocationPermission(false)
                  setIsLoading(false)
                }
              },
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
            )
          } else {
            setHasLocationPermission(false)
            setIsLoading(false)
          }
          return
        }

        permStatus = await navigator.permissions.query({ name: 'geolocation' })

        const handlePermissionState = (state) => {
          if (state === 'granted') {
            // Immediately consider permission granted so we don't show the prompt
            setHasLocationPermission(true)
            try { localStorage.setItem('geoPermissionGranted', 'true') } catch {}
            // Load data right away; we'll enhance with distance when we get coords
            loadShopsData()

            // Try to fetch current position with a bounded timeout
            const timer = setTimeout(() => { /* fail-safe: don't block UI */ }, 10000)
            navigator.geolocation.getCurrentPosition(
              (position) => {
                clearTimeout(timer)
                setUserLocation({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                })
                setDistanceRadiusKm(null)
              },
              () => {
                clearTimeout(timer)
                // Keep permission as granted; just no position available
              },
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
            )
          } else if (state === 'prompt') {
            // Not decided yet: show the in-app prompt
            setHasLocationPermission(false)
            setIsLoading(false)
          } else {
            // denied
            setHasLocationPermission(false)
            setIsLoading(false)
            try { localStorage.setItem('geoPermissionGranted', 'false') } catch {}
          }
        }

        handlePermissionState(permStatus.state)
        permStatus.onchange = () => handlePermissionState(permStatus.state)
      } catch (error) {
        // Fallback for browsers where query throws
        setHasLocationPermission(false)
        setIsLoading(false)
      }
    }
    checkLocationPermission()
    return () => {
      if (permStatus) permStatus.onchange = null
    }
  }, [])

  // Load shops data (try API, fallback to mock)
  const loadShopsData = async () => {
    setIsLoading(true)
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 6000)
    try {
      const res = await fetch('/api/shops', { signal: controller.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const incoming = Array.isArray(data?.shops) ? data.shops : []
      setShops(incoming.length ? incoming : mockShops)
    } catch (e) {
      // Fallback to local mock data on any failure
      setShops(mockShops)
    } finally {
      clearTimeout(t)
      setIsLoading(false)
    }
  }

  // Handle location permission granted
  const handleLocationEnabled = (location) => {
    setUserLocation(location)
    setHasLocationPermission(true)
    setDistanceRadiusKm(null)
    try { localStorage.setItem('geoPermissionGranted', 'true') } catch {}
    loadShopsData()
  }

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    localStorage.setItem('reminders', JSON.stringify(reminders))
  }, [reminders])

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications))
  }, [notifications])

  // Request notification permission on app start
  useEffect(() => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [notificationsEnabled])

  // Helpers for reminder scheduling
  const roundToMinute = (d) => {
    const x = new Date(d)
    x.setSeconds(0, 0)
    return x
  }

  const computeDueAtForBeforeClose = (shop, offsetMinutes) => {
    if (!shop || isNaN(offsetMinutes)) return null
    const now = new Date()
    const [ch, cm] = shop.closeTime.split(':').map(Number)
    const due = new Date(now)
    due.setHours(ch, cm, 0, 0)
    due.setMinutes(due.getMinutes() - parseInt(offsetMinutes))
    if (due <= now) due.setDate(due.getDate() + 1)
    return roundToMinute(due)
  }

  const computeDueAtForAtTime = (timeStr) => {
    if (!timeStr || !timeStr.includes(':')) return null
    const now = new Date()
    const [h, m] = timeStr.split(':').map(Number)
    const due = new Date(now)
    due.setHours(h, m, 0, 0)
    if (due <= now) due.setDate(due.getDate() + 1)
    return roundToMinute(due)
  }

  const computeDueAtForIn = (minutes) => {
    if (!minutes || isNaN(minutes)) return null
    return roundToMinute(new Date(Date.now() + parseInt(minutes) * 60000))
  }

  // Distance helpers (Haversine)
  const toRad = (x) => (x * Math.PI) / 180
  const haversineKm = (a, b) => {
    if (!a || !b) return Number.POSITIVE_INFINITY
    const R = 6371
    const dLat = toRad(b.lat - a.lat)
    const dLng = toRad(b.lng - a.lng)
    const lat1 = toRad(a.lat)
    const lat2 = toRad(b.lat)
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
  }

  useEffect(() => {
    localStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled))
  }, [notificationsEnabled])

  // Check reminders every minute (aligned to minute boundary) using dueAt when present
  useEffect(() => {
    const checkReminders = () => {
      if (!notificationsEnabled) return
      const now = new Date()

      reminders.forEach(reminder => {
        if (reminder.triggered) return
        const shop = shops.find(s => s.id === reminder.shopId)
        if (!shop) return

        // Back-compat: old reminders without dueAt use minutes-before-close
        let dueAt = reminder.dueAt ? new Date(reminder.dueAt) : null
        if (!dueAt && typeof reminder.minutes === 'number') {
          dueAt = computeDueAtForBeforeClose(shop, reminder.minutes)
        }
        if (!dueAt) return

        if (Math.abs(now - dueAt) <= 60000) {
          let notificationText = `Reminder for ${shop.name}`
          const kind = reminder.kind
          if (kind === 'before_close' || (!kind && typeof reminder.minutes === 'number')) {
            const mins = reminder?.config?.minutes ?? reminder.minutes
            notificationText = `${shop.name} closes in ${mins} minutes!`
          } else if (kind === 'at') {
            const t = dueAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            notificationText = `It's ${t} — reminder for ${shop.name}`
          }

          setNotifications(prev => {
            const exists = prev.some(n => n.text === notificationText && n.shopId === shop.id)
            if (exists) return prev
            return [{ id: Date.now(), text: notificationText, shopId: shop.id, timestamp: now.toISOString(), read: false }, ...prev]
          })

          if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('ThekaBar Reminder', { body: notificationText, icon: '/tb_tab.png' })
          }

          setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, triggered: true } : r))
        }
      })
    }

    let intervalId
    const now = new Date()
    const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
    const timeoutId = setTimeout(() => {
      checkReminders()
      intervalId = setInterval(checkReminders, 60000)
    }, msToNextMinute)
    return () => {
      clearTimeout(timeoutId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [reminders, shops, notificationsEnabled])

  

  useEffect(() => {
    let filtered = shops

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(shop => 
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.speciality.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Open Now filter
    if (openNowFilter) {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentTime = currentHour * 60 + currentMinute

      filtered = filtered.filter(shop => {
        const [openHour, openMin] = shop.openTime.split(':').map(Number)
        const [closeHour, closeMin] = shop.closeTime.split(':').map(Number)
        const openTime = openHour * 60 + openMin
        const closeTime = closeHour * 60 + closeMin

        return currentTime >= openTime && currentTime <= closeTime
      })
    }

    // Category filter
    if (activeCategory !== 'all') {
      if (activeCategory === 'premium') {
        filtered = filtered.filter(shop => shop.isPremium)
      } else {
        filtered = filtered.filter(shop => shop.type === activeCategory)
      }
    }

    // Favorites-only filter
    if (favoritesOnly) {
      filtered = filtered.filter(shop => favorites.includes(shop.id))
    }

    // Proximity: always attach computed distance when userLocation exists.
    // If a radius is set, filter to within radius and sort by distance.
    if (userLocation) {
      const withDistances = filtered.map(shop => ({
        ...shop,
        distanceKm: haversineKm(userLocation, shop.coordinates)
      }))

      if (typeof distanceRadiusKm === 'number') {
        filtered = withDistances
          .filter(s => s.distanceKm <= distanceRadiusKm)
          .sort((a, b) => a.distanceKm - b.distanceKm)
      } else {
        // No radius selected ("Any"): keep original ordering but include distanceKm for display
        filtered = withDistances
      }
    }

    setFilteredShops(filtered)
  }, [shops, activeCategory, openNowFilter, searchQuery, userLocation, distanceRadiusKm, favoritesOnly, favorites])

  // Randomize empty-state message when transitioning to empty results
  useEffect(() => {
    const isEmpty = !isLoading && filteredShops.length === 0
    if (isEmpty && !prevEmptyRef.current) {
      setEmptyMsgIndex(prev => getRandomDifferentIndex(prev, activeEmptyMessages.length))
    }
    prevEmptyRef.current = isEmpty
  }, [isLoading, filteredShops.length, activeEmptyMessages.length])

  // Also randomize when switching categories while empty
  useEffect(() => {
    const isEmpty = !isLoading && filteredShops.length === 0
    if (isEmpty) {
      setEmptyMsgIndex(prev => getRandomDifferentIndex(prev, activeEmptyMessages.length))
    }
  }, [activeCategory])

  const toggleFavorite = (shopId) => {
    setFavorites(prev => 
      prev.includes(shopId) 
        ? prev.filter(id => id !== shopId)
        : [...prev, shopId]
    )
  }

  const updateShopStatus = async (shopId, isOpen) => {
    // Optimistic update
    setShops(prev => prev.map(shop =>
      shop.id === shopId
        ? { ...shop, userReported: isOpen ? 'open' : 'closed' }
        : shop
    ))
    try {
      const res = await fetch(`/api/shops/${shopId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch (e) {
      // Revert on failure
      setShops(prev => prev.map(shop =>
        shop.id === shopId
          ? { ...shop, userReported: null }
          : shop
      ))
    }
  }

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const handleToggleNotificationsEnabled = async () => {
    // If turning on, request permission if needed
    if (!notificationsEnabled) {
      if (!('Notification' in window)) {
        alert('Notifications are not supported in this browser.')
        return
      }
      if (Notification.permission === 'default') {
        const perm = await Notification.requestPermission()
        if (perm !== 'granted') {
          alert('Enable notifications in browser settings to receive alerts.')
          setNotificationsEnabled(false)
          return
        }
      } else if (Notification.permission === 'denied') {
        alert('Notifications are blocked. Please enable them in your browser settings.')
        setNotificationsEnabled(false)
        return
      }
      setNotificationsEnabled(true)
    } else {
      // Turning off
      setNotificationsEnabled(false)
    }
  }

  const setReminder = (shopId, payload) => {
    const shop = shops.find(s => s.id === shopId)
    let dueAt = null
    let kind = 'before_close'
    let config = {}
    let confirmText = ''

    if (typeof payload === 'number') {
      // Legacy support: treat number as minutes before close
      const minutes = parseInt(payload)
      kind = 'before_close'
      config = { minutes }
      dueAt = computeDueAtForBeforeClose(shop, minutes)
      confirmText = `${minutes} minutes before closing`
    } else if (payload && typeof payload === 'object') {
      if (payload.type === 'before_close') {
        const minutes = parseInt(payload.minutes)
        kind = 'before_close'
        config = { minutes }
        dueAt = computeDueAtForBeforeClose(shop, minutes)
        confirmText = `${minutes} minutes before closing`
      } else if (payload.type === 'at') {
        kind = 'at'
        config = { time: payload.time }
        dueAt = computeDueAtForAtTime(payload.time)
        const t = dueAt ? dueAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : payload.time
        confirmText = `at ${t}`
      } else if (payload.type === 'in') {
        const minutes = parseInt(payload.minutes)
        kind = 'in'
        config = { minutes }
        dueAt = computeDueAtForIn(minutes)
        confirmText = `in ${minutes} min`
      }
    }

    if (!dueAt) return

    const newReminder = {
      id: Date.now(),
      shopId,
      kind,
      config,
      dueAt: dueAt.toISOString(),
      triggered: false,
      createdAt: new Date().toISOString()
    }

    setReminders(prev => {
      const filtered = prev.filter(r => r.shopId !== shopId)
      return [...filtered, newReminder]
    })

    if (shop && notificationsEnabled) {
      const now = new Date()
      setNotifications(prev => [{ id: Date.now(), text: `Reminder set for ${shop.name} - ${confirmText}`, shopId, timestamp: now.toISOString(), read: false }, ...prev])
    }
  }

  const handleShowNearbyMap = (shop) => {
    setMapCenterShop(shop)
    setShowNearbyMap(true)
  }

  const closeNearbyMap = () => {
    setShowNearbyMap(false)
    setMapCenterShop(null)
  }

  const handleShowCityMap = () => {
    setShowCityMap(true)
  }

  const closeCityMap = () => {
    setShowCityMap(false)
  }

  // "Near Me" actions from SearchBar
  const handleNearMe = () => {
    // Always apply fixed 8 km radius without opening modal
    setDistanceRadiusKm(8)
    setMaskDistanceSelection(true)
    try { window.scrollTo({ top: 0, behavior: 'smooth' }) } catch {}
  }

  const handleNearMeLongPress = () => {
    if (openRadiusModalRef.current) openRadiusModalRef.current()
  }

  // Wrap distance setter to unmask UI whenever user changes radius explicitly
  const setDistanceKmMasked = (km) => {
    setDistanceRadiusKm(km)
    setMaskDistanceSelection(false)
  }

  return (
    <div className="app-scroll">
      <div className={isDark ? 'min-h-screen bg-dark-900 text-white' : 'min-h-screen bg-gray-50 text-gray-900'}>
        {isDark && (
          <div aria-hidden className="absolute inset-0 z-0 pointer-events-none transition-all duration-1000 ease-in-out">
            {/* Dynamic themed gradients based on active category */}
            {activeCategory === 'all' && (
              <>
                {/* ThekaBar rose/red theme */}
                <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-red-900/30 via-red-800/15 to-transparent transition-all duration-1000"></div>
                <div className="absolute -top-24 -right-16 h-80 w-80 rounded-full bg-rose-700/25 blur-3xl transition-all duration-1000"></div>
                <div className="absolute bottom-[-96px] left-1/4 h-96 w-96 rounded-full bg-red-500/10 blur-3xl transition-all duration-1000"></div>
              </>
            )}
            {activeCategory === 'liquor_store' && (
              <>
                {/* Deep emerald/forest green theme for liquor stores */}
                <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-emerald-900/35 via-green-800/20 to-transparent transition-all duration-1000"></div>
                <div className="absolute -top-24 -right-16 h-80 w-80 rounded-full bg-emerald-600/30 blur-3xl transition-all duration-1000"></div>
                <div className="absolute bottom-[-96px] left-1/4 h-96 w-96 rounded-full bg-teal-500/15 blur-3xl transition-all duration-1000"></div>
                <div className="absolute top-1/2 left-1/4 h-56 w-56 rounded-full bg-green-400/10 blur-2xl transition-all duration-1000"></div>
              </>
            )}
            {activeCategory === 'bar' && (
              <>
                {/* Neon cyan/electric theme for bars */}
                <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-cyan-900/30 via-cyan-800/15 to-transparent transition-all duration-1000"></div>
                <div className="absolute -top-24 -right-16 h-80 w-80 rounded-full bg-cyan-500/30 blur-3xl animate-pulse transition-all duration-1000"></div>
                <div className="absolute bottom-[-96px] left-1/4 h-96 w-96 rounded-full bg-blue-400/15 blur-3xl transition-all duration-1000"></div>
                <div className="absolute top-1/3 right-1/3 h-64 w-64 rounded-full bg-cyan-400/20 blur-2xl animate-pulse transition-all duration-1000" style={{animationDelay: '1s'}}></div>
              </>
            )}
            {activeCategory === 'premium' && (
              <>
                {/* Luxurious gold/purple theme for premium */}
                <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-purple-900/40 via-indigo-900/20 to-transparent transition-all duration-1000"></div>
                <div className="absolute -top-24 -right-16 h-80 w-80 rounded-full bg-gradient-to-br from-yellow-400/20 to-purple-600/25 blur-3xl transition-all duration-1000"></div>
                <div className="absolute bottom-[-96px] left-1/4 h-96 w-96 rounded-full bg-gradient-to-tr from-amber-400/10 to-violet-500/15 blur-3xl transition-all duration-1000"></div>
                <div className="absolute top-1/4 left-1/3 h-48 w-48 rounded-full bg-yellow-300/10 blur-2xl transition-all duration-1000"></div>
              </>
            )}
          </div>
        )}

        <div className="relative z-10">
        <Header 
          isDark={isDark}
          notificationsEnabled={notificationsEnabled}
          onToggleNotificationsEnabled={handleToggleNotificationsEnabled}
        />
        
        {!hasLocationPermission ? (
          <LocationPermission 
            isDark={isDark} 
            onLocationEnabled={handleLocationEnabled}
          />
        ) : (
          <>
            <SearchBar 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} 
              isDark={isDark}
              onNearMe={handleNearMe}
              onNearMeLongPress={handleNearMeLongPress}
              isNearMeActive={maskDistanceSelection}
            />
            <CategoryChips 
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              openNowFilter={openNowFilter}
              setOpenNowFilter={setOpenNowFilter}
              onShowCityMap={handleShowCityMap}
              isDark={isDark}
              distanceRadiusKm={distanceRadiusKm}
              setDistanceRadiusKm={setDistanceKmMasked}
              bindOpenRadiusModal={bindOpenRadiusModal}
              maskDistanceSelection={maskDistanceSelection}
              favoritesOnly={favoritesOnly}
              setFavoritesOnly={setFavoritesOnly}
            />
            
            <div className="px-4 py-4">
              <div className="grid grid-cols-1 gap-y-3 gap-x-0 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6">
                {isLoading ? (
                  // Show skeleton cards while loading
                  Array.from({ length: 6 }, (_, index) => (
                    <SkeletonCard key={index} isDark={isDark} />
                  ))
                ) : (
                  filteredShops.map(shop => (
                    <ShopCard
                      key={shop.id}
                      shop={shop}
                      isFavorite={favorites.includes(shop.id)}
                      onToggleFavorite={toggleFavorite}
                      onUpdateStatus={updateShopStatus}
                      onSetReminder={(payload) => setReminder(shop.id, payload)}
                      hasReminder={reminders.some(r => r.shopId === shop.id)}
                      onShowNearbyMap={handleShowNearbyMap}
                      activeCategory={activeCategory}
                      isDark={isDark}
                    />
                  ))
                )}
              </div>
      
              {!isLoading && filteredShops.length === 0 && (
                <div className="text-center py-16">
                  <div className={isDark ? 'bg-white/10 backdrop-blur-lg ring-1 ring-white/10 rounded-2xl shadow-lg p-8 max-w-md mx-auto' : 'bg-white/25 backdrop-blur-lg ring-1 ring-white/40 rounded-2xl shadow-lg p-8 max-w-md mx-auto'}>
                    <div className="text-6xl mb-4">🍻</div>
                    <p className={isDark ? 'text-white text-xl font-semibold mb-2' : 'text-gray-900 text-xl font-semibold mb-2'}>{activeEmptyMessages[emptyMsgIndex % activeEmptyMessages.length]}</p>
                    <p className={isDark ? 'text-gray-300 font-semibold tracking-wide' : 'text-gray-700 font-semibold tracking-wide'}>OR</p>
                    <p className={isDark ? 'text-gray-400 text-sm mt-2' : 'text-gray-600 text-sm mt-2'}>Try adjusting your filters or search radius</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Nearby Map Modal */}
        <NearbyMap
          isOpen={showNearbyMap}
          onClose={closeNearbyMap}
          centerShop={mapCenterShop}
          allShops={shops}
          isDark={isDark}
        />
        
        {/* City Map Modal */}
        <CityMap
          isOpen={showCityMap}
          onClose={closeCityMap}
          allShops={shops}
          filteredShops={filteredShops}
          activeCategory={activeCategory}
          openNowFilter={openNowFilter}
          isDark={isDark}
        />
        </div>
      </div>
    </div>
  )
}

export default App
