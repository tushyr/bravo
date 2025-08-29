import { LuSearch as Search, LuMapPin as MapPin } from 'react-icons/lu'

const SearchBar = ({ searchQuery, setSearchQuery, isDark = false }) => {
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
        <button className={isDark ? 'ml-2 border border-rose-500/40 text-rose-400 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs hover:bg-rose-500/10 transition-colors glow-rose ripple ripple-rose active:scale-95 transition-transform motion-sensitive' : 'ml-2 border border-purple-500/40 text-purple-700 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs hover:bg-purple-50 transition-colors glow-rose ripple ripple-rose active:scale-95 transition-transform motion-sensitive'}>
          <MapPin className="h-4 w-4" />
          <span>Near Me</span>
        </button>
      </div>
    </div>
  )
}

export default SearchBar
