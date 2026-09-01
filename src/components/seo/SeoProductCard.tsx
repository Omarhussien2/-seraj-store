import Link from "next/link";
import type { SeoProduct } from "@/lib/seoContent";
import {
  encodedPath,
  productDescription,
  productImageUrl,
} from "@/lib/seoContent";

type SeoProductCardProps = {
  product: SeoProduct;
};

export default function SeoProductCard({ product }: SeoProductCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-[#dcc9ad] bg-white shadow-sm">
      <img
        alt={product.name}
        className="h-56 w-full object-cover"
        loading="lazy"
        src={productImageUrl(product)}
      />
      <div className="space-y-3 p-5">
        {product.badge && (
          <p className="text-sm font-bold text-[#1f7a5c]">{product.badge}</p>
        )}
        <h2 className="text-xl font-extrabold">{product.name}</h2>
        <p className="min-h-16 text-sm leading-7 text-[#67594e]">
          {productDescription(product)}
        </p>
        <div className="flex items-center justify-between gap-3">
          <strong className="text-lg text-[#8a4316]">
            {product.priceText || `${product.price} ج.م`}
          </strong>
          <Link
            className="rounded-md bg-[#1f7a5c] px-4 py-2 text-sm font-bold text-white"
            href={encodedPath("/product", product.slug)}
          >
            تفاصيل المنتج
          </Link>
        </div>
      </div>
    </article>
  );
}
