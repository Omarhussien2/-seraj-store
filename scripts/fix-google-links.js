const mongoose = require("mongoose");

const s = new mongoose.Schema({
  name_en: String, name_ar: String, city: String,
  location: { lat: Number, lon: Number },
  external_detail_url: String
}, { collection: "places" });

const Place = mongoose.models.Place || mongoose.model("Place", s);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const ps = await Place.find({ active: true })
    .select("name_en city location external_detail_url")
    .lean();

  console.log("Total active places:", ps.length);

  let updated = 0;
  let errors = 0;

  for (const p of ps) {
    const hasCoords = p.location?.lat && p.location?.lon;
    let newUrl;

    if (hasCoords) {
      newUrl = `https://www.google.com/maps/search/?api=1&query=${p.location.lat},${p.location.lon}`;
    } else {
      const q = encodeURIComponent(p.name_en + " " + (p.city || "") + " Egypt");
      newUrl = `https://www.google.com/maps/search/?api=1&query=${q}`;
    }

    try {
      await Place.updateOne(
        { _id: p._id },
        { $set: { external_detail_url: newUrl } }
      );
      updated++;
    } catch (err) {
      console.error("Error updating", p.name_en, err.message);
      errors++;
    }
  }

  console.log("Updated:", updated);
  console.log("Errors:", errors);

  // Verify sample
  const sample = await Place.find({ active: true })
    .select("name_en city external_detail_url")
    .sort({ city: 1, name_en: 1 })
    .limit(10)
    .lean();

  console.log("\n=== VERIFICATION SAMPLE ===");
  sample.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name_en} (${p.city})`);
    console.log(`   ${p.external_detail_url}`);
  });

  await mongoose.disconnect();
}

main();
