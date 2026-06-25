const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  path.join(__dirname, '../public/app.js'),
  path.join(__dirname, '../public/index.html')
];

const images = [
  'catalog-all.png', 'catalog-custom-stories.png', 'catalog-play-learn.png',
  'catalog-seraj-stories.png', 'catalog-tales.png', 'dad-mostafa.png',
  'family-group.png', 'grandma-fatima-seated.png', 'grandma-fatima.png',
  'huda-bird.png', 'instapay-qr.jpeg', 'khaled-v2.png', 'khaled.png',
  'layla-nobook.png', 'layla.png', 'mom-amira.png', 'omar.png', 'seraj.png',
  'share-banner.jpg', 'sharelinkbannar.png', 'zain.png'
];

for (const file of filesToUpdate) {
  let content = fs.readFileSync(file, 'utf-8');
  for (const img of images) {
    const ext = path.extname(img);
    const webpImg = img.replace(ext, '.webp');
    // Replace occurrences like assets/seraj.png or /assets/seraj.png
    // We can use a regex to replace the exact filename globally
    const regex = new RegExp(img, 'g');
    content = content.replace(regex, webpImg);
  }
  fs.writeFileSync(file, content, 'utf-8');
  console.log(`Updated ${file}`);
}
