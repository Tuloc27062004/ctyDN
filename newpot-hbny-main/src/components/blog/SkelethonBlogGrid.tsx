import SkeletonBlogCard from "./SkelethonBlogCard";

export default function SkeletonBlogsGrid() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: 6 }).map((_, index) => (
        <SkeletonBlogCard key={index} />
      ))}
    </div>
  );
}