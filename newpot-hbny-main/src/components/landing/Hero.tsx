'use client';

import { useHeros } from '@/hooks/useHeros';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type HeroSlide = {
  thumbnail: {
    id: string;
    url: string;
  };
  name: string;
  description: string;
};

const mockHeros: HeroSlide[] = [
  {
    thumbnail: {
      id: 'thumb-1',
      url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1920&q=80',
    },
    name: 'New Contemporary Trend',
    description: 'Naturally Handcrafted Collections',
  },
  {
    thumbnail: {
      id: 'thumb-2',
      url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1920&q=80',
    },
    name: 'Artisan Planters',
    description: 'Eco-Friendly Design',
  },
  {
    thumbnail: {
      id: 'thumb-3',
      url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=1920&q=80',
    },
    name: 'Garden Collection',
    description: 'Bonded to Nature',
  },
];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeHero(raw: unknown, index: number): HeroSlide | null {
  if (!raw || typeof raw !== 'object') return null;

  const item = raw as {
    name?: unknown;
    description?: unknown;
    thumbnail?: { id?: unknown; url?: unknown } | null;
  };

  const name = isNonEmptyString(item.name) ? item.name : null;
  const description = isNonEmptyString(item.description)
    ? item.description
    : 'Explore our featured collection';
  const thumbnailUrl = isNonEmptyString(item.thumbnail?.url)
    ? item.thumbnail.url
    : null;

  if (!name || !thumbnailUrl) return null;

  return {
    thumbnail: {
      id: isNonEmptyString(item.thumbnail?.id)
        ? item.thumbnail.id
        : `hero-thumb-${index}`,
      url: thumbnailUrl,
    },
    name,
    description,
  };
}

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { heros, isLoading, isFetched } = useHeros();

  const slides = useMemo<HeroSlide[]>(() => {
    const normalized = Array.isArray(heros)
      ? heros
          .map((item, index) => normalizeHero(item, index))
          .filter((item): item is HeroSlide => item !== null)
      : [];

    if (normalized.length > 0) return normalized;

    // Do not show mock data while still loading.
    if (isLoading || !isFetched) return [];

    // Only fallback after fetch is finished and still no usable data.
    return mockHeros;
  }, [heros, isLoading, isFetched]);

  useEffect(() => {
    if (slides.length === 0) return;

    if (currentSlide >= slides.length) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <section className="relative h-screen w-full overflow-hidden bg-stone-900">
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 flex h-full items-center justify-center px-4 text-center">
          <div className="max-w-4xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.25em] text-white/60 backdrop-blur-sm">
              Crafted for Green Living
            </div>

            <div className="mb-6 h-12 w-72 animate-pulse rounded bg-white/10 md:h-16 md:w-96 lg:h-20 lg:w-[32rem]" />
            <div className="mx-auto mb-8 h-6 w-64 animate-pulse rounded bg-white/10 md:w-80" />

            <div className="space-x-4">
              <div className="inline-block h-12 w-44 animate-pulse rounded-xl bg-white/10" />
              <div className="inline-block h-12 w-36 animate-pulse rounded-xl bg-white/10" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const activeSlide = slides[currentSlide] ?? slides[0];

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={slide.thumbnail.id || index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className={`absolute inset-0 bg-cover bg-center transition-transform duration-[7000ms] ${
              index === currentSlide ? 'scale-105' : 'scale-100'
            }`}
            style={{ backgroundImage: `url(${slide.thumbnail.url})` }}
          >
            <div className="absolute inset-0 bg-black/35" />
          </div>
        </div>
      ))}

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
        <div className="max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeSlide.name}-${currentSlide}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-white/85 backdrop-blur-sm"
              >
                Crafted for Green Living
              </motion.div>

              <motion.h1
                className="mb-6 font-serif text-4xl font-light tracking-wide text-white md:text-6xl lg:text-7xl"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.12 }}
              >
                {activeSlide.name}
              </motion.h1>

              <motion.p
                className="mb-8 text-lg font-light tracking-wider text-white/90 md:text-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.22 }}
              >
                {activeSlide.description}
              </motion.p>

              <motion.div
                className="space-x-4"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.32 }}
              >
                <a
                  href="#products"
                  className="inline-block rounded-xl bg-white px-8 py-3 font-medium tracking-wide text-stone-800 shadow-md transition-colors duration-300 hover:bg-stone-100"
                >
                  Explore Collections
                </a>
                <a
                  href="#about"
                  className="inline-block rounded-xl border border-white px-8 py-3 font-medium tracking-wide text-white transition-colors duration-300 hover:bg-white/10"
                >
                  Learn More
                </a>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-8 bg-white'
                  : 'w-3 bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="absolute bottom-10 right-10 hidden md:block"
        >
          <div className="flex flex-col items-center text-white/80">
            <span className="origin-center translate-y-8 rotate-90 text-xs tracking-widest">
              SCROLL
            </span>
            <motion.div
              animate={{ y: [0, 8, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="mt-12 h-16 w-px bg-white/50"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
