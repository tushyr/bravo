import { LuClock as Clock } from 'react-icons/lu'

const CategoryChips = ({ activeCategory, setActiveCategory, openNowFilter, setOpenNowFilter, isDark = false }) => {
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'liquor_store', label: '🏪 Shops' },
    { id: 'bar', label: '🍺 Bars' },
    { id: 'premium', label: '👑 Premium' }
  ]

  return (
    <div className="px-4 py-3">
      {/* Open Now Button */}
      <div className="mb-3">
        <button
          onClick={() => setOpenNowFilter(!openNowFilter)}
          className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors transition-transform glow-rose ripple ripple-rose active:scale-95 ${
            openNowFilter
              ? (isDark
                  ? 'bg-green-600/80 text-white border border-green-500/40'
                  : 'bg-green-600 text-white border border-green-700/30')
              : (isDark
                  ? 'bg-white/5 backdrop-blur-md text-gray-200 border border-white/20 hover:bg-white/10'
                  : 'bg-transparent text-gray-800 border border-gray-300 hover:bg-gray-50')
          }`}
        >
          <Clock className={`h-4 w-4 mr-2 ${openNowFilter ? 'text-white' : (isDark ? 'text-gray-300' : 'text-gray-600')}`} />
          Open Now
        </button>
      </div>

      {/* Category Chips */}
      <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-0.5">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors transition-transform ripple ripple-rose active:scale-95 ${
              activeCategory === category.id
                ? (isDark
                    ? 'bg-rose-600/80 text-white border border-rose-500/40'
                    : 'bg-purple-600 text-white border border-purple-700/40')
                : (isDark
                    ? 'bg-white/5 backdrop-blur-md text-gray-200 border border-white/20 hover:bg-white/10'
                    : 'bg-transparent text-gray-800 border border-gray-300 hover:bg-gray-50')
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Distance Chips */}
      <div className="mt-3">
        <div className={isDark ? 'text-gray-300 text-xs mb-2 font-medium' : 'text-gray-800 text-xs mb-2 font-medium'}>Distance</div>
        <div className="flex space-x-1.5">
          {['2 km', '5 km', '10 km'].map((distance) => (
            <button
              key={distance}
              className={isDark ? 'px-3 py-1.5 bg-white/5 backdrop-blur-md border border-white/20 text-gray-200 text-xs rounded-full hover:bg-white/10 transition-colors transition-transform font-medium ripple ripple-rose active:scale-95' : 'px-3 py-1.5 bg-transparent border border-gray-300 text-gray-700 text-xs rounded-full hover:bg-gray-50 transition-colors transition-transform font-medium ripple ripple-rose active:scale-95'}
            >
              {distance}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CategoryChips
