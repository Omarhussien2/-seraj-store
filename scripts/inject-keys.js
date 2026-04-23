const fs = require('fs');

const data = [
  { key: "counter.kicker", val: "من قلب البيوت المصرية" },
  { key: "counter.heading", val: "أكتر من <strong id=\"storiesCount\">١,٥٠٠</strong> قصة اتألفت لأبطالنا ✦" },
  { key: "counter.subtext", val: "صور حقيقية من عائلات وثقت في سِراج عشان ترسم الفرحة على وشوش أطفالها." },
  
  { key: "how.kicker", val: "٣ خطوات بس" },
  { key: "how.heading", val: "إزاي سراج بيعمل قصة بصورة ابنك؟" },
  { key: "how.step1_title", val: "قول لسراج اسم بطلنا وسنه" },
  { key: "how.step1_desc", val: "اكتب بياناته واختار القيمة الأخلاقية اللي محتاج يتعلمها." },
  { key: "how.step2_title", val: "ارفع أحلى صورة ليه" },
  { key: "how.step2_desc", val: "سراج هياخد الصورة ويخلي ابنك هو البطل الحقيقي للقصة." },
  { key: "how.step3_title", val: "استلم قصتك لحد البيت" },
  { key: "how.step3_desc", val: "هتستلم قصة مطبوعة بألوان مبهجة وتغليف يفرّح القلب." },
  
  { key: "values.kicker", val: "القيم اللي هيتعلمها" },
  { key: "values.heading", val: "اختار القيمة اللي بطلنا محتاجها النهاردة" },
  
  { key: "testimonials.kicker", val: "كلام عائلاتنا" },
  { key: "testimonials.heading", val: "اللي قالتوه عن سِراج" },
  
  { key: "ribbon.heading", val: "مستني إيه؟ خلّي بطلنا يبدأ حكايته النهاردة!" },
  { key: "ribbon.subtext", val: "بس ٣ خطوات صغيرة.. والقصة هتكون بين إيديه." },
  { key: "ribbon.cta", val: "اصنع قصة لابنك" },
  
  { key: "about.kicker", val: "قصتنا من قلب قرية الابتكار" },
  { key: "about.heading", val: "حكاية سِراج وعيلته" },
  { key: "about.quote", val: "\"سِراج مش بس موقع، ده بيت صغير مليان حكايات.. حكايات بتتعمل بحب عشان تفرّح قلب كل بطل صغير.\"" },
  { key: "about.story", val: "بدأنا من فكرة بسيطة: إزاي نخلي الطفل يحب القراءة زي اللعب؟ ومن هنا اتولد سِراج، الخبير التقني اللي بيستخدم أحدث الأدوات عشان يبني عالم من الخيال يكون ابنك هو بطله الأساسي." },
  
  { key: "footer.brand_text", val: "قصص مخصصة بتعلّم بطلنا قيمنا الجميلة وتألف قلبه." },
  { key: "footer.copyright", val: "© ٢٠٢٦ سِراج. صُنع بحب في مصر." },
  
  { key: "mama.hero_title", val: "أهلاً بيك في عالم ماما وبابا" },
  { key: "mama.hero_desc", val: "مساحة من القلب للأهل.. مقالات، نصايح، وأماكن هتحبها لبطلنا الصغير ✦" }
];

let html = fs.readFileSync('public/index.html', 'utf8');

data.forEach(item => {
  // Find "> TEXT <" and wrap into "> span data-content-key <" if needed.
  // Actually, replacing '>text<' with ' data-content-key="key">text<'
  const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const txt = escapeRegex(item.val);
  
  const regex = new RegExp(`>([\\s\\r\\n]*${txt}[\\s\\r\\n]*)<`, 'g');
  html = html.replace(regex, ` data-content-key="${item.key}">$1<`);
});

fs.writeFileSync('public/index.html', html);
console.log("Done inserting keys into HTML!");
