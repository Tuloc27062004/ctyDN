'use client';

import { motion } from 'framer-motion';

const statItems = [
  { value: '20+', label: 'Years Experience' },
  { value: '500+', label: 'Unique Designs' },
  { value: '50+', label: 'Countries' },
];

export default function About() {
  return (
    <section id="about" className="py-20 md:py-32 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -36, y: 20 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.35 }}
              className="aspect-4/5 bg-stone-200 overflow-hidden rounded-2xl"
            >
              <img
                src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&q=80"
                alt="EcoCrete Vietnam"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-[#E8F5E9] -z-10 rounded-2xl"></div>
            <div className="absolute -top-8 -left-8 w-32 h-32 border-2 border-stone-300 -z-10 rounded-2xl"></div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 36, y: 20 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.75, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-serif text-stone-800 mb-6 leading-tight"
            >
              About EcoCrete Vietnam
            </motion.h2>

            <div className="space-y-4">
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.18 }}
                className="text-stone-600 leading-relaxed"
              >
                At Ecocrete Vietnam, we craft more than concrete—we shape materials into timeless pieces for modern living.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.24 }}
                className="text-stone-600 leading-relaxed"
              >
                With nearly 20 years of experience in concrete and poly production, our work is defined by precision, craftsmanship, and a deep respect for natural aesthetics. Every piece is handcrafted, carrying subtle variations that reflect authenticity and refined quality.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.30 }}
                className="text-stone-600 leading-relaxed"
              >
                Operating from a 3,000 m² facility with a capacity of up to over 25 containers per month, we ensure reliable production, consistent standards, and seamless export for global partners.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.36 }}
                className="text-stone-600 leading-relaxed"
              >
                Rooted in simplicity and sustainability, Ecocrete Vietnam creates products that integrate effortlessly into architecture, landscapes, and contemporary lifestyles.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.42 }}
                className="text-stone-600 leading-relaxed"
              >
                We are not just a manufacturer—we are a partner in building lasting value.
              </motion.p>
            </div>

            <div className="mt-8 flex items-center space-x-8">
              {statItems.map((item, index) => (
                <div key={item.label} className="flex items-center">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: 0.28 + index * 0.08 }}
                  >
                    <div className="text-3xl font-serif text-stone-800">{item.value}</div>
                    <div className="text-sm text-stone-500 tracking-wide">{item.label}</div>
                  </motion.div>

                  {index < statItems.length - 1 && (
                    <div className="w-px h-12 bg-stone-300 mx-8"></div>
                  )}
                </div>
              ))}
            </div>

            <motion.a
              href="/blogs"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="inline-flex items-center mt-8 text-stone-800 font-medium tracking-wide group"
            >
              Discover Our Story
              <svg
                className="w-5 h-5 ml-2 transform transition-transform duration-300 group-hover:translate-x-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}