const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'index.html');
let html = fs.readFileSync(filePath, 'utf-8');

// 1. Replace Testimonials Grid
const testGridRegex = /<div class="testimonials-grid">([\s\S]*?)<\/div>\s*<\/section>/;
html = html.replace(testGridRegex, `<div class="testimonials-grid" id="testimonialsGrid">
          <!-- Injected dynamically by app.js -->
        </div>
      </section>`);

// 2. Add New Pages before products page
const productsSectionRegex = /<!-- ========================================================= -->\s*<!-- PRODUCTS/;
const newPages = `<!-- ========================================================= -->
    <!-- NEW PAGES: FAQ, Shipping, Returns                         -->
    <!-- ========================================================= -->
    <section class="page" data-page="faq">
      <div class="page-head">
        <h1 data-content-key="faq.title">الأسئلة المتكررة</h1>
      </div>
      <div class="wrapper content" style="max-width:800px; margin: 40px auto; padding: 0 20px; text-align: right;" data-content-key="faq.content">
        جاري التحميل...
      </div>
    </section>

    <section class="page" data-page="shipping">
      <div class="page-head">
        <h1 data-content-key="shipping.title">الشحن والتوصيل</h1>
      </div>
      <div class="wrapper content" style="max-width:800px; margin: 40px auto; padding: 0 20px; text-align: right;" data-content-key="shipping.content">
        جاري التحميل...
      </div>
    </section>

    <section class="page" data-page="returns">
      <div class="page-head">
        <h1 data-content-key="returns.title">سياسة الاستبدال والاسترجاع</h1>
      </div>
      <div class="wrapper content" style="max-width:800px; margin: 40px auto; padding: 0 20px; text-align: right;" data-content-key="returns.content">
        جاري التحميل...
      </div>
    </section>

    <!-- ========================================================= -->
    <!-- PRODUCTS`;

html = html.replace(productsSectionRegex, newPages);

// 3. Update Footer links
html = html.replace(/<a href="#">سياسة الاستبدال<\/a>/, '<a href="#/returns" data-link>سياسة الاستبدال</a>');
html = html.replace(/<a href="#">الشحن والتوصيل<\/a>/, '<a href="#/shipping" data-link>الشحن والتوصيل</a>');
html = html.replace(/<a href="#">الأسئلة المتكررة<\/a>/, '<a href="#/faq" data-link>الأسئلة المتكررة</a>');

fs.writeFileSync(filePath, html, 'utf-8');
console.log('HTML updated successfully');
