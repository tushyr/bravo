import { LuFilter as Filter, LuMapPin as MapPin, LuClock as Clock } from 'react-icons/lu'
import { areas, shopTypes } from '../data/mockData'

const FilterBar = ({ filters, setFilters, totalShops }) => {
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-card border border-gray-200/50 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-primary-500 to-accent-500 p-2 rounded-xl">
            <Filter className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Filters</h2>
        </div>
        <div className="bg-primary-50 px-4 py-2 rounded-full">
          <span className="text-sm font-semibold text-primary-700">
            {totalShops} {totalShops === 1 ? 'place' : 'places'} found
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Open Now Toggle */}
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.openNow}
              onChange={(e) => handleFilterChange('openNow', e.target.checked)}
              className="sr-only"
            />
            <div className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
              filters.openNow 
                ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-lg shadow-green-200' 
                : 'bg-gray-300 group-hover:bg-gray-400'
            }`}>
              <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-md ${
                filters.openNow ? 'translate-x-7' : 'translate-x-0'
              }`} />
            </div>
            <div className="ml-3 flex items-center space-x-2">
              <Clock className={`h-4 w-4 ${filters.openNow ? 'text-green-600' : 'text-gray-500'}`} />
              <span className="text-sm font-semibold text-gray-700">Open Now</span>
            </div>
          </label>
        </div>

        {/* Type Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Type</label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-gray-700 font-medium"
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
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Area</label>
          <select
            value={filters.area}
            onChange={(e) => handleFilterChange('area', e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-gray-700 font-medium"
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
        <div className="flex items-end">
          <button
            onClick={() => setFilters({ openNow: false, type: 'all', area: 'all' })}
            className="w-full px-4 py-3 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 hover:shadow-md ripple ripple-white active:scale-95 motion-sensitive"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.openNow || filters.type !== 'all' || filters.area !== 'all') && (
        <div className="mt-6 pt-6 border-t border-gray-200/70">
          <div className="flex flex-wrap gap-3">
            <span className="text-sm font-medium text-gray-600">Active filters:</span>
            {filters.openNow && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300">
                <Clock className="h-3 w-3 mr-1.5" />
                Open Now
              </span>
            )}
            {filters.type !== 'all' && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300">
                {shopTypes.find(t => t.value === filters.type)?.label}
              </span>
            )}
            {filters.area !== 'all' && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300">
                <MapPin className="h-3 w-3 mr-1.5" />
                {filters.area}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default FilterBar
