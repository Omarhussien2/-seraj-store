require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  const SiteContent = mongoose.models.SiteContent || mongoose.model("SiteContent", new mongoose.Schema({ key: String, value: String, section: String }, { strict: false }));
  
  // New keys to add
  const newItems = [
    { key: "counter.prefix", value: "أكتر من", section: "counter" },
    { key: "counter.number", value: "842", section: "counter" },
    { key: "counter.suffix", value: "قصة اتألفت لأبطالنا الصغار", section: "counter" }
  ];

  for (let item of newItems) {
    await SiteContent.findOneAndUpdate(
      { key: item.key },
      { $set: item },
      { upsert: true }
    );
  }

  // Remove the old dangerous key
  await SiteContent.deleteOne({ key: "counter.heading" });
  
  console.log("Counter Migration Done!");
  process.exit(0);
}
migrate();
