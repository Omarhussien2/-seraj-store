import {
  getActiveProducts,
  productDescription,
  productImageUrl,
  siteUrl,
} from "@/lib/seoContent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function escapeXml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const products = (await getActiveProducts()).filter(
    (product) => product.price > 0 && product.action !== "none"
  );
  const productItems = products.map((product) => {
    const productUrl = siteUrl(`/product/${encodeURIComponent(product.slug)}`);
    const availability = product.comingSoon ? "preorder" : "in_stock";

    return `
      <item>
        <g:id>${escapeXml(product.slug)}</g:id>
        <title>${escapeXml(product.name)}</title>
        <description>${escapeXml(productDescription(product))}</description>
        <link>${escapeXml(productUrl)}</link>
        <g:image_link>${escapeXml(productImageUrl(product))}</g:image_link>
        <g:availability>${availability}</g:availability>
        <g:price>${product.price.toFixed(2)} EGP</g:price>
        <g:condition>new</g:condition>
        <g:brand>سراج</g:brand>
        <g:product_type>${escapeXml(product.category || "كتب وقصص أطفال")}</g:product_type>
        <g:identifier_exists>false</g:identifier_exists>
      </item>`;
  });

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>منتجات سراج</title>
    <link>${siteUrl("/")}</link>
    <description>قصص أطفال عربية مخصصة وكتب وألعاب تعليمية من سراج</description>${productItems.join("")}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
