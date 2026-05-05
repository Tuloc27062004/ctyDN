import { BasicProduct } from '@/types/product.type';
import Link from 'next/link';
import ProtectedImage from '@/components/protection/ProtectedImage';

interface ProductCardProps {
  product: BasicProduct;
}

const PLACEHOLDER_IMAGE =
  'https://via.placeholder.com/300?text=No+Image';

export default function ProductCard({ product }: ProductCardProps) {
  const safeName =
    typeof product?.name === 'string' && product.name.trim().length > 0
      ? product.name
      : 'Unnamed Product';

  const safeImage =
    typeof product?.thumbnail?.url === 'string' && product.thumbnail.url.trim().length > 0
      ? product.thumbnail.url
      : PLACEHOLDER_IMAGE;

  const safeCategories = Array.isArray(product?.categories)
    ? product.categories.filter(
        (
          cat
        ): cat is {
          id: string;
          name: string;
        } =>
          Boolean(
            cat &&
              typeof cat.id === 'string' &&
              cat.id.trim().length > 0 &&
              typeof cat.name === 'string' &&
              cat.name.trim().length > 0
          )
      )
    : [];

  return (
    <Link href={`/products/${product.id}`} className="group">
      <div className="relative mb-4 aspect-square overflow-hidden rounded-2xl bg-stone-100">
        <ProtectedImage
          src={safeImage}
          alt={safeName}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/20">
          <span className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-stone-800 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            View Details
          </span>
        </div>
      </div>

      <h3 className="text-center font-medium tracking-wide text-stone-800 transition-colors group-hover:text-[#228B22]">
        {safeName}
      </h3>

      <p className="mt-1 text-center text-sm capitalize text-stone-500">
        {safeCategories.length > 0
          ? safeCategories.map((cat) => cat.name).join(', ')
          : 'Uncategorized'}
      </p>
    </Link>
  );
}