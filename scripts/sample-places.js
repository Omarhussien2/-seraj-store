const mongoose = require("mongoose");

const s = new mongoose.Schema({
  name_en: String, name_ar: String, city: String, area: String,
  phone: String, address: String,
  location: { lat: Number, lon: Number },
  external_detail_url: String, website_url: String
}, { collection: "places" });

const Place = mongoose.models.Place || mongoose.model("Place", s);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const ps = await Place.find({ active: true })
    .select("name_en name_ar city area phone address location external_detail_url website_url")
    .sort({ city: 1, name_en: 1 })
    .lean();

  console.log("Total active:", ps.length);
  console.log("With valid lat/lon:", ps.filter(p => p.location?.lat && p.location?.lon).length);
  console.log("With phone:", ps.filter(p => p.phone).length);
  console.log("---");

  // Pick diverse sample
  const sample = [];
  const seen = new Set();
  for (const p of ps) {
    const key = p.city;
    if (!seen.has(key) && sample.length < 20) {
      sample.push(p);
      seen.add(key);
    }
  }
  // Add a few more from Cairo
  const cairo = ps.filter(p => p.city === "Cairo").slice(0, 5);
  cairo.forEach(p => sample.push(p));

  sample.forEach((p, i) => {
    console.log(JSON.stringify({
      i: i + 1,
      name: p.name_en,
      name_ar: p.name_ar || "",
      city: p.city,
      area: p.area || "",
      lat: p.location?.lat || 0,
      lon: p.location?.lon || 0,
      phone: p.phone || "",
      current_url: p.external_detail_url || ""
    }));
  });

  await mongoose.disconnect();
}

main();
