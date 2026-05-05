"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../provider/auth-provider";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useInquiryCart } from "@/hooks/useInquiryCart";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { user, logout, isLoggingOut } = useAuth();
  const { totalItems, clearItems } = useInquiryCart();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/blogs", label: "Blogs" },
    { href: "/contact", label: "Contact" },
    ...(user ? [{ href: "/inquiry", label: "Quote List" }] : []),
  ];

  const handleLogout = async () => {
    clearItems();
    await logout();
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-md"
            : "bg-white/75 backdrop-blur-sm shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`flex items-center justify-between transition-all duration-300 ${
              scrolled ? "h-18" : "h-20"
            }`}
          >
            <Link href="/" className="flex items-center">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-2xl font-serif font-bold tracking-wider text-center"
              >
                <span className="text-green-700">ECO</span>
                <span className="text-stone-800">CRETE</span>
                <span className="block text-xs font-normal tracking-[0.3em] text-stone-600">
                  VIETNAM
                </span>
              </motion.div>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link, index) => {
                const isActive = pathname === link.href;

                return (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 * index }}
                  >
                    <Link
                      href={link.href}
                      className={`text-sm font-medium tracking-wide transition-colors duration-200 relative group ${
                        isActive
                          ? "text-green-900"
                          : "text-green-700 hover:text-green-900"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        {link.label}

                        {link.href === "/inquiry" && totalItems > 0 && (
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-green-700 px-1.5 text-[11px] font-semibold leading-none text-white">
                            {totalItems}
                          </span>
                        )}
                      </span>

                      <span
                        className={`absolute -bottom-1 left-0 h-0.5 bg-green-700 transition-all duration-300 ${
                          isActive ? "w-full" : "w-0 group-hover:w-full"
                        }`}
                      />
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="hidden lg:inline text-stone-700">
                    Welcome, <b>{user.fullName}</b>
                  </span>

                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="text-sm font-medium border border-green-700 text-green-700 hover:bg-green-50 transition px-4 py-2 rounded-md disabled:opacity-60"
                  >
                    {isLoggingOut ? "Logging out..." : "Log out"}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/sign-in">
                    <button className="text-sm font-medium border border-green-700 text-green-700 hover:bg-green-50 transition px-4 py-2 rounded-md">
                      Sign In
                    </button>
                  </Link>

                  <Link href="/sign-up">
                    <button className="text-sm font-medium bg-green-700 text-white hover:bg-green-800 transition px-4 py-2 rounded-md shadow-sm hover:shadow-md">
                      Sign Up
                    </button>
                  </Link>
                </>
              )}

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-stone-600 hover:text-stone-900 transition-colors"
                aria-label="Toggle mobile menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28 }}
              className="md:hidden bg-white border-t border-stone-100 overflow-hidden"
            >
              <nav className="px-4 py-4 space-y-3">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: index * 0.04 }}
                  >
                    <Link
                      href={link.href}
                      className="flex items-center justify-between text-stone-700 hover:text-stone-900 text-sm font-medium py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>{link.label}</span>

                      {link.href === "/inquiry" && totalItems > 0 && (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-green-700 px-1.5 text-[11px] font-semibold leading-none text-white">
                          {totalItems}
                        </span>
                      )}
                    </Link>
                  </motion.div>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}