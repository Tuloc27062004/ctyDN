"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SessionInquiryItem } from "@/types/cart.type";

export const INQUIRY_CART_STORAGE_KEY = "inquiry_cart_v2";
const LEGACY_INQUIRY_CART_STORAGE_KEY = "inquiry_cart_v1";

export function buildInquiryItemKey(
  productId: string,
  patternId?: string | null,
  colorId?: string | null
) {
  return `${productId}::${patternId ?? "none"}::${colorId ?? "none"}`;
}

function normalizeStoredItem(raw: unknown): SessionInquiryItem | null {
  if (!raw || typeof raw !== "object") return null;

  const item = raw as Partial<SessionInquiryItem> & {
    productId?: unknown;
    name?: unknown;
    thumbnail?: unknown;
    quantity?: unknown;
    minPrice?: unknown;
    maxPrice?: unknown;
    patternId?: unknown;
    patternName?: unknown;
    colorId?: unknown;
    colorName?: unknown;
    colorHex?: unknown;
    previewImage?: unknown;
    model3dId?: unknown;
    modelPreviewImage?: unknown;
    itemKey?: unknown;
  };

  const productId = typeof item.productId === "string" ? item.productId : null;
  const name = typeof item.name === "string" ? item.name : null;

  if (!productId || !name) return null;

  const quantity =
    typeof item.quantity === "number" && Number.isFinite(item.quantity) && item.quantity > 0
      ? Math.floor(item.quantity)
      : 1;

  const patternId = typeof item.patternId === "string" ? item.patternId : null;
  const colorId = typeof item.colorId === "string" ? item.colorId : null;

  return {
    itemKey:
      typeof item.itemKey === "string" && item.itemKey.trim().length > 0
        ? item.itemKey
        : buildInquiryItemKey(productId, patternId, colorId),
    productId,
    name,
    thumbnail: typeof item.thumbnail === "string" ? item.thumbnail : null,
    quantity,
    minPrice:
      typeof item.minPrice === "number" && Number.isFinite(item.minPrice)
        ? item.minPrice
        : null,
    maxPrice:
      typeof item.maxPrice === "number" && Number.isFinite(item.maxPrice)
        ? item.maxPrice
        : null,
    patternId,
    patternName: typeof item.patternName === "string" ? item.patternName : null,
    colorId,
    colorName: typeof item.colorName === "string" ? item.colorName : null,
    colorHex: typeof item.colorHex === "string" ? item.colorHex : null,
    previewImage: typeof item.previewImage === "string" ? item.previewImage : null,
    model3dId: typeof item.model3dId === "string" ? item.model3dId : null,
    modelPreviewImage:
      typeof item.modelPreviewImage === "string" ? item.modelPreviewImage : null,
  };
}

interface InquiryCartContextType {
  items: SessionInquiryItem[];
  totalItems: number;
  addItem: (item: Omit<SessionInquiryItem, "quantity">, quantity?: number) => void;
  updateQuantity: (itemKey: string, quantity: number) => void;
  removeItem: (itemKey: string) => void;
  clearItems: () => void;
}

const InquiryCartContext = createContext<InquiryCartContextType | undefined>(
  undefined
);

export default function InquiryCartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<SessionInquiryItem[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    try {
      const nextRaw = sessionStorage.getItem(INQUIRY_CART_STORAGE_KEY);
      const legacyRaw = sessionStorage.getItem(LEGACY_INQUIRY_CART_STORAGE_KEY);
      const source = nextRaw ?? legacyRaw;

      if (source) {
        const parsed = JSON.parse(source) as unknown[];
        const normalized = Array.isArray(parsed)
          ? parsed
              .map((entry) => normalizeStoredItem(entry))
              .filter((entry): entry is SessionInquiryItem => entry !== null)
          : [];

        setItems(normalized);
      }
    } catch {
      setItems([]);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    sessionStorage.setItem(INQUIRY_CART_STORAGE_KEY, JSON.stringify(items));
    sessionStorage.removeItem(LEGACY_INQUIRY_CART_STORAGE_KEY);
  }, [items, hasHydrated]);

  const addItem = (item: Omit<SessionInquiryItem, "quantity">, quantity = 1) => {
    const safeQuantity = Math.max(1, Math.floor(quantity));

    setItems((prev) => {
      const existing = prev.find((entry) => entry.itemKey === item.itemKey);

      if (existing) {
        return prev.map((entry) =>
          entry.itemKey === item.itemKey
            ? {
                ...entry,
                ...item,
                quantity: entry.quantity + safeQuantity,
              }
            : entry
        );
      }

      return [...prev, { ...item, quantity: safeQuantity }];
    });
  };

  const updateQuantity = (itemKey: string, quantity: number) => {
    const safeQuantity = Math.max(1, Math.floor(quantity || 1));

    setItems((prev) =>
      prev.map((entry) =>
        entry.itemKey === itemKey ? { ...entry, quantity: safeQuantity } : entry
      )
    );
  };

  const removeItem = (itemKey: string) => {
    setItems((prev) => prev.filter((entry) => entry.itemKey !== itemKey));
  };

  const clearItems = () => {
    setItems([]);
  };

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      totalItems,
      addItem,
      updateQuantity,
      removeItem,
      clearItems,
    }),
    [items, totalItems]
  );

  return (
    <InquiryCartContext.Provider value={value}>
      {children}
    </InquiryCartContext.Provider>
  );
}

export function useInquiryCart() {
  const context = useContext(InquiryCartContext);

  if (!context) {
    throw new Error("useInquiryCart must be used within InquiryCartProvider");
  }

  return context;
}
