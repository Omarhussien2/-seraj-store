/**
 * Synchronize production content with the verified story catalog contract.
 *
 * Safe to re-run: every operation sets an explicit final value.
 * Requires MONGODB_URI in .env.local.
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(uri);

  const SiteContent =
    mongoose.models.SiteContent ||
    mongoose.model('SiteContent', new mongoose.Schema({}, { strict: false }));
  const Product =
    mongoose.models.Product ||
    mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

  await SiteContent.updateOne(
    { key: 'how.step3_desc' },
    { $set: { value: 'القصة بتتطبع بجودة عالية وتوصلك لحد باب البيت.' } }
  );
  await Product.updateMany({}, { $set: { reviews: [] } });
  await Product.updateOne(
    { slug: 'story-khaled' },
    { $set: { originalPriceText: '185 ج.م' } }
  );
  await Product.updateOne(
    { slug: 'custom-story' },
    { $set: { originalPriceText: '340 ج.م' } }
  );

  await mongoose.disconnect();
  console.log('Story catalog truth synchronized.');
}

main().catch(async (error) => {
  console.error('Story catalog synchronization failed:', error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
