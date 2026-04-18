const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'index.html');
let html = fs.readFileSync(filePath, 'utf-8');

// Replace topnav
html = html.replace(/<a href="#\/mama-world" data-link>عالم ماما<\/a>/g, '<a href="#/mama-world" data-link data-content-key="nav.mama">عالم ماما</a>');
html = html.replace(/<a href="#\/products" data-link>المنتجات<\/a>/g, '<a href="#/products" data-link data-content-key="nav.products">المنتجات</a>');
html = html.replace(/<a href="#\/about" data-link>حكايتنا<\/a>/g, '<a href="#/about" data-link data-content-key="nav.about">حكايتنا</a>');

// Hero CTAs
html = html.replace(/<span>استكشفي عالم سراج<\/span>/g, '<span data-content-key="hero.cta_primary">استكشفي عالم سراج</span>');
html = html.replace(/<span>اصنعي قصة لابنك<\/span>/g, '<span data-content-key="hero.cta_secondary">اصنعي قصة لابنك</span>');

// Top marquee
html = html.replace(/<div class="marquee-track">([\s\S]*?)<\/div>/g, `<div class="marquee-track" data-content-key="hero.marquee">
            <span>قصص مخصصة</span><b>✦</b>
            <span>رسوم أصلية</span><b>✦</b>
            <span>قيم بنحبها</span><b>✦</b>
            <span>شحن لباب البيت</span><b>✦</b>
            <span>جودة طباعة عالية</span><b>✦</b>
          </div>`);

// About page
html = html.replace(/<p>"في عالمٍ استسلم لسحر الشاشات وأبطال الخيال الزائف، يبرز بطل من نوع مختلف.. بطل يجمع بين ذكاء العلم وعراقة التاريخ."<\/p>/g, '<p data-content-key="about.quote">"في عالمٍ استسلم لسحر الشاشات وأبطال الخيال الزائف، يبرز بطل من نوع مختلف.. بطل يجمع بين ذكاء العلم وعراقة التاريخ."</p>');
html = html.replace(/<p style="margin-top:16px">كان سراج ولداً عادياً من أسرة استثنائية([\s\S]*?)<\/p>/g, '<p style="margin-top:16px" data-content-key="about.story">كان سراج ولداً عادياً من أسرة استثنائية$1</p>');

// Success page
html = html.replace(/<h1>سِراج استلم الإيصال\.\. الحكاية بدأت!<\/h1>/g, '<h1 data-content-key="success.title">سِراج استلم الإيصال.. الحكاية بدأت!</h1>');
html = html.replace(/<p>هنراجع البيانات([\s\S]*?)<\/p>/g, '<p data-content-key="success.desc">هنراجع البيانات$1</p>');

// 404
html = html.replace(/<h1>الصفحة مش موجودة<\/h1>/g, '<h1 data-content-key="notfound.title">الصفحة مش موجودة</h1>');

// Footer
html = html.replace(/<p>قصص مخصصة بتعلّم بطلنا الصغير قيم بنحبها — من قلب قرية الابتكار\.<\/p>/g, '<p data-content-key="footer.brand_text">قصص مخصصة بتعلّم بطلنا الصغير قيم بنحبها — من قلب قرية الابتكار.</p>');

fs.writeFileSync(filePath, html, 'utf-8');
console.log('HTML keys injected successfully');
