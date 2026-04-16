# Phase 7: Fas7a Helwa Data Extraction - Research

**Researched:** 2026-04-16
**Domain:** Data extraction from Kidzapp API for Egyptian kids' entertainment places
**Confidence:** HIGH

## Summary

The primary data source for Egyptian kids' entertainment places is **Kidzapp's public REST API**, which contains **615 experiences/venues across Egypt** — no scraping required. The API is openly accessible at `api.kidzapp.com/api/3.0/` with no authentication. It covers Cairo, Alexandria, North Coast, Sharm El Sheikh, Hurghada, Dahab, Ain Sokhna, Ras Sudr, El Gouna, and Al Fayoum.

The API returns rich JSON data per experience including: name, description, address, GPS coordinates, phone, website, Instagram, detailed pricing (multiple tiers), age ranges, indoor/outdoor classification, working hours, categories, and images. This maps directly to the user's CSV table format.

**Primary recommendation:** Write a Node.js/TypeScript script using native `fetch()` to paginate through all 615 Kidzapp Egypt experiences, transform the JSON data to match the user's CSV schema, and output a ready-to-use CSV file.

## User Constraints

### Locked Decisions
- Data must be extracted from **Kidzapp** as the primary source
- Output format must match the exact CSV schema provided:
  `id,name_ar,name_en,description_short,area,address,min_price,max_price,price_range_id,min_age,max_age,avg_duration_hours,is_free,indoor_outdoor,booking_required,website_url,external_source,external_detail_url,phone,facebook_url,instagram_url,category_ids,last_price_update`
- Section is called "فسحة حلوة" (Fas7a Helwa) under "عالم ماما" (Mama's World)
- Data is for **Egypt** specifically

### Claude's Discretion
- Choice of additional data sources beyond Kidzapp
- Script implementation approach (libraries, patterns)
- Data enrichment strategy (Arabic names, descriptions)
- How to handle missing/incomplete data

### Deferred Ideas (OUT OF SCOPE)
- Frontend UI for "عالم ماما" section
- Backend API endpoints for places data
- Database models for storing places

## Standard Stack

### Core (Data Extraction)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| native `fetch()` | Node 18+ | HTTP requests to Kidzapp API | No dependency needed, built-in |
| `json2csv` | latest | Convert JSON to CSV output | Battle-tested, handles edge cases |
| TypeScript | ^5 | Type-safe data transformation | Project already uses TS |

### Supporting (Optional Enrichment)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `cheerio` | ^1.0 | HTML parsing for enrichment sources | If scraping other sites for Arabic names |
| `puppeteer` | ^24 | Browser automation for JS-rendered sites | Only if a source requires JS rendering |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `json2csv` | `csv-writer` | csv-writer is simpler but less flexible for nested data |
| Native `fetch()` | `axios` | axios has retry/interceptors but adds dependency |
| Puppeteer | Cheerio | Use cheerio for static HTML, puppeteer only for JS-rendered pages |

**Installation:**
```bash
npm install --save-dev json2csv
# Optional for enrichment:
npm install --save-dev cheerio
```

## Architecture Patterns

### Recommended Script Structure
```
scripts/
├── scrape-kidzapp-egypt.ts    # Main script: fetch + transform + output CSV
├── kidzapp-types.ts           # TypeScript interfaces for Kidzapp API responses
└── fas7a-helwa-output.csv     # Generated CSV output
```

### Pattern 1: Paginated API Fetching
**What:** Kidzapp returns paginated results; script must loop through all pages
**When to use:** Always — 615 results across ~13 pages at page_size=50
**Example:**
```typescript
// Source: Verified against api.kidzapp.com/api/3.0/
const BASE_URL = 'https://api.kidzapp.com/api/3.0/experiences/';
const PAGE_SIZE = 50;

async function fetchAllEgyptExperiences(): Promise<KidzappExperience[]> {
  let allResults: KidzappExperience[] = [];
  let url: string | null = `${BASE_URL}?country_code=eg&page_size=${PAGE_SIZE}`;

  while (url) {
    const response = await fetch(url);
    const data: KidzappPaginatedResponse = await response.json();
    allResults = allResults.concat(data.results);
    url = data.next; // null when last page reached
    console.log(`Fetched ${allResults.length}/${data.count} experiences...`);
  }

  return allResults;
}
```

### Pattern 2: Data Transformation (Kidzapp → CSV Schema)
**What:** Map Kidzapp API fields to the user's CSV column schema
**When to use:** After fetching all raw data
**Example:**
```typescript
function transformToCsvRow(exp: KidzappExperience, sequentialId: number): Fas7aHelwaRow {
  const prices = exp.price.map(p => p.final_price).filter(p => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  return {
    id: sequentialId,
    name_ar: exp.name, // Kidzapp mostly has English names; may need manual Arabic translation
    name_en: exp.name,
    description_short: exp.top_tip || exp.description?.substring(0, 120) || '',
    area: exp.area?.name_en || '',
    address: exp.address || '',
    min_price: minPrice,
    max_price: maxPrice,
    price_range_id: exp.price_range || 1,
    min_age: exp.ages_display.length > 0 ? Math.min(...exp.ages_display) : 0,
    max_age: exp.ages_display.length > 0 ? Math.max(...exp.ages_display) : 100,
    avg_duration_hours: estimateDuration(exp),
    is_free: prices.length === 0 || (minPrice === 0 && maxPrice === 0),
    indoor_outdoor: mapVenueType(exp.venue_type),
    booking_required: exp.booking_required,
    website_url: exp.website || '',
    external_source: 'Kidzapp',
    external_detail_url: `https://kidzapp.com/${exp.url}`,
    phone: exp.phone || '',
    facebook_url: exp.website?.includes('facebook') ? exp.website : '',
    instagram_url: exp.instagram_link ? `https://instagram.com/${exp.instagram_link}` : '',
    category_ids: exp.categories.map(c => c.id).join(';'),
    last_price_update: new Date().toISOString().split('T')[0],
  };
}
```

### Anti-Patterns to Avoid
- **Don't use Puppeteer for Kidzapp**: The API is public and returns JSON directly. Puppeteer would be massive overkill and slow.
- **Don't hardcode page count**: Always use pagination links from API response (`data.next`).
- **Don't ignore rate limiting**: Even though the API is public, add small delays between requests to be respectful.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV generation | Manual string concatenation with comma handling | `json2csv` library | Handles escaping, quoting, special characters in descriptions |
| Pagination | Guess total pages | Follow `data.next` links | API provides exact pagination URLs |
| Price extraction | Complex manual parsing | Map/filter over `price[]` array | Kidzapp returns structured price objects |

**Key insight:** The Kidzapp API is well-structured JSON — no HTML parsing or scraping needed. All the data fields are cleanly typed and accessible.

## Common Pitfalls

### Pitfall 1: Arabic Names Missing
**What goes wrong:** Kidzapp API returns mostly English names (`name`, `title_en`). The CSV needs `name_ar`.
**Why it happens:** Kidzapp's Egypt data was primarily entered in English.
**How to avoid:** The `title` field sometimes has mixed content. For true Arabic names, will need either: (a) manual translation, (b) a translation API, or (c) enrichment from Arabic sources. Categories DO have `name_ar` fields.
**Warning signs:** Column `name_ar` will be same as `name_en` initially.

### Pitfall 2: Price Complexity
**What goes wrong:** Each venue has multiple price tiers (Full Day, 2 Hours, Accompanying Adult, etc.) — not a single price.
**Why it happens:** Kidzapp tracks detailed pricing with multiple ticket types per venue.
**How to avoid:** Extract `min_price` and `max_price` from the `final_price` fields across all non-zero price entries. Also preserve `price_age_groups` and `price_age_prices` text for reference.
**Warning signs:** Some venues have `price: []` (empty array) but have prices in `price_age_groups`/`price_age_prices` text fields.

### Pitfall 3: Venue Type Mapping
**What goes wrong:** Kidzapp uses `venue_type: ["indoors"]` or `["outdoors"]` array, but user's schema wants `indoor`/`outdoor`/`mixed`.
**Why it happens:** Different schema designs.
**How to avoid:** Map `["indoors"]` → `indoor`, `["outdoors"]` → `outdoor`, `["indoors", "outdoors"]` → `mixed`.
**Warning signs:** Some venues have empty `venue_type` arrays.

### Pitfall 4: Stale Price Data
**What goes wrong:** Kidzapp Egypt data may be outdated — some entries were created in 2019 and prices may have changed significantly.
**Why it happens:** Kidzapp's focus shifted to UAE; Egypt data hasn't been actively maintained.
**How to avoid:** Flag all prices with `last_price_update` = extraction date, and mark in UI that prices need verification.
**Warning signs:** Prices that seem too low (e.g., EGP 5 for zoo entry from 2019).

### Pitfall 5: Category ID Mapping
**What goes wrong:** Kidzapp category IDs (e.g., 66517 for "Fun & Play") don't match any standard schema.
**Why it happens:** Kidzapp uses its own internal category system.
**How to avoid:** Map Kidzapp categories to a simpler local category system. Key Kidzapp categories for Egypt:
- 66517: Fun & Play (لعب و مرح)
- 66513: Baby & Toddler (الرضّع والاطفال الصغار)
- 66518: Outdoor & Nature
- 37: Animal Fun (المرح مع الحيوانات)
- 66512: Art, Music & Dance (فن، موسيقي و رقص)
- 45: Sports & Active
- 38: Theme Parks
- 49: Water Fun
- 48: Explore The City
- 66514: Shows & Cinema

## Code Examples

Verified patterns from direct API testing:

### Fetch All Egypt Experiences
```typescript
// Source: Verified against api.kidzapp.com
// Returns 615 total experiences across Egypt
// Pagination: page & page_size params
// No auth required

interface KidzappPaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  facets: Record<string, unknown>;
  results: KidzappExperience[];
}

// API call pattern:
// GET https://api.kidzapp.com/api/3.0/experiences/?country_code=eg&page_size=50&page=1
```

### Key Data Fields Available Per Experience
```typescript
// Source: Verified from actual API response for id=60888 (My Town)
interface KidzappExperience {
  id: number;                          // 60888
  uid: string;                         // UUID
  name: string;                        // "My Town"
  title: string;                       // "My Town | Dandy Mall"
  title_en: string;                    // "My Town | Dandy Mall"
  slug: string;                        // "my-town"
  url: string;                         // "kids-activities/cairo/fun-play/my-town-60888"
  description: string;                 // Full HTML description
  top_tip: string;                     // "Children under 3 years old..."
  phone: string;                       // "+20 106 4323139"
  website: string;                     // Facebook URL usually
  instagram_link: string;              // "mytownme" (username only)
  address: string;                     // Full address
  brief_address: string;               // Short address
  location: { lat: number; lon: number }; // GPS coordinates
  image_url: string;                   // Main image (CloudFront CDN)
  image_carousel_list: string[];       // All images
  venue_type: string[];                // ["indoors"] or ["outdoors"]
  price_range: number;                 // 1-5 scale
  booking_required: boolean;
  ages_display: number[];              // [2, 3, 4, 5, ...]
  working_hours: WorkingHour[];        // Per-day schedule
  working_hours_brief: string;         // "Sat - Wed 10:00 to 22:00..."
  categories: Category[];
  primary_category: Category;
  subcategory: Category[];
  area: { id: number; name_en: string; name_ar: string | null };
  city: { id: number; name_en: string; name_ar: string };
  price: PriceOption[];
  price_age_groups: string;            // "Full Day\r\n2 Hours\r\n..."
  price_age_prices: string;            // "EGP 320.0\r\nEGP 250.0\r\n..."
}
```

### Complete Script Skeleton
```typescript
// scripts/scrape-kidzapp-egypt.ts
import { writeFileSync } from 'fs';
import { Parser } from 'json2csv';

const API_BASE = 'https://api.kidzapp.com/api/3.0';

async function main() {
  console.log('🚀 Fetching all Egypt kids experiences from Kidzapp...');

  // 1. Fetch all experiences
  const experiences = await fetchAllEgyptExperiences();
  console.log(`✅ Fetched ${experiences.length} experiences`);

  // 2. Filter to only venues (not events/courses)
  const venues = experiences.filter(exp => exp.type === 'venue' && exp.show);

  // 3. Transform to CSV rows
  const rows = venues.map((exp, i) => transformToCsvRow(exp, i + 1));

  // 4. Write CSV
  const parser = new Parser({ fields: CSV_COLUMNS });
  const csv = parser.parse(rows);
  writeFileSync('fas7a-helwa-output.csv', '\uFEFF' + csv, 'utf-8'); // BOM for Arabic
  console.log('📄 CSV written to fas7a-helwa-output.csv');
}

main().catch(console.error);
```

## Data Sources

### Primary Source: Kidzapp API (615 experiences for Egypt)
**URL:** `https://api.kidzapp.com/api/3.0/`
**Key Endpoints:**
| Endpoint | Description | Example |
|----------|-------------|---------|
| `/api/3.0/countries/` | List countries | Egypt: id=57131, code=eg |
| `/api/3.0/cities/?country_code=eg` | Egyptian cities | 12 cities including Cairo, Alex, Sharm |
| `/api/3.0/experiences/?country_code=eg&page_size=50` | All Egypt experiences | 615 total |
| `/api/3.0/categories/` | All categories | 28 categories |
| `/api/3.0/areas/?city_id=57132` | Areas for Cairo | (may return empty) |

**Egyptian Cities Available:**
| City | ID |
|------|-----|
| Cairo | 57132 |
| North Coast | 57133 |
| Alexandria | 57134 |
| El Gouna | 57477 |
| Hurghada | 57478 |
| Sharm El Sheikh | 57479 |
| Ras Sudr | 57480 |
| Ain Sokhna | 57481 |
| Dahab | 57482 |
| Al Fayoum | 57484 |

**Kidzapp Categories (relevant for Egypt):**
| ID | English | Arabic |
|----|---------|--------|
| 66517 | Fun & Play | لعب و مرح |
| 66513 | Baby & Toddler | الرضّع والاطفال الصغار |
| 66518 | Outdoor & Nature | - |
| 37 | Animal Fun | المرح مع الحيوانات |
| 66512 | Art, Music & Dance | فن، موسيقي و رقص |
| 45 | Sports & Active | - |
| 38 | Theme Parks | - |
| 49 | Water Fun | - |
| 48 | Explore The City | - |
| 66514 | Shows & Cinema | - |
| 66515 | Courses, Camps & Workshops | - |
| 66516 | Eat Out | - |

### Secondary Source: Ahram Online (User's Existing Data)
The user already has 11 places from an Ahram Online article about Cairo kids activities. These can be used as a reference/validation set.

### Tertiary Source: TripAdvisor Egypt
- General attractions (not kids-specific)
- Has Arabic content for names
- Could be used for enrichment
- **Not recommended as primary source** — too generic

### Enrichment Source: Google Maps Places API
- Can fill in missing data (Arabic names, photos, reviews)
- Requires API key and has usage costs
- **Use only if needed** for Arabic name enrichment

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Web scraping Kidzapp | Use Kidzapp's public REST API | API always available | No browser/scraping tools needed |
| Manual data collection | API-based batch extraction | - | 615 places in minutes vs days |
| English-only data | Bilingual (en/ar) categories | Kidzapp supports both | Categories have Arabic; venues mostly English |

**Deprecated/outdated:**
- Kidzapp Egypt website (`kidzapp.com/egypt` → 404): The web frontend for Egypt is not active, but the API serves all data.

## Open Questions

1. **Arabic Names for Venues**
   - What we know: Kidzapp API returns mostly English names for Egypt venues
   - What's unclear: Whether to manually translate, use a translation API, or crowdsource
   - Recommendation: Start with English names in `name_ar` column; mark for manual Arabic translation later

2. **Price Accuracy**
   - What we know: Some Kidzapp Egypt prices are from 2019 and may be outdated
   - What's unclear: How much has changed
   - Recommendation: Extract all available prices, flag with extraction date, plan for price verification pass

3. **Category Simplification**
   - What we know: Kidzapp has 28+ categories; the user's existing data uses simple numeric IDs (1-5)
   - What's unclear: What category system the user wants
   - Recommendation: Map Kidzapp categories to the user's existing system:
     - 1 → Fun & Play / Soft-play (indoor playgrounds)
     - 2 → Shows & Cinema / Culture
     - 3 → Outdoor & Nature / Parks / Landmarks
     - 4 → Educational / Museums
     - 5 → Farms / Animal Fun

## Sources

### Primary (HIGH confidence)
- Kidzapp API `api.kidzapp.com/api/3.0/` — directly tested and verified:
  - `/countries/` → Egypt confirmed with id=57131, code=eg
  - `/experiences/?country_code=eg` → 615 results confirmed
  - `/cities/?country_code=eg` → 12 cities confirmed
  - `/categories/` → 28 categories confirmed
  - Individual experience structure fully documented (tested with id=60888, id=60891)
- User's existing CSV data — 11 rows from Ahram Online as reference schema

### Secondary (MEDIUM confidence)
- TripAdvisor Egypt (`tripadvisor.com.eg`) — verified Arabic content exists, not kids-specific
- Puppeteer GitHub repo — confirmed v24.41.0 available, NOT needed for this task

### Tertiary (LOW confidence)
- Google Maps Places API — not directly tested, known to have Arabic place names

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Native fetch + json2csv is well-established
- Architecture: HIGH — Direct API verification with real data
- Pitfalls: HIGH — All identified from actual API response analysis
- Data completeness: MEDIUM — 615 venues is substantial but Arabic names are missing
- Price accuracy: MEDIUM — Prices exist but may be outdated (2019 data)

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (API structure stable; prices change frequently)
