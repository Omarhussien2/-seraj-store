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

  // Pick 12 diverse places for sample
  const samples = [];
  const picks = [
    "My Town", "TEDA Fun Valley", "Abracadabra", "Sparky's",
    "AFCA for Arts", "Adrenalin Park", "Aswan Botanical",
    "Ras Muhammad", "Blue Hole", "Al-Azhar Park",
    "Montazah Gardens", "Giza Zoo"
  ];

  for (const name of picks) {
    const p = ps.find(x => x.name_en.includes(name));
    if (p) samples.push(p);
  }

  console.log("=== SAMPLE: Current vs Proposed Google Maps Links ===\n");

  samples.forEach((p, i) => {
    const hasCoords = p.location?.lat && p.location?.lon;
    const newName = encodeURIComponent(p.name_en + " " + (p.city || "") + " Egypt");

    // Proposed: Google Maps search link
    const proposed = hasCoords
      ? `https://www.google.com/maps/search/?api=1&query=${p.location.lat},${p.location.lon}`
      : `https://www.google.com/maps/search/?api=1&query=${newName}`;

    console.log(`${i + 1}. ${p.name_en} (${p.name_ar}) — ${p.city}`);
    console.log(`   Current:  ${p.external_detail_url || "(empty — Manual place)"}`);
    console.log(`   Proposed: ${proposed}`);
    console.log(`   Phone: ${p.phone || "N/A"} | Coords: ${hasCoords ? "YES" : "NO"}`);
    console.log("");
  });

  // Stats
  console.log("=== STATS ===");
  console.log(`Total places: ${ps.length}`);
  console.log(`With coordinates (→ will use lat,lon): ${ps.filter(p => p.location?.lat && p.location?.lon).length}`);
  console.log(`Without coordinates (→ will use name search): ${ps.filter(p => !p.location?.lat || !p.location?.lon).length}`);
  console.log(`Currently kidzapp links: ${ps.filter(p => p.external_detail_url?.includes("kidzapp")).length}`);
  console.log(`Currently empty: ${ps.filter(p => !p.external_detail_url).length}`);

  await mongoose.disconnect();
}

main();
