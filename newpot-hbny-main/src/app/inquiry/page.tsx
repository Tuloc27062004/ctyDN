"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { useInquiryCart } from "@/hooks/useInquiryCart";
import { addToCartApi, clearCartApi } from "@/apis/cart/cart.api";

function formatPriceRange(minPrice: number | null, maxPrice: number | null) {
  if (minPrice != null && maxPrice != null) {
    return `$${minPrice} - $${maxPrice}`;
  }

  if (minPrice != null) {
    return `From $${minPrice}`;
  }

  if (maxPrice != null) {
    return `Up to $${maxPrice}`;
  }

  return "Contact for price";
}

export default function InquiryPage() {
  const router = useRouter();
  const { items, totalItems, updateQuantity, removeItem, clearItems } =
    useInquiryCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitQuoteRequest = async () => {
    if (items.length === 0) {
      toast.error("Your quote list is empty.");
      return;
    }

    try {
      setIsSubmitting(true);

      await clearCartApi();

      for (const item of items) {
        await addToCartApi({
          productId: item.productId,
          patternId: item.patternId ?? null,
          colorId: item.colorId ?? null,
          model3dId: item.model3dId ?? null,
          quantity: item.quantity,
        });
      }

      clearItems();
      toast.success("Quote request sent successfully.");
      router.push("/contact");
    } catch (error: any) {
      toast.error("Failed to send quote request", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />

      <main className="pt-20">
        <div className="bg-stone-50 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center space-x-2 text-sm text-stone-600">
              <Link href="/" className="hover:text-stone-900">
                Home
              </Link>
              <span>/</span>
              <span className="text-stone-900">Quote List</span>
            </nav>
          </div>
        </div>

        <section className="py-12 md:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-serif text-stone-800">
                  Quote List
                </h1>
                <p className="mt-2 text-stone-600">
                  Review selected products before sending your quote request.
                </p>
              </div>

              <Link
                href="/products"
                className="inline-flex items-center justify-center px-5 py-3 border border-green-700 text-green-700 rounded-md hover:bg-green-50 transition"
              >
                Continue browsing
              </Link>
            </div>

            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center">
                <h2 className="text-xl font-semibold text-stone-800">
                  Your quote list is empty
                </h2>
                <p className="mt-2 text-stone-600">
                  Add products first, then send your quote request.
                </p>

                <Link
                  href="/products"
                  className="inline-flex mt-6 items-center justify-center px-5 py-3 bg-green-700 text-white rounded-md hover:bg-green-800 transition"
                >
                  Browse products
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const displayImage =
                    item.modelPreviewImage || item.previewImage || item.thumbnail || null;

                  return (
                    <div
                      key={item.itemKey}
                      className="rounded-xl border border-stone-200 bg-white p-4 md:p-5"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="h-24 w-24 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                          {displayImage ? (
                            <img
                              src={displayImage}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs text-stone-500">
                              No image
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <h2 className="text-lg font-semibold text-stone-800">
                            {item.name}
                          </h2>
                          <p className="mt-1 text-sm text-stone-500">
                            {formatPriceRange(item.minPrice, item.maxPrice)}
                          </p>

                          {(item.patternName || item.colorName) && (
                            <div className="mt-2 space-y-1 text-sm text-stone-600">
                              {item.patternName && (
                                <p>
                                  Pattern:{" "}
                                  <span className="font-medium text-stone-800">
                                    {item.patternName}
                                  </span>
                                </p>
                              )}
                              {item.colorName && (
                                <p className="inline-flex items-center gap-2">
                                  <span>
                                    Color:{" "}
                                    <span className="font-medium text-stone-800">
                                      {item.colorName}
                                    </span>
                                  </span>
                                  {item.colorHex && (
                                    <span
                                      className="h-4 w-4 rounded-full border border-stone-300"
                                      style={{ backgroundColor: item.colorHex }}
                                      aria-hidden="true"
                                    />
                                  )}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.itemKey, item.quantity - 1)}
                            className="h-10 w-10 rounded-md border border-stone-300 text-stone-700 hover:bg-stone-50"
                          >
                            -
                          </button>

                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(event) => {
                              const nextValue = Number(event.target.value);
                              if (Number.isNaN(nextValue)) return;
                              updateQuantity(item.itemKey, nextValue);
                            }}
                            className="h-10 w-20 rounded-md border border-stone-300 text-center"
                          />

                          <button
                            type="button"
                            onClick={() => updateQuantity(item.itemKey, item.quantity + 1)}
                            className="h-10 w-10 rounded-md border border-stone-300 text-stone-700 hover:bg-stone-50"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.itemKey)}
                          className="text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-stone-500">
                        Total selected quantity
                      </p>
                      <p className="text-2xl font-semibold text-stone-800">
                        {totalItems}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSubmitQuoteRequest}
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center px-6 py-3 bg-green-700 text-white rounded-md hover:bg-green-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Sending..." : "Send Quote Request"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
