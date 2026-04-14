require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const updates = [
  { key: "counter.heading", val: "أكتر من <span class=\"counter\" data-to=\"842\">٠</span> قصة اتألفت لأبطالنا الصغار" },
  { key: "counter.subtext", val: "صور حقيقية من أمهات جربوا سِراج وبعتوا لنا كتب بطلهم في إيديه" },
  { key: "how.step1_desc", val: "ادخلي اسم طفلك وسنّه، واختاري القيمة اللي عايزاه يتعلمها.. وسراج هيبدأ الشغل." },
  { key: "how.step2_title", val: "سراج هيدخل ورشه السحرية يكتب ويرسم القصة مخصوص ليه" },
  { key: "how.step2_desc", val: "في الورشة، سراج بيكتب القصة باسم بطلك وبيرسمها بإيد فنانين مصريين.. كل حاجة مخصوصة." },
  { key: "how.step3_title", val: "القصة هتجيلك مطبوعة بجودة عالية لحد باب البيت" },
  { key: "how.step3_desc", val: "غلاف مقوّى، ورق سميك، ورسوم أصلية.. قصة حقيقية يستاهلها بطلنا." },
];

async function update() {
  await mongoose.connect(process.env.MONGODB_URI);
  // Define a simple model just for updating
  const SiteContent = mongoose.models.SiteContent || mongoose.model("SiteContent", new mongoose.Schema({ key: String, value: String }, { strict: false }));
  
  for (let u of updates) {
    await SiteContent.updateOne({ key: u.key }, { $set: { value: u.val } });
  }
  console.log("Forced update done!");
  process.exit(0);
}
update();
