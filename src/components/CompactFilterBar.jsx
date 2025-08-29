import { useState } from 'react'
import { LuMenu as Menu, LuX as X, LuClock as Clock, LuMapPin as MapPin } from 'react-icons/lu'
import { areas, shopTypes } from '../data/mockData'

const CompactFilterBar = ({ filters, setFilters, totalShops }) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* Main Filter Bar */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-card border border-gray-200/50 p-4 mb-6">
        <div className="flex items-center justify-between">
          {/* Left side - Open Now toggle */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleMenu}
              className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 glow-rose ripple ripple-rose active:scale-95"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.openNow}
                onChange={(e) => handleFilterChange('openNow', e.target.checked)}
                className="sr-only"
              />
              <div className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                filters.openNow 
                  ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-lg shadow-green-200' 
                  : 'bg-gray-300 group-hover:bg-gray-400'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-md ${
                  filters.openNow ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </div>
              <div className="ml-3 flex items-center space-x-2">
                <Clock className={`h-4 w-4 ${filters.openNow ? 'text-green-600' : 'text-gray-500'}`} />
                <span className="text-sm font-semibold text-gray-700">Open Now</span>
              </div>
            </label>
          </div>

          {/* Right side - Results count */}
          <div className="bg-purple-50 px-4 py-2 rounded-full">
            <span className="text-sm font-semibold text-purple-700">
              {totalShops} {totalShops === 1 ? 'place' : 'places'}
            </span>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.type !== 'all' || filters.area !== 'all') && (
          <div className="mt-4 pt-4 border-t border-gray-200/70">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-600">Filters:</span>
              {filters.type !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300">
                  {shopTypes.find(t => t.value === filters.type)?.label}
                </span>
              )}
              {filters.area !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300">
                  <MapPin className="h-3 w-3 mr-1" />
                  {filters.area}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Slide-out Filter Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={toggleMenu}></div>
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                <button
                  onClick={toggleMenu}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ripple ripple-white active:scale-95"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-700 font-medium"
                  >
                    <option value="all">All Types</option>
                    {shopTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Area Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Area</label>
                  <select
                    value={filters.area}
                    onChange={(e) => handleFilterChange('area', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-700 font-medium"
                  >
                    <option value="all">All Areas</option>
                    {areas.map(area => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={() => {
                    setFilters({ openNow: false, type: 'all', area: 'all' })
                    setIsOpen(false)
                  }}
                  className="w-full px-4 py-3 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 ripple ripple-white active:scale-95"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CompactFilterBar
