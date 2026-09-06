import Markdown, { defaultUrlTransform } from "react-markdown";
import type { SeoArticle } from "@/lib/seoContent";

export default function ArticleContent({ article }: { article: SeoArticle }) {
  return (
    <div className="space-y-6">
      <section className="min-w-0 space-y-5 break-words rounded-lg bg-white p-6 leading-8 shadow-sm [&_h2]:text-2xl [&_h2]:font-extrabold [&_h3]:text-xl [&_h3]:font-bold [&_a]:text-[#1f7a5c] [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ms-6 [&_pre]:overflow-x-auto [&_img]:max-w-full">
        <Markdown skipHtml components={{ h1: ({ children }) => <h2>{children}</h2> }}>
          {article.contentMarkdown?.trim() || article.excerpt}
        </Markdown>
      </section>
      {!!article.sources?.length && (
        <section className="space-y-3 rounded-lg bg-white p-6" aria-label="مصادر المقال">
          <h2 className="text-xl font-extrabold">المصادر والمراجع</h2>
          <ul className="space-y-3 break-words leading-7">
            {article.sources.map((source, index) => {
              const href = source.url && defaultUrlTransform(source.url);
              return (
                <li key={`${source.label}-${index}`}>
                  {href ? <a className="text-[#1f7a5c] underline" href={href}>{source.label}</a> : source.label}
                  {source.note && <p className="text-sm text-[#67594e]">{source.note}</p>}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
