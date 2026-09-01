# Seraj Store Organic Discovery and Content Source of Truth

Read this file before writing public copy or planning pages for organic search,
Google generative search, ChatGPT search, Bing, shopping surfaces, or browser
agents. Read `SEO-HANDOFF.md` first for accounts, live dashboard state, legal
identity, and the production files that must remain synchronized.

Last owner confirmation: **2026-09-01, Africa/Cairo**.
Last competitor review: **2026-09-01**.

## Outcome and limits

The goal is to make Seraj the clearest and most credible answer for families
looking for personalized Arabic children's stories in Egypt. No agent may
promise a number-one ranking, indexing, citation by an AI system, or a rich
result. Those outcomes are controlled by external platforms and competition.

The durable strategy is to publish useful first-hand evidence about how Seraj
creates each story, make the offer and policies easy to understand, and expose
the same facts in visible Arabic content, metadata, feeds, and valid structured
data. Do not create large numbers of near-duplicate keyword pages or treat
`llms.txt` as a ranking shortcut.

## Owner-confirmed offer facts

The owner confirmed the following on 2026-09-01. These facts are the basis of
the positioning, but they still need to be presented on the production site
with representative evidence.

- Seraj can write the complete story for one child according to the priorities
  supplied by the parent or guardian; the service is not limited to replacing
  a name and face inside one fixed story.
- The parent can define the value, behavior, challenge, interest, occasion, or
  message that should guide the story.
- Seraj creates a full character sheet for the child to support a consistent
  appearance across the story.
- A character sample is sent to the parent or guardian for review before the
  complete story is produced.
- The order can include a personal dedication.
- Seraj can deliver the finished gift directly to a recipient on the buyer's
  behalf.
- The latest cover artwork can achieve a close, realistic resemblance to the
  child. This must be demonstrated with approved examples; never promise exact
  likeness or publish a real child's image without guardian consent.
- Seraj also owns an original Arabic storyworld with recurring characters,
  ready-made stories, and a wider catalog of educational play. Do not imply
  that every personalized story uses those characters unless that is confirmed
  for the selected package.

### Important wording boundary

Call the pre-production deliverable a **character sample** or **character-sheet
sample**. Do not call it a full-book preview unless the owner separately
confirms that every page is shown before printing. Do not state a number of
free revisions until it is confirmed.

## Facts currently visible in production

The production product at `/product/custom-story` was checked on 2026-09-01.
It currently shows a price of 310 EGP and describes a complete story using the
child's name and photo, with a character close to the child's features. Prices
and inventory are dynamic; re-read the live product before quoting them.

Shipping and returns remain governed by `src/lib/commercePolicies.ts` and the
live `/shipping` and `/returns` pages. Do not merge custom-story production
time with carrier delivery time unless both stages have been confirmed.

### Current content drift to resolve

The production database, public fallback, and seed data do not currently agree:

| Source checked on 2026-09-01 | Current claim |
| --- | --- |
| Live `/api/products` record for `custom-story` | 310 EGP; complete story with the child's name and photo; no visible page-count or detailed print specification |
| `public/app.js` fallback product | 220 EGP; 24 colored pages; reinforced cover; thick paper |
| `scripts/seed.ts` and `scripts/seed-products.js` | 220 EGP; 24 colored pages; reinforced cover; thick paper; Egyptian artists |
| `public/index.html` personalization steps | Reinforced cover and thick paper, without the complete package specification |

A fallback or seed file is not proof of the current product. Confirm the real
package, update every source together, and verify the server-recalculated order
price before publishing stronger copy. This is a Priority 0 trust and conversion
issue, not merely a keyword task.

`public/app.js` also contains testimonial-style names and quotations. Treat
them as unverified until they can be tied to genuine orders and permission for
public display. Do not use them in structured data, aggregate ratings, landing
pages, or social proof merely because they exist in fallback code. Re-check
this finding after the active story-builder/testimonials work is merged.

## Positioning

### Category definition

Seraj is an Arabic children's story and educational-play brand. Its
personalized-story service creates a story around the child's identity and the
guardian's goal, develops a consistent character for approval, and can deliver
the finished book as a personal gift. This service is presented alongside
Seraj's original Arabic storyworld; the two should not be conflated when a
specific personalized package does not use the recurring Seraj characters.

### Primary promise

> قصة تُكتب لطفلك من البداية، حسب الرسالة التي تهمك، بشخصية تعتمدها قبل تنفيذ
> الكتاب، وتصل كهدية تحمل اسمه.

### Short factual answer for search and AI systems

> سِراج متجر مصري لقصص الأطفال العربية والمنتجات التعليمية. يقدّم قصة مخصصة
> تُكتب حسب اسم الطفل وصورته وعمره وأولوية ولي الأمر، مع تصميم Character Sheet
> وعينة للشخصية قبل استكمال القصة، وإمكانية إضافة إهداء وتوصيل الكتاب مباشرةً
> إلى مستلم الهدية داخل مصر.

Use Arabic **تصميم شخصية متكامل** before the English term **Character Sheet**
in customer-facing copy. The English term can follow in parentheses because it
is used by customers and creative professionals.

### Homepage message draft

**Heading:** قصة أطفال مخصصة تُكتب لطفلك من البداية

**Supporting copy:** احكيلنا عن طفلك والرسالة اللي تهمك—شجاعة، ثقة، صبر، حب
التعلم، أو موقف خاص. نصمم له شخصية متكاملة، نرسل لك عينة لاعتمادها، ثم نحولها
إلى حكاية عربية يكون هو بطلها.

**Primary action:** ابدأ قصة طفلك

**Proof points:**

- قصة تُبنى على أولوية ولي الأمر، وليست مجرد تبديل الاسم.
- تصميم شخصية متكامل وعينة قبل استكمال القصة.
- إهداء باسم المرسل وتوصيل مباشر لمستلم الهدية.
- عالم عربي أصلي يجمع الحكاية بالقيم والمعرفة.

Do not add "الأفضل"، "الأول"، "مطابقة 100%"، or another superlative without
independent, current evidence and a clearly defined comparison method.

## Competitive position

This is internal planning context, not ready-made comparison copy. Re-check all
competitor facts before a public comparison page.

| Provider | Verified public strength on 2026-09-01 | Seraj response |
| --- | --- | --- |
| HeroKid | Large story library, a visual identity from 2–3 photos, full preview before printing, and clear Egypt delivery | Lead with a story written around the guardian's priority plus the character-sheet checkpoint; improve proof and operational transparency |
| Hawadeto | Accepts the customer's own idea, offers multiple children, digital/print options, gift packaging, and dedications | Explain Seraj's full creative process, original storyworld, character approval, and direct-to-recipient gift flow |
| Batal Stories | Clear low pricing, 12-page format, a large template library, and a special-story option | Compete on depth, not the lowest price: show what is written, designed, reviewed, printed, and included |
| Hello Storybook | Strong character-consistency and privacy messaging, fast digital output, and international fulfillment | Publish an explicit child-photo policy and demonstrate the Seraj character sheet with approved before/after evidence |
| Nqshah | Converts a real event into a story and presents strong gift packaging and consent-aware examples | Add real-life-event stories only if Seraj actually offers them; otherwise focus on parent-led values, behavior, and original-world adventures |

Official pages reviewed:

- `https://hero-kid.com/` and `https://hero-kid.com/how-it-works`
- `https://www.hawadeto.online/`
- `https://www.batalstories.com/`
- `https://hellostorybook.com/help`
- `https://nqshah.sa/`

Do not reproduce competitors' wording, images, scoring, or marketing claims.
Use the review only to identify customer questions Seraj must answer better.

## Audience and search-intent map

Each intent should be answered by one strong canonical destination. Do not
create a separate thin page for every wording variation.

| Intent | Representative Arabic queries | Best destination |
| --- | --- | --- |
| Buy a personalized story in Egypt | قصة أطفال مخصصة، قصة باسم وصورة طفلي، قصة طفلي هو البطل، قصص مخصصة للأطفال مصر | Existing `/product/custom-story` supported by `/category/personalized-stories` |
| Solve a parenting goal through story | قصة عن الثقة بالنفس للأطفال، قصة لعلاج الخوف، قصة تعلم الصبر، قصة حسب شخصية طفلي | A substantial section on the custom-story page plus first-hand case studies |
| Evaluate resemblance and consistency | تحويل صورة الطفل لشخصية، قصة تشبه طفلي، ثبات ملامح الطفل في القصة | Proposed character-design/process page with approved character-sheet examples |
| Understand the process before paying | كيف تصنع قصة مخصصة، هل أراجع الشخصية قبل الطباعة، صور القصة المخصصة المطلوبة | Proposed how-it-works page and visible FAQ on the product page |
| Send a meaningful gift | هدية طفل مخصصة، هدية عيد ميلاد طفل، إرسال قصة هدية لطفل، توصيل هدية بالنيابة عني | Proposed gift-and-direct-delivery page linked from the product and checkout |
| Compare options | أفضل قصة مخصصة للأطفال في مصر، سعر قصة باسم الطفل، عدد صفحات القصة المخصصة | A neutral buyer's guide with current specifications and a dated methodology |
| Discover the Seraj world | قصص عربية للأطفال، قصص إسلامية للأطفال، قصص تاريخية للأطفال، ألعاب تعليمية | Existing `/about`, category, product, and article pages |

## Canonical page plan

### Priority 0: answer purchase-blocking questions

1. **Strengthen `/product/custom-story`.** It must visibly state what is
   personalized, what the buyer supplies, what Seraj produces, what the buyer
   reviews, the exact package specifications, the current price, production
   time, delivery time, and photo policy.
2. **Publish a how-it-works page.** Proposed route:
   `/how-personalized-stories-work`. Show the actual workflow and link it from
   the home page, product page, FAQ, and relevant articles.
3. **Publish a child-photo and AI-use policy.** Proposed route:
   `/child-photo-privacy`. State storage, access, third-party processors,
   retention, deletion, model-training use, guardian consent, and how to request
   deletion. This cannot be drafted from assumptions.
4. **Publish a gift and direct-delivery page.** Proposed route:
   `/personalized-gifts-for-children`. Explain dedications, recipient address,
   whether prices or invoices appear in the package, gift packaging, timing,
   and buyer notifications.
5. **Create an evidence gallery.** Use a synthetic demo child or examples with
   written guardian permission. Show source-photo requirements, character
   sheet, approved sample, selected interior spreads, physical book, packaging,
   and the finished cover.

### Priority 1: build topical authority from first-hand work

- A case study showing how one guardian's priority became a story, without
  exposing a child's private details.
- A practical photo guide based on Seraj's actual illustration workflow.
- A guide to choosing a value or behavior goal without making medical or
  therapeutic claims.
- A behind-the-scenes article about maintaining one character across scenes.
- A guide to reviewing the character sample: hair, face shape, skin tone,
  clothing, and age-appropriate appearance.
- A gift-planning guide for birthdays, a new sibling, school milestones,
  Ramadan, Eid, and travel, limited to occasions Seraj can actually fulfill.
- Original articles about the Seraj storyworld, characters, research, and the
  educational choices behind published stories.

### Priority 2: expand only from evidence

- Story landing pages for genuinely different goals or occasions when each has
  a distinct process, examples, and useful advice.
- Institution and school packages only after price, minimum quantity,
  customization, invoicing, and fulfillment are operationally confirmed.
- English pages only when Seraj can support the complete purchase and service
  flow in English; do not translate pages merely to multiply indexable URLs.

### Search-snippet drafts

These are starting points, not final production facts. Re-check length and the
live offer at implementation time.

| Destination | Title draft | H1 draft |
| --- | --- | --- |
| `/product/custom-story` | قصة أطفال مخصصة باسم وصورة طفلك في مصر | قصة تُكتب لطفلك من البداية |
| Proposed `/how-personalized-stories-work` | كيف نصنع قصة طفلك المخصصة؟ | من صورة طفلك إلى بطل حكاية كاملة |
| Proposed `/child-photo-privacy` | خصوصية صور الأطفال في سِراج | كيف نحمي صورة طفلك وبياناته؟ |
| Proposed `/personalized-gifts-for-children` | هدية طفل مخصصة مع إهداء وتوصيل داخل مصر | ابعت له حكاية بطلها هو |
| Proposed buyer's guide | كيف تختار قصة أطفال مخصصة في مصر؟ | دليل ولي الأمر لاختيار القصة المخصصة |

Every final title, description, and H1 must describe the page itself. Do not
swap synonyms only to manufacture additional landing pages.

## Personalized-story page content specification

The main page should answer these questions without forcing the visitor to
open WhatsApp:

1. What is the finished product?
2. Is the story selected from a template or written around my child?
3. Which details can I choose: value, behavior, challenge, interest, occasion,
   people, setting, and dedication?
4. How many photos are required and what makes a usable photo?
5. What does the character sheet contain?
6. What exactly will I see before the full story is produced?
7. What can I request to change, and how many revision rounds are included?
8. How many pages, what size, binding, cover, paper, and language are included?
9. What is the production time before shipping?
10. What is the carrier delivery estimate after production?
11. What is included in the displayed price?
12. Can it be sent directly as a gift, and what does the recipient see?
13. How are the child's images stored, processed, and deleted?
14. What happens if Seraj makes a text, likeness, print, or delivery error?

### Process copy draft

1. **احكيلنا عن طفلك:** الاسم والعمر والاهتمامات والرسالة أو الموقف اللي تحب
   القصة تساعده فيه.
2. **ارفع الصور المناسبة:** نستخدم الصور فقط لتنفيذ الطلب وفق سياسة صور
   الأطفال المنشورة.
3. **نصمم شخصيته:** نجهز تصميم شخصية متكامل يساعدنا نحافظ على ملامحه وشكله
   عبر المشاهد.
4. **راجع العينة:** نرسل لك عينة الشخصية قبل ما نستكمل القصة، ونبدأ بعد
   اعتمادك.
5. **نكتب ونرسم الحكاية:** نبني الأحداث حول طفلك وأولوية الأسرة داخل تجربة
   عربية ممتعة.
6. **نجهز الهدية ونوصلها:** نضيف الإهداء المتفق عليه ونشحنها إلى عنوانك أو
   مباشرةً إلى مستلم الهدية.

The photo-policy sentence above is blocked until that policy is approved and
published. Do not launch the final copy while the linked policy is missing.

### FAQ answer drafts

**هل القصة مجرد اسم وصورة داخل حكاية جاهزة؟**

لا. في خدمة سِراج المخصصة نستخدم تفاصيل الطفل وأولوية ولي الأمر لبناء القصة
المتفق عليها، ثم نصمم شخصية متكاملة للطفل ونرسل عينة لاعتمادها قبل استكمال
التنفيذ.

**هل أرى شكل شخصية طفلي قبل استكمال القصة؟**

نعم. يرسل فريق سِراج عينة من تصميم الشخصية إلى ولي الأمر للمراجعة قبل استكمال
القصة. يجب إضافة نطاق التعديلات ومدة الاعتماد بعد تأكيدهما تشغيليًا.

**هل يمكنني اختيار الرسالة أو القيمة؟**

نعم. يمكن أن تبدأ القصة من قيمة أو سلوك أو تحدٍ أو اهتمام يحدده ولي الأمر، ما
دام مناسبًا لعمر الطفل وطبيعة المنتج. لا تُقدَّم القصة كعلاج طبي أو نفسي.

**هل تصلح القصة كهدية تُرسل مباشرةً؟**

نعم. يمكن إضافة إهداء وإرسال الطلب إلى عنوان المستلم نيابةً عن المشتري. يجب
توضيح التغليف والفاتورة والإشعارات ومناطق التوصيل قبل نشر الإجابة النهائية.

**هل تضمنون تطابق الرسمة مع الطفل؟**

نصمم شخصية قريبة من ملامح الطفل بناءً على الصور المناسبة، ونرسل عينة للمراجعة
قبل استكمال القصة. لا نَعِد بتطابق فوتوغرافي أو نتيجة متماثلة مع كل صورة.

## Evidence and asset brief

The strongest SEO and AI-discovery asset is original evidence that competitors
cannot copy. Prepare the following before the content rollout:

1. Three recent personalized-story covers representing different ages or
   visual styles.
2. One complete character sheet with a guardian-approved source-photo example,
   or a synthetic demonstration child if consent is unavailable.
3. A before-and-after set: usable input photo, character sheet, sample scene,
   and printed result.
4. Four to six interior spreads with readable text and descriptive alt copy.
5. Physical product photographs showing front cover, spine, binding, paper,
   page thickness, scale in an adult's hands, and packaging.
6. A short process video: information intake, character design, parent review,
   writing/illustration, printing, packing, and delivery.
7. A gift example showing the dedication and package as received, without
   exposing an address, phone number, order number, or child's private data.
8. Reviews tied to real orders and explicit permission for public display.

For every child image, store proof of guardian permission and the allowed
usage surfaces. If artwork is AI-generated or materially AI-edited, determine
the required disclosure and image metadata before submitting it to Merchant
Center or publishing a process claim.

Google's current merchant guidance requires AI-generated images to retain IPTC
metadata with `DigitalSourceType` set to `TrainedAlgorithmicMedia`. Verify the
latest Merchant Center requirement at implementation time and preserve the
metadata through export and image optimization.

### Image naming and context

- Use stable descriptive filenames, not camera names or generated hashes, when
  the asset pipeline allows it.
- Write alt text for the image's purpose and visible content, not as a keyword
  list.
- Keep one canonical high-resolution asset URL for each image when practical.
- Put explanatory text next to important images; do not rely on an image alone
  to communicate a feature.
- Never include a child's full name in a public filename or alt attribute.

## Structured data and machine-readable facts

Existing production already exposes Organization, Product, Offer,
BreadcrumbList, Article, shipping, and return-policy data. Future changes must
keep visible content, metadata, Merchant Center, feeds, and JSON-LD consistent.

### Product facts to add only when visible and confirmed

- Accurate description of the personalized workflow.
- Current price, currency, availability, canonical URL, and primary image.
- Package attributes represented as `additionalProperty` values when they are
  useful to customers and visible on the page: page count, format, language,
  recommended age, customization type, and included preview.
- Real ratings or reviews only when they are visible, attributable to genuine
  customers, and calculated from the same underlying data.

Do not place sales copy, unsupported superlatives, hidden keywords, fake
ratings, or facts that are absent from the page inside JSON-LD.

FAQ content remains useful when visible, but Google announced that FAQ rich
results no longer appear from May 2026. Do not prioritize FAQPage markup for a
Google rich-result promise. Prioritize clear answers that help visitors and can
be quoted accurately by search and AI systems.

## Search and AI-agent requirements

- Important facts must live on crawlable canonical HTTP pages, not only inside
  hash routes, client-side state, images, or WhatsApp conversations.
- Keep `OAI-SearchBot` allowed for ChatGPT search while the business wants
  discovery. Training-crawler decisions such as `GPTBot` are separate.
- Google generative search uses the normal Search index and foundational SEO.
  Valuable first-hand content, crawlability, internal links, clear visible
  text, images, and shopping data take priority over "AEO/GEO hacks."
- Do not prioritize an unnecessary `llms.txt`. Re-evaluate only if a concrete
  platform publishes a requirement and Seraj chooses to support it.
- Use IndexNow after publishing, changing, or deleting canonical URLs so Bing
  and other participating engines receive the update without repeated manual
  submissions. Keep the sitemap as the complete canonical inventory.
- Use semantic headings, descriptive links, accessible labels, and visible
  price/policy information so browser agents can interpret the purchase flow.
- Keep order and upload endpoints out of crawler access; public discovery does
  not require indexing API responses or admin surfaces.
- If browser agents are expected to complete purchases, test the full flow
  with form labels, validation messages, image-upload requirements, totals,
  consent, and a human confirmation before any external submission.
- Record AI visibility tests by engine, model or surface, query, language,
  country, date, whether Seraj was cited, destination URL, and factual accuracy.

## Publication gates

### Owner confirmation required

Do not publish the full offer until the owner confirms:

- Current page count and whether the cover is hard, reinforced, or soft.
- Book dimensions, binding, paper type or weight, print finish, and included
  packaging.
- Supported child ages and languages.
- Minimum and ideal number of photos, accepted formats, and maximum upload size.
- What appears in the character sheet and whether the buyer receives a copy.
- Exact preview scope: character sample, selected pages, or full book.
- Included revision rounds, chargeable revisions, and approval timeout.
- Production time before carrier handoff, separately from shipping time.
- What the current price includes and the cost of optional extras.
- Gift packaging, whether an invoice or price is visible to the recipient, and
  how buyer/recipient notifications work.
- Child-photo storage provider, human access, AI processor use, retention,
  deletion schedule, training-use position, and deletion-request process.
- Whether real-life events, siblings, parents, friends, or pets can be included.
- Whether a digital copy, extra printed copies, or reorders are available.

### Evidence required

- Written approval for every publicly shown child example.
- Current photographs or measurements for physical specifications.
- A real end-to-end sample order confirming the documented process and timing.
- Validation of public structured data and the Merchant feed after deployment.
- A successful production check at mobile widths required by `AGENTS.md` for
  any later public-interface change.

## Implementation sequence

1. Obtain the blocked owner confirmations and approved visual assets.
2. Update the custom-story product data and its canonical SEO page together.
3. Publish the photo/privacy policy before adding strong photo-use assurances.
4. Publish the process and gifting pages, then link them from the home page,
   product page, category page, footer, and relevant articles.
5. Add the evidence gallery and one complete first-hand case study.
6. Synchronize JSON-LD, Merchant feed, Open Graph images, alt text, sitemap,
   and internal links with the visible content.
7. Validate, build, deploy, and inspect rendered production HTML before asking
   search engines to refresh the URLs.
8. Measure queries, impressions, clicks, custom-story starts, completed orders,
   image visibility, Merchant status, and AI citations. Improve weak pages from
   evidence rather than publishing more thin pages.

## Platform guidance reviewed

These external rules change. Re-open the official source before implementing a
platform-specific change.

- Google generative search optimization:
  `https://developers.google.com/search/docs/fundamentals/ai-optimization-guide`
- Google guidance for AI-assisted content and Merchant images:
  `https://developers.google.com/search/docs/fundamentals/using-gen-ai-content`
- Google people-first content guidance:
  `https://developers.google.com/search/docs/fundamentals/creating-helpful-content`
- OpenAI publisher and crawler guidance:
  `https://help.openai.com/en/articles/12627856`
- Bing IndexNow guidance:
  `https://www.bing.com/webmasters/help/indexnow-0z209wby`

## Completion rule

The content rollout is not complete because copy exists in a document. It is
complete only when the approved facts and evidence are visible on canonical
production pages, the purchase flow matches the promise, machine-readable data
matches the page, and the deployed URLs have been verified. Rankings and AI
citations remain monitored outcomes, not completion claims.
