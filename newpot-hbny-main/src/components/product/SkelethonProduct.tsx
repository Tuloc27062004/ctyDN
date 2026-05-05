export default function SkeletonProduct() {
  return (
    <div className="animate-pulse bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Image */}
      <div className="w-full h-64 bg-gray-300"></div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-5 bg-gray-300 rounded w-3/4"></div>

        {/* Price */}
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>

        {/* Button */}
        <div className="h-10 bg-gray-300 rounded w-full"></div>
      </div>
    </div>
  );
}