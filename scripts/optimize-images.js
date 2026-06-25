const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../public/assets');

async function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      await processDirectory(fullPath);
    } else if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
      const isPng = file.endsWith('.png');
      const ext = path.extname(file);
      const webpPath = fullPath.replace(ext, '.webp');
      
      try {
        console.log(`Processing: ${file}`);
        await sharp(fullPath)
          .webp({ quality: 80, effort: 6 })
          .toFile(webpPath);
        
        console.log(`✅ Converted ${file} to WebP`);
        // We will keep the original files for now, or you can delete them
        // fs.unlinkSync(fullPath); 
      } catch (e) {
        console.error(`❌ Error converting ${file}:`, e);
      }
    }
  }
}

processDirectory(ASSETS_DIR).then(() => {
  console.log("All done!");
});
