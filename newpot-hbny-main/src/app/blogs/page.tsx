"use client";

import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import { useBlog } from '@/hooks/useBlog';
import BlogCard from '@/components/blog/BlogCard';
import { mockBlogs } from '@/data/blogs';
import SkeletonBlogsGrid from '@/components/blog/SkelethonBlogGrid';

export default function BlogsPage() {
  const { blogList, isLoading, error } = useBlog( { page: 1, limit: 9 } );


  return (
    <>
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                'url(https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=1920&q=80)',
            }}
          >
            <div className="absolute inset-0 bg-black/50"></div>
          </div>
          <div className="relative z-10 text-center text-white px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif">
              Blogs
            </h1>
          </div>
        </section>

        {/* Breadcrumb */}
        <div className="bg-stone-50 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center space-x-2 text-sm text-stone-600">
              <Link href="/" className="hover:text-stone-900">
                Home
              </Link>
              <span>/</span>
              <span className="text-stone-900">Blogs</span>
            </nav>
          </div>
        </div>

        {/* Blog List */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-serif text-stone-800 mb-10">
              Latest Articles
            </h2>

            {/* Loading */}
            {isLoading && <SkeletonBlogsGrid />}

            {/* Error */}
            {error && (
              <p className="text-center text-red-500">
                Failed to load blogs.
              </p>
            )}

            {/* Empty */}
            {!isLoading && blogList?.blogs.length === 0 && (
              <p className="text-center text-stone-500">
                No blogs available.
              </p>
            )}

            {/* Grid */}
            {!isLoading && !error && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogList?.blogs.map((blog) => (
                  <BlogCard key={blog.id} blog={blog} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Newsletter CTA (keep yours) */}
        <section className="py-20 bg-stone-800 text-white">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-serif mb-4">
              Never Miss an Article
            </h2>
            <p className="text-stone-300 mb-8">
              Subscribe to our newsletter and stay updated with our latest insights.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-stone-700 border border-stone-600 text-white placeholder-stone-400 focus:border-stone-500 outline-none"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-[#228B22] text-white font-medium hover:bg-[#1B6B1B] transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}