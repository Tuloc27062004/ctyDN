'use client';

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

import { useParams } from 'next/navigation';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import Link from 'next/link';
import { mockBlogs } from '@/data/blogs';
import { useDetailedBlog } from '@/hooks/useDetailedBlog';
import Image from "next/image";

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { blog } = useDetailedBlog(slug);

  if (!blog) {
    return (
      <>
        <Header />
        <main className="pt-24 text-center">
          <h1 className="text-2xl font-semibold">Blog not found</h1>
          <Link href="/blogs" className="text-green-600 underline mt-4 block">
            Back to Blogs
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="pt-20">
        {/* Hero Image */}
        {blog.coverImageUrl && (
          <div className="w-full h-[50vh] min-h-[300px]">
            <img
              src={blog.coverImageUrl}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4">
            {/* Breadcrumb */}
            <div className="text-sm text-stone-500 mb-6">
              <Link href="/" className="hover:underline">
                Home
              </Link>{' '}
              /{' '}
              <Link href="/blogs" className="hover:underline">
                Blogs
              </Link>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-serif text-stone-800 mb-4">
              {blog.title}
            </h1>

            {/* Date */}
            {blog.publishedAt && (
              <p className="text-sm text-stone-500 mb-8">
                {new Date(blog.publishedAt).toLocaleDateString()}
              </p>
            )}

            {/* Content */}
            <div className="prose max-w-none prose-stone">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={{
                  img: ({ src = "", alt = "" }) => {
                    if(typeof src !== "string") {
                      return null;
                    }
                    return (
                      <Image
                        src={src}
                        alt={alt}
                        width={800}
                        height={500}
                        className="rounded-lg"
                      />
                    );
                  },
                }}
              >
                {blog.content || ""}
              </ReactMarkdown>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}