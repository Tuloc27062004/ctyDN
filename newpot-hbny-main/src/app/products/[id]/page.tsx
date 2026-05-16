"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Product3DViewer from "@/components/product/Product3DViewer";
import ProductImageGallery from "@/components/product/ProductImageGallery";
import ProductCard from "@/components/product/ProductCard";
import ProductConfigurator from "@/components/product/ProductConfigurator";
import { useDetailedProduct } from "@/hooks/useDetailedProduct";
import LoadingScreen from "@/components/LoadingScreen";
import { buildInquiryItemKey, useInquiryCart } from "@/hooks/useInquiryCart";
import { getFallbackPreviewImage } from "@/lib/product-preview";
import type { Product3DModel } from "@/types/product.type";

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

function getUsable3DModelUrl(model?: Product3DModel | null) {
  return model?.pbrModelGlbUrl ?? model?.modelGlbUrl ?? model?.baseModelGlbUrl ?? null;
}

function pickReady3DModel(
  models: Product3DModel[] | undefined,
  defaultModel?: Product3DModel | null
) {
  const defaultModelUrl = getUsable3DModelUrl(defaultModel);

  if (defaultModel?.status === "READY" && defaultModelUrl) {
    return defaultModel;
  }

  if (!Array.isArray(models) || models.length === 0) {
    return null;
  }

  return models.find((model) => model.status === "READY" && getUsable3DModelUrl(model)) ?? null;
}

export default function ProductDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;

  const { product, isLoading } = useDetailedProduct(id);
  const { addItem } = useInquiryCart();

  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);

  useEffect(() => {
    const patternId = searchParams.get("patternId");
    const colorId = searchParams.get("colorId");

    setSelectedPatternId(patternId || null);
    setSelectedColorId(colorId || null);
  }, [product?.id, searchParams]);

  const effectivePatternId = selectedPatternId;
  const effectiveColorId = selectedColorId;

  const selectedPattern = useMemo(
    () =>
      product?.availablePatterns.find((pattern) => pattern.id === effectivePatternId) ?? null,
    [effectivePatternId, product]
  );

  const selectedColor = useMemo(
    () => product?.availableColors.find((color) => color.id === effectiveColorId) ?? null,
    [effectiveColorId, product]
  );

  const selected3dModel = useMemo(
    () => pickReady3DModel(product?.models3d, product?.default3dModel),
    [product?.default3dModel, product?.models3d]
  );

  const selectedModelUrl = useMemo(
    () => getUsable3DModelUrl(selected3dModel),
    [selected3dModel]
  );

  const hasReady3DModel = Boolean(selectedModelUrl);

  const fallbackThumbnail = useMemo(
    () => getFallbackPreviewImage(product?.images),
    [product?.images]
  );

  const previewImageForUi = useMemo(() => {
    if (!hasReady3DModel) {
      return null;
    }

    return selected3dModel?.previewImageUrl ?? fallbackThumbnail;
  }, [hasReady3DModel, selected3dModel, fallbackThumbnail]);

  const effectivePattern = selectedPattern;
  const effectiveColor = selectedColor;

  const isDefaultPatternSelected = selectedPatternId === null;
  const isDefaultColorSelected = selectedColorId === null;

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!product) {
    return (
      <>
        <Header />
        <main className="pt-20">
          <section className="py-24">
            <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
              <h1 className="text-3xl font-serif text-stone-800">Product not found</h1>
              <p className="mt-4 text-stone-600">
                The product you are looking for is unavailable or may have been removed.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Link
                  href="/products"
                  className="rounded-md bg-green-700 px-5 py-3 text-white transition hover:bg-green-800"
                >
                  Browse products
                </Link>
                <Link
                  href="/"
                  className="rounded-md border border-stone-300 px-5 py-3 text-stone-700 transition hover:bg-stone-50"
                >
                  Back home
                </Link>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const handleAddToInquiry = () => {
    const itemKey = buildInquiryItemKey(
      product.id,
      effectivePattern?.id ?? null,
      effectiveColor?.id ?? null
    );

    const payload = {
      itemKey,
      productId: product.id,
      name: product.name,
      thumbnail: fallbackThumbnail,
      previewImage: previewImageForUi ?? fallbackThumbnail,
      model3dId: hasReady3DModel ? selected3dModel?.id ?? null : null,
      modelPreviewImage: hasReady3DModel ? selected3dModel?.previewImageUrl ?? null : null,
      minPrice: product.minPrice ?? null,
      maxPrice: product.maxPrice ?? null,
      patternId: effectivePattern?.id ?? null,
      patternName: isDefaultPatternSelected ? "Default" : effectivePattern?.name ?? null,
      colorId: effectiveColor?.id ?? null,
      colorName: isDefaultColorSelected ? "Default" : effectiveColor?.name ?? null,
      colorHex: isDefaultColorSelected ? null : effectiveColor?.hex ?? null,
    };

    addItem(payload, 1);
    toast.success(
      hasReady3DModel
        ? "Added configured product to quote list"
        : "Added product to quote list"
    );
  };

  return (
    <>
      <Header />
      <main className="pt-20">
        <div className="bg-stone-50 py-4">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center space-x-2 text-sm text-stone-600">
              <Link href="/" className="hover:text-stone-900">
                Home
              </Link>
              <span>/</span>
              <Link href="/products" className="hover:text-stone-900">
                Products
              </Link>
              <span>/</span>
              <span className="text-stone-900">{product.name}</span>
            </nav>
          </div>
        </div>

        <section className="py-12 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
              <div className="space-y-6">
                {hasReady3DModel ? (
                  <Product3DViewer
                    modelUrl={selectedModelUrl}
                    selectedColor={effectiveColor}
                    selectedPattern={effectivePattern}
                  />
                ) : null}

                <ProductImageGallery
                  images={product.images}
                  previewImageUrl={previewImageForUi}
                  previewAlt={`${product.name} preview`}
                />
              </div>

              <div>
                <span className="text-sm font-medium uppercase tracking-widest text-[#228B22]">
                  {product.categories[0]?.name?.replace(/-/g, " ") ?? "Uncategorized"}
                </span>

                <h1 className="mt-2 mb-2 text-3xl font-serif text-stone-800 md:text-4xl lg:text-5xl">
                  {product.name}
                </h1>

                <div className="mb-6 text-lg font-semibold text-stone-700">
                  {formatPriceRange(product.minPrice, product.maxPrice)}
                </div>

                <p className="mb-8 leading-relaxed text-stone-600">{product.description}</p>

                {hasReady3DModel ? (
                  <>
                    <ProductConfigurator
                      product={product}
                      selectedPatternId={selectedPatternId}
                      selectedColorId={selectedColorId}
                      onChangePattern={setSelectedPatternId}
                      onChangeColor={setSelectedColorId}
                    />

                    <div className="mt-6 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-600">
                      <div className="flex flex-wrap items-center gap-3">
                        <span>
                          Pattern:{" "}
                          <strong className="text-stone-800">
                            {isDefaultPatternSelected
                              ? "Default"
                              : effectivePattern?.name ?? "Default"}
                          </strong>
                        </span>

                        <span className="inline-flex items-center gap-2">
                          Color:
                          <span
                            className="h-4 w-4 rounded-full border border-stone-300"
                            style={{
                              backgroundColor: isDefaultColorSelected
                                ? "transparent"
                                : effectiveColor?.hex ?? "transparent",
                            }}
                            aria-hidden="true"
                          />
                          <strong className="text-stone-800">
                            {isDefaultColorSelected
                              ? "Default"
                              : effectiveColor?.name ?? "Default"}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </>
                ) : null}

                <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleAddToInquiry}
                    className="flex-1 rounded-md bg-green-700 px-4 py-3 text-sm font-medium tracking-wide text-white transition hover:bg-green-800"
                  >
                    Add to Quote List
                  </button>

                  <Link
                    href="/contact"
                    className="flex-1 rounded-md border-2 border-green-800 px-8 py-3 text-center font-medium tracking-wide text-stone-800 transition-colors hover:bg-green-800 hover:text-white"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {product.relatedProducts?.length > 0 && (
          <section className="bg-stone-50 py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="mb-10 text-center text-2xl font-serif text-stone-800 md:text-3xl">
                Recommended Products
              </h2>

              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                {product.relatedProducts.map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
