import { Blog } from '@/types/blog.type';
import Link from 'next/link';

export default function BlogCard({ blog }: { blog: Blog }) {
  return (
    <div className="bg-white border border-stone-200 overflow-hidden hover:shadow-md transition">
      {blog.coverImageUrl && (
        <img
          src={blog.coverImageUrl}
          alt={blog.title}
          className="w-full h-56 object-cover"
        />
      )}

      <div className="p-5">
        <h3 className="text-lg font-semibold text-stone-800 mb-2">
          {blog.title}
        </h3>

        {blog.excerpt && (
          <p className="text-sm text-stone-600 mb-4 line-clamp-3">
            {blog.excerpt}
          </p>
        )}

        <Link
          href={`/blogs/${blog.slug}`}
          className="text-sm font-medium text-[#228B22] hover:underline"
        >
          Read more →
        </Link>
      </div>
    </div>
  );
}