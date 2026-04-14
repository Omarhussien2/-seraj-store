require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function audit() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Article = mongoose.models.Article || mongoose.model("Article", new mongoose.Schema({}, { strict: false }));
  
  const articles = await Article.find({}).lean();
  
  console.log('=== ARTICLE AUDIT ===');
  console.log('Total articles:', articles.length);
  console.log('');
  
  articles.forEach(function(a) {
    console.log('---');
    console.log('Title:', a.title);
    console.log('Slug:', a.slug);
    console.log('Sources count:', (a.sources || []).length);
    
    // Check for duplicate source sections in markdown
    var md = a.contentMarkdown || '';
    var sourceMentions = [];
    if (md.includes('مصادر وروابط')) sourceMentions.push('مصادر وروابط');
    if (md.includes('المصادر والمراجع')) sourceMentions.push('المصادر والمراجع');
    if (md.includes('مراجع')) sourceMentions.push('مراجع (general)');
    if (md.includes('المصادر')) sourceMentions.push('المصادر');
    
    if (sourceMentions.length > 0) {
      console.log('⚠️  SOURCES IN MARKDOWN:', sourceMentions.join(', '));
    }
    
    // Check for very long lines that could cause horizontal scroll
    var lines = md.split('\n');
    var longLines = [];
    lines.forEach(function(line, i) {
      if (line.length > 200) {
        longLines.push({ line: i + 1, length: line.length, preview: line.substring(0, 80) + '...' });
      }
    });
    if (longLines.length > 0) {
      console.log('⚠️  LONG LINES (>200 chars):', longLines.length);
      longLines.forEach(function(l) {
        console.log('   Line', l.line, '(', l.length, 'chars):', l.preview);
      });
    }
    
    // Check for HTML or URLs that might overflow
    var urlMatches = md.match(/https?:\/\/[^\s\)]+/g);
    if (urlMatches) {
      var longUrls = urlMatches.filter(function(u) { return u.length > 80; });
      if (longUrls.length > 0) {
        console.log('⚠️  LONG URLS:', longUrls.length);
        longUrls.forEach(function(u) { console.log('   ', u.substring(0, 60) + '...'); });
      }
    }
    
    // Check for tables
    if (md.includes('|')) {
      var tableLines = lines.filter(function(l) { return l.trim().startsWith('|') && l.trim().endsWith('|'); });
      if (tableLines.length > 0) {
        console.log('📊 HAS TABLES:', tableLines.length, 'rows');
        // Check widest table row
        var maxCols = 0;
        tableLines.forEach(function(l) {
          var cols = l.split('|').filter(function(c) { return c.trim(); }).length;
          if (cols > maxCols) maxCols = cols;
        });
        console.log('   Max columns:', maxCols);
      }
    }
    
    console.log('');
  });
  
  process.exit(0);
}
audit();
