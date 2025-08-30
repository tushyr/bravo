import { LuClock as Clock, LuBell as Bell, LuBellOff as BellOff } from 'react-icons/lu'
import brandLogo from '../../icon/icon_main.svg'

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
          <div className="flex items-center">
            <div className="relative h-8 -translate-x-[20%] -translate-y-[10%] group">
              <img src={brandLogo} alt="ThekaBar" className="h-8 md:h-8 scale-[2.376] md:scale-[2.376] origin-left object-contain select-none pointer-events-none transition-transform duration-200 ease-out will-change-transform group-hover:scale-[2.424]" />
              <span className={isDark 
                ? 'absolute left-1/2 translate-x-[25%] top-[82%] text-[10px] leading-none text-purple-300/70 uppercase tracking-wide font-medium'
                : 'absolute left-1/2 translate-x-[25%] top-[82%] text-[10px] leading-none text-slate-600/80 uppercase tracking-wide font-medium'
              } style={{textShadow: '0 1px 2px rgba(0,0,0,0.1)'}}>
                Delhi/NCR
              </span>
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
                {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
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
