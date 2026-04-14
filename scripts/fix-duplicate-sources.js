require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Article = mongoose.models.Article || mongoose.model("Article", new mongoose.Schema({}, { strict: false }));
  
  const articles = await Article.find({});
  let fixed = 0;
  
  for (const article of articles) {
    let md = article.contentMarkdown || '';
    let originalLen = md.length;
    
    // The actual format in the DB is: ## **مصادر وروابط**
    // Find this and remove everything from it to the end
    const markers = [
      '## **مصادر وروابط**',
      '### **مصادر وروابط**',
      '## مصادر وروابط',
      '### مصادر وروابط',
      '## **المصادر والمراجع**',
      '### **المصادر والمراجع**',
      '## المصادر والمراجع',
      '### المصادر والمراجع',
      '## **المصادر**',
      '## المصادر',
      // Without ##
      'مصادر وروابط\n',
    ];
    
    let cutIdx = -1;
    for (const m of markers) {
      const idx = md.indexOf(m);
      if (idx !== -1 && (cutIdx === -1 || idx < cutIdx)) {
        cutIdx = idx;
      }
    }
    
    if (cutIdx !== -1) {
      // Check if there's a --- separator before it (within 15 chars)
      const preceding = md.substring(Math.max(0, cutIdx - 15), cutIdx);
      const dashIdx = preceding.lastIndexOf('---');
      if (dashIdx !== -1) {
        cutIdx = cutIdx - (preceding.length - dashIdx);
      }
      
      let cleaned = md.substring(0, cutIdx).trim();
      article.contentMarkdown = cleaned;
      await article.save();
      fixed++;
      console.log('✅ Fixed:', article.title.substring(0, 70), '(-' + (originalLen - cleaned.length) + ' chars)');
    }
  }
  
  console.log('\n=== DONE ===');
  console.log('Fixed', fixed, 'of', articles.length, 'articles');
  
  process.exit(0);
}
fix();
