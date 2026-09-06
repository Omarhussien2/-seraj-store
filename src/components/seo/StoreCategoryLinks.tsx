import Link from "next/link";
import { SEO_CATEGORIES } from "@/lib/seoCategories";

export default function StoreCategoryLinks() {
  return (
    <nav className="space-y-4 rounded-lg border border-[#dcc9ad] bg-white p-6" aria-label="قصص وألعاب متجر سراج">
      <h2 className="text-2xl font-extrabold">اكتشف قصص وألعاب سراج للأطفال</h2>
      <p className="leading-8 text-[#5f5044]">من القراءة مع طفلك إلى اللعب سويًا: تصفح القصص العربية والإسلامية، والألعاب التعليمية، أو اختر قصة مخصصة يكون طفلك بطلها.</p>
      <div className="flex flex-wrap gap-3">
        {SEO_CATEGORIES.map((category) => (
          <Link className="rounded-md bg-[#f7f1e7] px-4 py-3 font-bold text-[#1f7a5c]" href={`/category/${category.slug}`} key={category.slug}>
            {category.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
