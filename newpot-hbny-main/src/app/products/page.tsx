"use client";

import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import ProductsGrid from '@/components/product/ProductsGrid';
import { useProduct } from '@/hooks/useProduct';
import { use, useEffect, useRef, useState } from 'react';
import SkeletonProductsGrid from '@/components/product/SkelethonProductGrid';


export default function ProductsPage() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState<string>('');
  const [categoryIds, setCategoryIds] = useState<string[]>(['all']);
  const [page, setPage] = useState<number>(1);

  const {productList, isLoading, error} = useProduct({
    search: search,
    categoryIds: categoryIds,
    page: page,
    limit: 10,
  });


  useEffect(() => {
    setPage(1);
  }, [search, categoryIds]);
  
  useEffect(() => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  if(isLoading || !productList) {
    return (
      <>
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative h-[40vh] min-h-75 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=1920&q=80)',
            }}
          >
            <div className="absolute inset-0 bg-black/50"></div>
          </div>
          <div className="relative z-10 text-center text-white px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif mb-4">Our Products</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              Explore our complete collection of handcrafted planters, furniture, and home decor.
            </p>
          </div>
        </section>

        {/* Breadcrumb */}
        <div ref={sectionRef} className="bg-stone-50 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center space-x-2 text-sm text-stone-600">
              <Link href="/" className="hover:text-stone-900">Home</Link>
              <span>/</span>
              <span className="text-stone-900">Products</span>
            </nav>
          </div>
        </div>

        {/* Products Section */}
        <section className="pt-4 pb-16">
          <SkeletonProductsGrid />
        </section>
      </main>
      <Footer />
    </>
    )
  }

   if(error) {
    return (
      <>
        <Header />
        <main className="pt-20">
          <div className="h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p>Failed to load products.</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative h-[40vh] min-h-75 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=1920&q=80)',
            }}
          >
            <div className="absolute inset-0 bg-black/50"></div>
          </div>
          <div className="relative z-10 text-center text-white px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif mb-4">Our Products</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              Explore our complete collection of handcrafted planters, furniture, and home decor.
            </p>
          </div>
        </section>

        {/* Breadcrumb */}
        <div ref={sectionRef} className="bg-stone-50 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center space-x-2 text-sm text-stone-600">
              <Link href="/" className="hover:text-stone-900">Home</Link>
              <span>/</span>
              <span className="text-stone-900">Products</span>
            </nav>
          </div>
        </div>

        {/* Products Section */}
        <section className="pt-4 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ProductsGrid
             productList={productList}
             currentPage={page}
             currentSearch={search}
             currentCategories={categoryIds}
             onPageChange={setPage}
             onSearchChange={setSearch}
             onCategoriesChange={setCategoryIds}
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
