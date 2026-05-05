'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductCard from './ProductCard';
import { ProductList } from '@/types/product.type';
import { useCategory } from '@/hooks/useCategory';

interface ProductsGridProps {
  productList: ProductList;

  currentPage: number;
  currentSearch: string;
  currentCategories: string[];

  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  onCategoriesChange: (categories: string[]) => void;
}

export default function ProductsGrid({
  productList,
  currentPage,
  currentSearch,
  currentCategories,
  onPageChange,
  onSearchChange,
  onCategoriesChange,
}: ProductsGridProps) {
  const { categoryList, isLoading } = useCategory();

  const router = useRouter();
  const gridRef = useRef<HTMLDivElement>(null);

  // Local state for debounce
  const [localSearch, setLocalSearch] = useState(currentSearch);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      onSearchChange(localSearch);
    }, 500);

    return () => clearTimeout(timeout);
  }, [localSearch]);

  useEffect(() => {
    if (!gridRef.current) return;

    const yOffset = -140;
    const y =
      gridRef.current.getBoundingClientRect().top +
      window.pageYOffset +
      yOffset;

    window.scrollTo({ top: y, behavior: 'smooth' });
  }, [currentPage]);

  // Sync URL
  useEffect(() => {
    const params = new URLSearchParams();

    if (currentPage > 1) params.set('page', String(currentPage));
    if (currentSearch) params.set('search', currentSearch);
    if (
      currentCategories.length > 0 &&
      !currentCategories.includes('all')
    ) {
      params.set('categories', currentCategories.join(','));
    }

    router.replace(`?${params.toString()}`, { scroll: false });
  }, [currentPage, currentSearch, currentCategories]);

  const totalPages = productList?.totalPages || 1;

  const handleCategoryClick = (categoryId: string) => {
  let newCategories: string[] = [];

  if (categoryId === 'all') {
    // ✅ Select "all" → reset everything
    newCategories = ['all'];
  } else {
    // If currently "all", remove it first
    const filtered = currentCategories.includes('all')
      ? []
      : [...currentCategories];

    if (filtered.includes(categoryId)) {
      // ✅ toggle OFF
      newCategories = filtered.filter((id) => id !== categoryId);

      // If nothing left → fallback to "all"
      if (newCategories.length === 0) {
        newCategories = ['all'];
      }
    } else {
      // ✅ toggle ON
      newCategories = [...filtered, categoryId];
    }
  }

  onCategoriesChange(newCategories);
  onPageChange(1);
};

  return (
    <div className="flex flex-col" ref={gridRef}>
      <div className="flex flex-wrap items-center justify-between mb-2">
        {/* 📂 Category */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* All */}
          <button
            onClick={() => handleCategoryClick('all')}
            className={`px-5 py-2 text-sm font-medium rounded-2xl ${
              currentCategories.includes('all')
                ? 'bg-green-800 text-white'
                : 'bg-stone-100'
            }`}
          >
            All
          </button>

          {/* Other categories */}
          {categoryList?.categories?.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`px-5 py-2 text-sm font-medium rounded-2xl ${
                currentCategories.includes(category.id)
                  ? 'bg-green-800 text-white'
                  : 'bg-stone-100'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* 🔍 Search */}
        <div className="mb-6">
          <input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full mt-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

      </div>

      {/* 📊 Result Count */}
      <p className="text-sm font-medium text-stone-700 mt-4 mb-6">
        Showing {productList.page * productList.limit - productList.limit + 1}-{Math.min(productList.page * productList.limit, productList.total)} of {productList.total} results
      </p>

      {/* 🧱 Grid */}
      {productList.products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {productList.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-stone-500">
          No products found.
        </div>
      )}

      {/* 📄 Pagination */}
      <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
        {/* Prev */}
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-1 border rounded-xl text-green-900 font-extrabold disabled:opacity-50"
        >
          {`<`}
        </button>

        {/* Page numbers */}
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 font-semibold border rounded-xl ${
              currentPage === page
                ? 'bg-green-800 text-white'
                : ''
            }`}
          >
            {page}
          </button>
        ))}

        {/* Next */}
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-1 border rounded-xl text-green-900 font-extrabold disabled:opacity-50"
        >
          {`>`}
        </button>
      </div>
    </div>
  );
}