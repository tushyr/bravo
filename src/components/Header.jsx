import { LuClock as Clock, LuBell as Bell, LuBellOff as BellOff } from 'react-icons/lu'

const Header = ({ isDark = false, notificationsEnabled = false, onToggleNotificationsEnabled }) => {

  const currentTime = new Date().toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  })

  return (
    <header className="bg-transparent">
      <div className="container mx-auto px-4 py-4">
        <div className={isDark ? 'relative overflow-hidden bg-white/5 backdrop-blur-lg ring-1 ring-white/10 rounded-3xl shadow-lg px-4 py-3' : 'relative overflow-hidden bg-white/25 backdrop-blur-lg ring-1 ring-white/40 rounded-3xl shadow-lg px-4 py-3'}>
          <div className="absolute inset-0 header-ambient rounded-3xl" aria-hidden="true" />
          <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={isDark ? 'p-2 rounded-xl bg-white/10 ring-1 ring-white/10' : 'bg-gradient-to-br from-purple-500 to-blue-500 p-2 rounded-xl shadow-lg'}>
              <span className={isDark ? 'text-xl' : 'text-2xl'}>✨</span>
            </div>
            <div>
              <h1 className={isDark ? 'text-xl font-bold text-white' : 'text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent'}>BoozBuzz</h1>
              <p className={isDark ? 'text-gray-400 text-sm' : 'text-gray-500 text-sm'}>Delhi NCR</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className={isDark ? 'flex items-center gap-1.5 text-xs text-gray-300' : 'flex items-center space-x-2 text-sm text-gray-800 bg-white/30 ring-1 ring-white/40 px-3 py-1.5 rounded-full backdrop-blur-md'}>
              <Clock className={isDark ? 'h-4 w-4 text-rose-400' : 'h-4 w-4 text-purple-500'} />
              <span className="font-medium">{currentTime}</span>
            </div>
            <div className="relative">
              <button
                onClick={onToggleNotificationsEnabled}
                aria-label={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
                aria-pressed={notificationsEnabled}
                className={isDark 
                  ? `p-2.5 rounded-xl backdrop-blur-md ring-1 transition-all shadow-md ripple active:scale-95 motion-sensitive ${notificationsEnabled ? 'bg-white/5 ring-white/10 text-rose-400 hover:bg-white/10' : 'bg-white/5 ring-white/10 text-gray-400 hover:bg-white/10'}`
                  : `p-2.5 rounded-xl backdrop-blur-md ring-1 transition-all shadow-md ripple active:scale-95 motion-sensitive ${notificationsEnabled ? 'bg-white/30 ring-white/40 text-purple-600 hover:bg-white/40' : 'bg-white/30 ring-white/40 text-gray-700 hover:bg-white/40'}`
                }
              >
                {notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
