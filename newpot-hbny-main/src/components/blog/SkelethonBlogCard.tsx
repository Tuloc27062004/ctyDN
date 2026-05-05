export default function SkeletonBlogCard() {
  return (
    <div className="animate-pulse bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Image */}
      <div className="w-full h-56 bg-gray-300"></div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-5 bg-gray-300 rounded w-3/4"></div>

        {/* Description */}
        <div className="h-4 bg-gray-300 rounded w-full"></div>
        <div className="h-4 bg-gray-300 rounded w-5/6"></div>

        {/* Meta */}
        <div className="h-3 bg-gray-300 rounded w-1/3"></div>
      </div>
    </div>
  );
}