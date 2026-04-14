require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const SiteContent = mongoose.models.SiteContent || mongoose.model("SiteContent", new mongoose.Schema({ key: String, value: String }, { strict: false }));
  const item = await SiteContent.findOne({ key: "counter.heading" });
  console.log("Current Value in DB:", JSON.stringify(item.value));
  process.exit(0);
}
check();
