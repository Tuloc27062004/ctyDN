'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import ProductCard from '../product/ProductCard';
import { useLandingProduct } from '@/hooks/useLandingProducts';
import { BasicProduct, ProductImage } from '@/types/product.type';
import { motion } from 'framer-motion';

type DisplayCategory = {
  id: string;
  name: string;
};

const PLACEHOLDER_IMAGE =
  'https://via.placeholder.com/600x600?text=No+Image';

const MOCK_CATEGORIES: DisplayCategory[] = [
  { id: 'all', name: 'All' },
  { id: 'coffee', name: 'Coffee' },
  { id: 'tea', name: 'Tea' },
  { id: 'accessories', name: 'Accessories' },
];

const MOCK_PRODUCTS: BasicProduct[] = [
  {
    id: '1',
    name: 'Signature Coffee',
    description: 'A rich and aromatic blend for daily enjoyment.',
    minPrice: 10,
    maxPrice: 15,
    categories: [{ id: 'coffee', name: 'Coffee' }],
    images: [
      'https://media.istockphoto.com/id/2168005130/photo/heart-shaped-latte-art-in-a-white-cup-with-coffee-beans-isolated-on-wooden-table-side-view-of.jpg?s=612x612&w=0&k=20&c=hQmWzRmUpVsrEVD97Dwy7jxk6FmRJhKbA2VNh_D5V9s=',
    ],
    thumbnail: {
      id: 'thumb-1',
      url: 'https://media.istockphoto.com/id/2168005130/photo/heart-shaped-latte-art-in-a-white-cup-with-coffee-beans-isolated-on-wooden-table-side-view-of.jpg?s=612x612&w=0&k=20&c=hQmWzRmUpVsrEVD97Dwy7jxk6FmRJhKbA2VNh_D5V9s=',
      description: null,
      isRender: true,
    },
  },
  {
    id: '2',
    name: 'Green Tea',
    description: 'Fresh and calming green tea leaves.',
    minPrice: 8,
    maxPrice: 12,
    categories: [{ id: 'tea', name: 'Tea' }],
    images: [
      'https://tea-side.com/image/cache/catalog/teaware/blue-ocean/bowl-dark/matcha-bowl-purple-blue-rusty-glaze-320ml-906x700.jpg',
    ],
    thumbnail: {
      id: 'thumb-2',
      url: 'https://tea-side.com/image/cache/catalog/teaware/blue-ocean/bowl-dark/matcha-bowl-purple-blue-rusty-glaze-320ml-906x700.jpg',
      description: null,
      isRender: true,
    },
  },
  {
    id: '3',
    name: 'Ceramic Cup',
    description: 'Minimalist ceramic cup for everyday use.',
    minPrice: 12,
    maxPrice: 18,
    categories: [{ id: 'accessories', name: 'Accessories' }],
    images: [
      'https://www.renwares.store/cdn/shop/products/custom_resized_80ad8af0-883c-4b41-9d13-14f4d3ebf81d.jpg?v=1627446705',
    ],
    thumbnail: {
      id: 'thumb-3',
      url: 'https://www.renwares.store/cdn/shop/products/custom_resized_80ad8af0-883c-4b41-9d13-14f4d3ebf81d.jpg?v=1627446705',
      description: null,
      isRender: true,
    },
  },
  {
    id: '4',
    name: 'Espresso Blend',
    description: 'Bold and intense espresso blend for the perfect shot.',
    minPrice: 10,
    maxPrice: 15,
    categories: [{ id: 'coffee', name: 'Coffee' }],
    images: [
      'https://thelittlepotcompany.co.uk/cdn/shop/products/IMG_0595.jpg?v=1746733355&width=1946',
    ],
    thumbnail: {
      id: 'thumb-4',
      url: 'https://thelittlepotcompany.co.uk/cdn/shop/products/IMG_0595.jpg?v=1746733355&width=1946',
      description: null,
      isRender: true,
    },
  },
  {
    id: '5',
    name: 'Matcha Tea',
    description: 'Fresh and calming green tea leaves.',
    minPrice: 8,
    maxPrice: 12,
    categories: [{ id: 'tea', name: 'Tea' }],
    images: [
      'https://images-na.ssl-images-amazon.com/images/I/51ujkOBCEgL._SR200,200_.jpg',
    ],
    thumbnail: {
      id: 'thumb-5',
      url: 'https://images-na.ssl-images-amazon.com/images/I/51ujkOBCEgL._SR200,200_.jpg',
      description: null,
      isRender: true,
    },
  },
  {
    id: '6',
    name: 'Ceramic Plate',
    description: 'Minimalist ceramic plate for everyday use.',
    minPrice: 12,
    maxPrice: 18,
    categories: [{ id: 'accessories', name: 'Accessories' }],
    images: [
      'https://m.media-amazon.com/images/I/71sjkhA04DL._AC_UF894,1000_QL80_.jpg',
    ],
    thumbnail: {
      id: 'thumb-6',
      url: 'https://m.media-amazon.com/images/I/71sjkhA04DL._AC_UF894,1000_QL80_.jpg',
      description: null,
      isRender: true,
    },
  },
];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeCategory(raw: unknown, fallbackIndex: number): DisplayCategory | null {
  if (!raw || typeof raw !== 'object') return null;

  const item = raw as { id?: unknown; name?: unknown };

  const id = isNonEmptyString(item.id) ? item.id : `category-${fallbackIndex}`;
  const name = isNonEmptyString(item.name) ? item.name : null;

  if (!name) return null;

  return { id, name };
}

function normalizeThumbnail(
  raw: unknown,
  fallbackUrl: string,
  fallbackIndex: number
): ProductImage {
  const item =
    raw && typeof raw === 'object'
      ? (raw as {
          id?: unknown;
          url?: unknown;
          description?: unknown;
          isRender?: unknown;
        })
      : null;

  return {
    id: isNonEmptyString(item?.id) ? item!.id : `thumb-${fallbackIndex}`,
    url: isNonEmptyString(item?.url) ? item!.url : fallbackUrl,
    description: typeof item?.description === 'string' ? item.description : null,
    isRender: typeof item?.isRender === 'boolean' ? item.isRender : true,
  };
}

function normalizeProduct(raw: unknown, fallbackIndex: number): BasicProduct | null {
  if (!raw || typeof raw !== 'object') return null;

  const item = raw as {
    id?: unknown;
    name?: unknown;
    description?: unknown;
    minPrice?: unknown;
    maxPrice?: unknown;
    images?: unknown;
    categories?: unknown;
    thumbnail?: unknown;
  };

  const id = isNonEmptyString(item.id) ? item.id : `product-${fallbackIndex}`;
  const name = isNonEmptyString(item.name) ? item.name : null;

  if (!name) return null;

  const images = Array.isArray(item.images)
    ? item.images.filter(isNonEmptyString)
    : [];

  const safeImages = images.length > 0 ? images : [PLACEHOLDER_IMAGE];

  const categories = Array.isArray(item.categories)
    ? item.categories
        .map((category, index) => normalizeCategory(category, index))
        .filter((category): category is DisplayCategory => category !== null)
    : [];

  return {
    id,
    name,
    description: isNonEmptyString(item.description)
      ? item.description
      : 'Explore our featured product.',
    minPrice: isFiniteNumber(item.minPrice) ? item.minPrice : 0,
    maxPrice: isFiniteNumber(item.maxPrice) ? item.maxPrice : 0,
    images: safeImages,
    categories,
    thumbnail: normalizeThumbnail(item.thumbnail, safeImages[0], fallbackIndex),
  };
}

export default function Products() {
  const [activeCategory, setActiveCategory] = useState('all');

  const { landingProductList: categorySourceList } = useLandingProduct({
    search: '',
    page: 1,
    limit: 20,
  });

  const normalizedCategorySourceProducts = useMemo<BasicProduct[]>(() => {
    const normalized = Array.isArray(categorySourceList?.products)
      ? categorySourceList.products
          .map((product, index) => normalizeProduct(product, index))
          .filter((product): product is BasicProduct => product !== null)
      : [];

    return normalized;
  }, [categorySourceList]);

  const realCategories = useMemo<DisplayCategory[]>(() => {
    const map = new Map<string, DisplayCategory>();

    for (const product of normalizedCategorySourceProducts) {
      for (const category of product.categories ?? []) {
        if (!category?.id || !category?.name) continue;

        if (!map.has(category.id)) {
          map.set(category.id, { id: category.id, name: category.name });
        }
      }
    }

    return Array.from(map.values());
  }, [normalizedCategorySourceProducts]);

  const displayCategories = useMemo<DisplayCategory[]>(() => {
    const result: DisplayCategory[] = [
      { id: 'all', name: 'All' },
      ...realCategories.slice(0, 3),
    ];

    if (result.length < 4) {
      const usedIds = new Set(result.map((category) => category.id));

      for (const mockCategory of MOCK_CATEGORIES) {
        if (!usedIds.has(mockCategory.id)) {
          result.push(mockCategory);
          usedIds.add(mockCategory.id);
        }

        if (result.length === 4) {
          break;
        }
      }
    }

    return result.slice(0, 4);
  }, [realCategories]);

  const realCategoryIds = useMemo(
    () => new Set(realCategories.map((category) => category.id)),
    [realCategories]
  );

  const selectedCategoryIds =
    activeCategory !== 'all' && realCategoryIds.has(activeCategory)
      ? [activeCategory]
      : undefined;

  const { landingProductList: displayProductList } = useLandingProduct({
    search: '',
    categoryIds: selectedCategoryIds,
    page: 1,
    limit: 5,
  });

  const normalizedFetchedDisplayProducts = useMemo<BasicProduct[]>(() => {
    const normalized = Array.isArray(displayProductList?.products)
      ? displayProductList.products
          .map((product, index) => normalizeProduct(product, index))
          .filter((product): product is BasicProduct => product !== null)
      : [];

    return normalized;
  }, [displayProductList]);

  const realProducts =
    activeCategory === 'all' || realCategoryIds.has(activeCategory)
      ? normalizedFetchedDisplayProducts
      : [];

  const displayProducts = useMemo<BasicProduct[]>(() => {
    const result: BasicProduct[] = [...realProducts.slice(0, 5)];

    if (result.length < 5) {
      const usedIds = new Set(result.map((product) => product.id));

      const mockPool =
        activeCategory === 'all'
          ? MOCK_PRODUCTS
          : MOCK_PRODUCTS.filter((product) =>
              product.categories.some((category) => category.id === activeCategory)
            );

      for (const mockProduct of mockPool) {
        if (!usedIds.has(mockProduct.id)) {
          result.push(mockProduct);
          usedIds.add(mockProduct.id);
        }

        if (result.length === 5) {
          break;
        }
      }
    }

    return result.slice(0, 5);
  }, [realProducts, activeCategory]);

  return (
    <section id="products" className="bg-white py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.65 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-serif text-stone-800 md:text-4xl lg:text-5xl">
            Our Products
          </h2>
          <p className="mt-4 text-stone-500">
            Preview our collection. Sign in to explore full catalog.
          </p>
        </motion.div>

        <div className="mb-12 flex flex-wrap justify-center gap-4">
          {displayCategories.map((category, index) => (
            <motion.button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`w-48 rounded-2xl px-6 py-2 text-sm font-medium tracking-wide transition-all duration-300 ${
                activeCategory === category.id
                  ? 'bg-stone-800 text-white shadow-md'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {category.name}
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {displayProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="mt-12 text-center"
        >
          <Link
            href="/products"
            className="inline-flex items-center rounded-xl border border-green-900 px-8 py-3 font-medium tracking-wide text-green-900 transition-colors duration-300 hover:bg-green-800 hover:text-white"
          >
            View all products
            <svg
              className="ml-2 h-5 w-5 transform transition-transform duration-300 group-hover:translate-x-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
