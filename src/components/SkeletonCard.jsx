const SkeletonCard = ({ isDark = false }) => {
  return (
    <div className={`card-shimmer h-full ${isDark ? 'bg-white/5 backdrop-blur-lg rounded-3xl shadow-lg' : 'bg-white/25 backdrop-blur-lg rounded-3xl shadow-md ring-1 ring-white/40'}`}>
      <div className="p-5">
        {/* Header with name and favorite */}
        <div className="flex items-start justify-between mb-4">
          <div className="skeleton h-5 w-32"></div>
          <div className="skeleton h-10 w-10 rounded-full"></div>
        </div>

        {/* Status and type */}
        <div className="flex items-center space-x-3 mb-3">
          <div className="skeleton h-6 w-20 rounded-full"></div>
          <div className="skeleton h-4 w-16"></div>
        </div>

        {/* Location and rating */}
        <div className="flex items-center space-x-3 mb-3">
          <div className="skeleton h-4 w-24"></div>
          <div className="skeleton h-4 w-12"></div>
          <div className="skeleton h-5 w-8 rounded-md"></div>
        </div>

        {/* Address */}
        <div className="skeleton h-4 w-full mb-2.5"></div>

        {/* Speciality */}
        <div className="skeleton h-3 w-3/4"></div>
      </div>
    </div>
  )
}

export default SkeletonCard
