/* ============================================================
   سِراج — Client-side router + interactions (v2 — API-connected)
   ============================================================ */

(function () {
  'use strict';

  // ----- Constants -----
  var WHATSAPP_NUMBER = '201152806034'; // fallback
  var INSTAPAY_NUMBER = 'omarhussien22'; // fallback
  var INSTAPAY_LINK = 'https://ipn.eg/S/omarhussien22/instapay/72tQbs'; // fallback
  var CART_KEY = 'seraj-cart';
  var WIZARD_KEY = 'seraj-wizard';
  var ORDER_KEY = 'seraj-last-order';

  // ----- Cloudinary Config -----
  var CLOUD_NAME = 'dkhndsrhr';
  var UPLOAD_PRESET = 'seraj-uploads';

  // ----- Wizard state (ephemeral) -----
  var state = {
    heroName: '',
    age: null,
    challenge: null,
    photoUrl: null,
    photoFile: null,
    photoUploading: false,
    wizardStep: 1,
  };

  // ----- Product Data (fallback — overwritten by API if available) -----
  var PRODUCTS = {
    'story-khaled': {
      name: 'قصة خالد بن الوليد',
      badge: 'الأكثر طلباً',
      price: 140,
      priceText: '١٤٠ ج.م',
      longDesc: 'تابع بطلنا في مغامرة ملهمة مع القائد خالد بن الوليد — القائد اللي ما خسرش معركة في حياته. القصة بتعلّم إن الشجاعة الحقيقية مش في القوة بس، لكن في الثبات والمرونة والجرأة إنه يعمل الصح حتى لو كان صعب.',
      features: ['٢٤ صفحة ملوّنة بجودة عالية', 'غلاف مقوّى مقاوم', 'رسوم أصلية بإيد فنانين مصريين', 'بتعلّم قيمة الشجاعة والإقدام', 'مناسبة من ٤ لـ ٩ سنين'],
      media: { type: 'book3d', image: 'assets/khaled-v2.png', title: 'خالد بن<br/>الوليد', bg: 'emerald' },
      action: 'cart',
      ctaText: 'أضيفي للسلة',
      reviews: [
        { text: 'ابني قعد يقرأ القصة مرتين في نفس اليوم! بقى بيقول "أنا شجاع زي خالد".', name: 'منى — أم يوسف', place: 'القاهرة · ٦ سنين', color: '#6bbf3f', initial: 'م' },
        { text: 'الرسومات تحفة والقصة مكتوبة بلغة بسيطة مفهومة. بنقرأها مع بعض كل يوم.', name: 'سارة — أم عمر', place: 'المنصورة · ٥ سنين', color: '#c9974e', initial: 'س' }
      ],
      related: ['custom-story', 'bundle']
    },
    'custom-story': {
      name: 'القصة المخصصة',
      badge: 'مخصصة باسم بطلنا',
      price: 220,
      priceText: '٢٢٠ ج.م',
      longDesc: 'قصة مغامرة كاملة باسم بطلك وبتعلّم قيمة من اختيارك. سراج بيكتب القصة مخصوص ليه وبيرسمها بإيد فنانين مصريين. غلاف مقوّى وورق سميك يستحمل كل مرات القراية.',
      features: ['٢٤ صفحة ملوّنة باسم طفلك', 'غلاف مقوّى مقاوم', 'رسوم أصلية بإيد فنانين مصريين', 'باسم طفلك على الغلاف والصفحات', 'اختاري القيمة اللي عايزاه يتعلمها'],
      media: { type: 'book3d', image: 'assets/seraj.png', title: 'حكاية<br/>بطلنا', bg: 'emerald' },
      action: 'wizard',
      ctaText: 'ابدئي القصة',
      reviews: [
        { text: 'ابني لسه مش مصدق إن فيه قصة باسمه! قعد يقراها مع بابا لحد ما نام.', name: 'منى — أم أحمد', place: 'القاهرة · ٦ سنين', color: '#6bbf3f', initial: 'م' },
        { text: 'أحلى حاجة إن القصة بتعلّم قيمة.. بنتي بقت بتقول "أنا شجاعة زي خالد".', name: 'نور — أم ليلى', place: 'الإسكندرية · ٥ سنين', color: '#e85d4c', initial: 'ن' },
        { text: 'الطباعة تحفة، الغلاف مقوّى والورق سميك.. تستاهل كل قرش وزيادة.', name: 'سارة — أم زين', place: 'المنصورة · ٤ سنين', color: '#c9974e', initial: 'س' }
      ],
      related: ['story-khaled', 'bundle']
    },
    'flash-cards': {
      name: 'كروت الروتين اليومي',
      badge: 'قريباً',
      badgeSoon: true,
      price: 150,
      priceText: '١٥٠ ج.م',
      longDesc: '٣٠ كارت مصوّر بتصميم ملوّن وجذاب، بتساعد طفلك ينظم يومه ويتعلم عادات صحية بشكل ممتع. كل كارت فيه رسمة واضحة لنشاط من أنشطة اليوم.',
      features: ['٣٠ كارت مصوّر ملوّن', 'بتغطي كل أنشطة اليوم', 'تصميم جذاب ومحبب للأطفال', 'بتعلّم المسؤولية والتنظيم', 'مناسبة من ٣ لـ ٧ سنين'],
      media: { type: 'cards-fan', bg: 'sand' },
      action: 'none',
      ctaText: 'قريباً',
      comingSoon: true,
      reviews: [
        { text: 'الكروت غيّرت روتين بنتي بالكامل! بقت هي اللي بتذكرني بأوقات الصلاة والأكل.', name: 'هدى — أم مريم', place: 'الإسكندرية · ٤ سنين', color: '#36a39a', initial: 'ه' },
        { text: 'أحلى استثمار لفلوسي. بنتي بقت بتظبط يومها لوحدها من غير ما أزعّلها.', name: 'ريم — أم آدم', place: 'الجيزة · ٥ سنين', color: '#6bbf3f', initial: 'ر' }
      ],
      related: ['story-khaled', 'bundle']
    },
    'bundle': {
      name: 'مجموعة الأبطال الصغار',
      badge: 'وفّري ٢٠٪',
      price: 420,
      originalPrice: 530,
      priceText: '٤٢٠ ج.م',
      originalPriceText: '٥٣٠ ج.م',
      longDesc: 'المجموعة الكاملة لبطلنا! قصة مخصصة باسمه + كروت روتين يومي + قصة من سلسلة سباق الفتوحات. وفّري ٢٠٪ لما تطلبيهم مع بعض!',
      features: ['قصة مخصصة باسم طفلك (٢٤ صفحة)', 'كروت الروتين اليومي (٣٠ كارت)', 'قصة من سلسلة سباق الفتوحات', 'غلاف مقوّى لكل المنتجات', 'بتوفّري ١١٠ جنيه!'],
      media: { type: 'bundle-stack', bg: 'teal' },
      action: 'cart',
      ctaText: 'أضيفي للسلة',
      reviews: [
        { text: 'طلبت المجموعة الكاملة وأولادي ماخلصوش منها لحد دلوقتي! كل قرش يستاهل.', name: 'أمينة — أم توأم', place: 'القاهرة · ٥ سنين', color: '#c9974e', initial: 'أ' },
        { text: 'أحلى هدية لأحفادي! الجودة ممتازة والمحتوى تعليمي وممتع في نفس الوقت.', name: 'فاطمة — جدة', place: 'المنصورة · ٤ و ٦ سنين', color: '#6bbf3f', initial: 'ف' }
      ],
      related: ['story-khaled', 'custom-story']
    }
  };

  // ----- Fetch Products from API (graceful fallback) -----
  function fetchProducts() {
    fetch('/api/products')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success && data.data && data.data.length > 0) {
          var apiProducts = {};
          data.data.forEach(function (p) { apiProducts[p.slug] = p; });
          PRODUCTS = apiProducts;
          console.log('✅ Products loaded from API (' + data.data.length + ')');
        }
      })
      .catch(function () {
        console.warn('⚠️ API fetch failed, using fallback products');
      });
  }

  // ----- Fetch Config from API (graceful fallback) -----
  function fetchConfig() {
    fetch('/api/config')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success && data.data) {
          if (data.data.whatsappNumber) WHATSAPP_NUMBER = data.data.whatsappNumber;
          if (data.data.instaPayNumber) INSTAPAY_NUMBER = data.data.instaPayNumber;
          if (data.data.instaPayLink) INSTAPAY_LINK = data.data.instaPayLink;
          console.log('✅ Config loaded from API');
        }
      })
      .catch(function () {
        console.warn('⚠️ Config fetch failed, using fallback values');
      });
  }

  // ----- Cart State -----
  // Each item: { slug, name, price, qty }
  var cart = [];

  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* silent */ }
  }

  function loadCart() {
    try {
      var saved = localStorage.getItem(CART_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cart = parsed.filter(function (item) {
            return item && item.slug && typeof item.price === 'number';
          });
        }
      }
    } catch (e) { cart = []; }
  }

  // ----- Wizard data localStorage -----
  function saveWizardData() {
    try {
      var ageNum = state.age;
      if (typeof ageNum === 'string') {
        ageNum = parseInt(ageNum, 10);
      }
      if (isNaN(ageNum)) ageNum = null;
      localStorage.setItem(WIZARD_KEY, JSON.stringify({
        heroName: state.heroName,
        age: ageNum,
        challenge: state.challenge || '',
        photoUrl: state.photoUrl || null
      }));
    } catch (e) { /* silent */ }
  }

  function loadWizardData() {
    try {
      var saved = localStorage.getItem(WIZARD_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  }

  function clearWizardData() {
    try { localStorage.removeItem(WIZARD_KEY); } catch (e) { /* silent */ }
  }

  function clearOrderData() {
    try { localStorage.removeItem(ORDER_KEY); } catch (e) { /* silent */ }
  }

  // ----- Helpers -----
  function calculateTotal() {
    var total = 0;
    cart.forEach(function (item) { total += item.price * item.qty; });
    return total;
  }

  function cartItemCount() {
    var count = 0;
    cart.forEach(function (item) { count += item.qty; });
    return count;
  }

  function isCustomStory(slug) {
    return slug === 'custom-story';
  }

  // VIP price = total + 50 per regular item + 70 per custom story item
  function calculateVIPPrice() {
    var vipTotal = 0;
    cart.forEach(function (item) {
      var fee = isCustomStory(item.slug) ? 70 : 50;
      vipTotal += (item.price + fee) * item.qty;
    });
    return vipTotal;
  }

  function toArabicNum(n) {
    var digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(n).replace(/[0-9]/g, function (d) { return digits[+d]; });
  }

  // ----- Product Detail Rendering -----
  function renderProductDetail(slug) {
    var container = document.getElementById('productDetail');
    if (!container) return;
    var product = PRODUCTS[slug];
    if (!product) {
      container.innerHTML = '<div class="page-head tight"><span class="kicker">المنتج غير موجود</span><h1>منتهي!</h1><p>المنتج ده مش موجود. شوفي منتجاتنا التانية.</p><a href="#/products" data-link class="btn btn-primary" style="margin-top:20px">شوفي المنتجات</a></div>';
      return;
    }
    var isSoon = product.comingSoon;
    var h = '';
    // Back nav
    h += '<div class="pd-topnav">';
    h += '<a href="#/products" data-link class="icon-btn"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M10 6l-6 6 6 6M4 12h16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></a>';
    h += '<span class="pd-nav-label">منتجات سِراج</span>';
    h += '<span></span></div>';
    // Hero
    h += '<div class="pd-wrap">';
    h += '<div class="pd-media ' + product.media.bg + ' reveal">' + renderMedia(product.media, true) + '</div>';
    h += '<div class="pd-body reveal">';
    if (product.badgeSoon) {
      h += '<span class="kicker" style="background:var(--cream-2);color:var(--ink-mute);border-color:var(--line)">' + product.badge + '</span>';
    } else {
      h += '<span class="kicker">' + product.badge + '</span>';
    }
    h += '<h1 class="pd-title">' + product.name + '</h1>';
    h += '<p class="pd-desc">' + product.longDesc + '</p>';
    h += '<ul class="feat-list">';
    for (var i = 0; i < product.features.length; i++) h += '<li>✦ ' + product.features[i] + '</li>';
    h += '</ul>';
    // Price + CTA
    h += '<div class="pd-foot">';
    var priceText = product.priceText || (toArabicNum(product.price) + ' ج.م');
    if (product.originalPriceText) {
      h += '<div class="price-group"><span class="price old-price">' + product.originalPriceText + '</span><span class="price big">' + priceText + '</span></div>';
    } else {
      h += '<span class="price big">' + priceText + '</span>';
    }
    if (isSoon) {
      h += '<button class="btn btn-primary btn-xl" disabled style="opacity:.5;cursor:not-allowed">' + product.ctaText + '</button>';
    } else if (product.action === 'wizard') {
      h += '<a href="#/wizard" data-link class="btn btn-primary btn-xl">' + product.ctaText + ' <svg viewBox="0 0 24 24" width="22" height="22"><path d="M14 6l-6 6 6 6" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></a>';
    } else if (product.action === 'cart') {
      h += '<button class="btn btn-primary btn-xl" data-add-cart="' + slug + '">' + product.ctaText + ' <svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/></svg></button>';
    }
    h += '</div></div></div>';
    // Video placeholder
    h += '<section class="section pd-video-section"><div class="section-head"><span class="kicker">فيديو المنتج</span><h2>شوفي المنتج بالتفصيل</h2><p>فيديو هيوريك المنتج عن قرب</p></div>';
    h += '<div class="pd-video-placeholder"><svg viewBox="0 0 48 48" width="48" height="48"><circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" stroke-width="2.5"/><polygon points="20,16 34,24 20,32" fill="currentColor"/></svg><p>الفيديو هيتوفر قريباً</p></div></section>';
    // Reviews
    h += '<section class="section pd-reviews-section"><div class="section-head"><span class="kicker">آراء الأمهات</span><h2>اللي جربوا المنتج ده</h2></div><div class="testimonials-grid">';
    for (var r = 0; r < product.reviews.length; r++) {
      var rev = product.reviews[r];
      h += '<figure class="t-card"><blockquote>"' + rev.text + '"</blockquote><figcaption><span class="avatar" style="--c:' + rev.color + '">' + rev.initial + '</span><div><strong>' + rev.name + '</strong><small>' + rev.place + '</small></div></figcaption></figure>';
    }
    h += '</div></section>';
    // Related
    if (product.related && product.related.length) {
      h += '<section class="section pd-related-section"><div class="section-head"><span class="kicker">هيعجب بطلنا كمان</span><h2>منتجات مقترحة</h2></div><div class="products-grid">';
      for (var p = 0; p < product.related.length; p++) {
        var rs = product.related[p], rp = PRODUCTS[rs];
        if (!rp) continue;
        var href = rp.action === 'wizard' ? '#/wizard' : '#/product/' + rs;
        var rpPrice = rp.priceText || (toArabicNum(rp.price) + ' ج.م');
        h += '<a href="' + href + '" data-link class="product-card"><div class="product-media ' + rp.media.bg + '">' + renderMedia(rp.media, false) + '</div><div class="product-body"><h3>' + rp.name + '</h3><div class="product-foot"><span class="price">' + rpPrice + '</span><span class="cta-mini">شوفيها →</span></div></div></a>';
      }
      h += '</div></section>';
    }
    container.innerHTML = h;
    setTimeout(initReveals, 100);
  }

  function renderMedia(media, big) {
    var size = big ? ' big' : '';
    if (media.type === 'book3d') return '<div class="book3d' + size + '"><div class="book3d-cover"><span class="book3d-title">' + media.title + '</span><img src="' + media.image + '" class="book3d-mascot" alt="" loading="lazy"/></div></div>';
    if (media.type === 'cards-fan') { var c = ['#e85d4c', '#c9974e', '#36a39a', '#6bbf3f', '#8b5e2a'], f = '<div class="cards-fan">'; for (var i = 0; i < c.length; i++) f += '<i style="--i:' + i + ';--c:' + c[i] + '"></i>'; return f + '</div>'; }
    if (media.type === 'bundle-stack') return '<div class="bundle-stack"><div class="bundle-i"></div><div class="bundle-i"></div><div class="bundle-i"></div></div>';
    return '';
  }

  // ----- Cart helpers -----
  function updateCartBadge() {
    var badge = document.getElementById('cartCount');
    if (!badge) return;
    var count = cartItemCount();
    if (count > 0) { badge.textContent = count; badge.hidden = false; }
    else { badge.hidden = true; }
  }

  function showToast(msg) {
    var old = document.getElementById('gsdToast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.id = 'gsdToast';
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 2200);
  }

  // ----- Cart Page Rendering -----
  function renderCartPage() {
    var container = document.getElementById('cartPage');
    if (!container) return;

    if (cart.length === 0) {
      container.innerHTML =
        '<div class="cart-empty">' +
        '<svg viewBox="0 0 24 24" width="64" height="64"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '<h2>السلة فاضية!</h2>' +
        '<p>مفيش منتجات في السلة دلوقتي.. شوفي منتجاتنا الحلوة!</p>' +
        '<a href="#/products" data-link class="btn btn-primary btn-xl">شوفي المنتجات</a>' +
        '</div>';
      return;
    }

    var h = '<div class="page-head tight"><span class="kicker">سِراج</span><h1>سلة بطلنا</h1></div>';
    h += '<div class="cart-items">';

    var total = 0;

    cart.forEach(function (item) {
      var product = PRODUCTS[item.slug];
      if (!product) return;
      var lineTotal = item.price * item.qty;
      total += lineTotal;
      var bgClass = product.media.bg === 'emerald' ? 'emerald-bg' : product.media.bg === 'sand' ? 'sand-bg' : 'teal-bg';
      h += '<div class="cart-item">';
      h += '<div class="cart-item-media ' + bgClass + '">' + renderMedia(product.media, false) + '</div>';
      h += '<div class="cart-item-info"><h3>' + item.name + '</h3>';
      h += '<span class="price">' + toArabicNum(item.price) + ' ج.م</span>';
      if (item.qty > 1) {
        h += '<span class="cart-qty"> × ' + toArabicNum(item.qty) + ' = ' + toArabicNum(lineTotal) + ' ج.م</span>';
      }
      h += '</div>';
      h += '<button class="cart-remove" data-remove-cart="' + item.slug + '" title="شيلي واحدة">✕</button>';
      h += '</div>';
    });

    h += '</div>';

    // Summary
    var deposit = 50;
    h += '<div class="cart-summary">';
    h += '<div class="cart-summary-row"><span>المجموع الفرعي</span><span>' + toArabicNum(total) + ' ج.م</span></div>';
    h += '<div class="cart-summary-row"><span>الشحن</span><span style="color:var(--seraj-dark);font-weight:700">مجاناً ✦</span></div>';
    h += '<div class="cart-summary-row total"><span>الإجمالي</span><span>' + toArabicNum(total) + ' ج.م</span></div>';
    h += '</div>';
    h += '<p class="cart-note">🎯 عربون جدية ' + toArabicNum(deposit) + ' ج.م بس عشان نبدأ، والباقي بعد الاستلام</p>';

    h += '<a href="#/checkout" data-link class="btn btn-primary btn-xl btn-fullrow" style="margin-top:24px">إتمام الطلب</a>';
    h += '<a href="#/products" data-link class="btn btn-ghost btn-fullrow" style="margin-top:8px">كملي التسوق</a>';

    container.innerHTML = h;
  }

  // ----- Checkout Page Rendering -----
  function renderCheckoutPage() {
    var container = document.getElementById('checkoutPage');
    if (!container) return;

    if (cart.length === 0) {
      container.innerHTML =
        '<div class="cart-empty">' +
        '<h2>السلة فاضية!</h2>' +
        '<p>مفيش منتجات في الطلب دلوقتي.</p>' +
        '<a href="#/products" data-link class="btn btn-primary btn-xl">شوفي المنتجات</a>' +
        '</div>';
      return;
    }

    var total = calculateTotal();
    var vipTotal = calculateVIPPrice();
    var deposit = 50;

    var h = '';

    // Order summary
    h += '<div class="checkout-summary">';
    h += '<h3 style="font-size:18px;margin-bottom:16px;">ملخص الطلب</h3>';
    cart.forEach(function (item) {
      var product = PRODUCTS[item.slug];
      var bgClass = product && product.media ? (product.media.bg === 'emerald' ? 'emerald-bg' : product.media.bg === 'sand' ? 'sand-bg' : 'teal-bg') : '';
      h += '<div class="cart-item" style="margin-bottom:8px">';
      if (product && product.media) {
        h += '<div class="cart-item-media ' + bgClass + '" style="width:48px;height:48px;min-width:48px">' + renderMedia(product.media, false) + '</div>';
      }
      h += '<div class="cart-item-info"><h3 style="font-size:14px">' + item.name;
      if (item.qty > 1) h += ' × ' + toArabicNum(item.qty);
      h += '</h3>';
      h += '<span class="price" style="font-size:16px">' + toArabicNum(item.price * item.qty) + ' ج.م</span>';
      h += '</div></div>';
    });
    h += '<div class="cart-summary" style="margin-top:12px">';
    h += '<div class="cart-summary-row total"><span>الإجمالي</span><span>' + toArabicNum(total) + ' ج.م</span></div>';
    h += '</div></div>';

    // Payment options
    h += '<div class="pay-stack">';
    h += '<label class="pay-option reveal">';
    h += '<input type="radio" name="pay" value="deposit" checked/>';
    h += '<div class="pay-media"><img src="assets/seraj.png" alt="" class="tiny-mascot" loading="lazy"/></div>';
    h += '<div class="pay-body">';
    h += '<span class="pay-kicker">الأكثر راحة</span>';
    h += '<h3>عربون جدية — ' + toArabicNum(deposit) + ' جنيه</h3>';
    h += '<p>ادفعي ' + toArabicNum(deposit) + ' جنيه بس وسِراج هيبدأ شغل، والباقي بعد ما تشوفي البروفة.</p>';
    h += '<strong class="pay-price">' + toArabicNum(deposit) + ' ج.م الآن</strong>';
    h += '</div><span class="pay-check">✓</span></label>';

    h += '<label class="pay-option reveal">';
    h += '<input type="radio" name="pay" value="vip"/>';
    h += '<div class="pay-media ember"><span class="vip-badge">VIP</span></div>';
    h += '<div class="pay-body">';
    h += '<span class="pay-kicker">أولوية في الطابور</span>';
    h += '<h3>أولوية VIP — ' + toArabicNum(vipTotal) + ' جنيه</h3>';
    h += '<p>خلصي الدفع دلوقتي وطلباتك هتخلص أول واحدة!</p>';
    h += '<strong class="pay-price">' + toArabicNum(vipTotal) + ' ج.م بالكامل</strong>';
    h += '</div><span class="pay-check">✓</span></label>';
    h += '</div>';

    // InstaPay card — real QR image
    h += '<div class="insta-card reveal">';
    h += '<div class="insta-head"><span>ادفعي على InstaPay</span></div>';
    h += '<div class="insta-body">';
    h += '<div class="qr"><img src="assets/instapay-qr.jpeg" alt="InstaPay QR" style="width:100%;height:100%;object-fit:contain;border-radius:8px" loading="lazy"/></div>';
    h += '<div class="insta-num"><small>Username</small><strong>' + INSTAPAY_NUMBER + '</strong><small>أو اضغطي على الرابط:</small>';
    h += '<a href="' + INSTAPAY_LINK + '" target="_blank" rel="noopener" style="color:var(--seraj);font-weight:700;word-break:break-all">ipn.eg/S/' + INSTAPAY_NUMBER + '</a></div>';
    h += '</div></div>';

    // Customer form
    h += '<div class="checkout-form-section">';
    h += '<h3 style="font-size:18px;margin-bottom:16px">بيانات التوصيل</h3>';
    h += '<form id="checkoutForm" class="checkout-form" onsubmit="return false">';
    h += '<label class="field"><span>اسم الأم <small style="color:var(--ember)">*</small></span>';
    h += '<input type="text" id="custName" required placeholder="الاسم بالكامل" autocomplete="name"/></label>';
    h += '<label class="field"><span>رقم الموبايل (واتساب) <small style="color:var(--ember)">*</small></span>';
    h += '<div style="position:relative">';
    h += '<span style="position:absolute;left:16px;top:50%;transform:translateY(-50%);font-size:14px;color:var(--ink-mute);font-weight:600;pointer-events:none">🇪🇬</span>';
    h += '<input type="tel" id="custPhone" required pattern="01[0-9]{9}" placeholder="01xxxxxxxxx" autocomplete="tel" dir="ltr" style="text-align:left;padding-left:48px"/></label>';
    h += '</div>';
    h += '<label class="field"><span>العنوان <small style="color:var(--ember)">*</small></span>';
    h += '<textarea id="custAddress" required placeholder="العنوان بالتفصيل: المدينة، المنطقة، الشارع..." rows="2"></textarea></label>';
    h += '<label class="field"><span>ملاحظات <small style="color:var(--ink-mute)">(اختياري)</small></span>';
    h += '<textarea id="custNotes" placeholder="أي ملاحظات تانية..." rows="2"></textarea></label>';
    h += '</form></div>';

    // Submit button
    h += '<button id="submitOrderBtn" class="btn btn-primary btn-xl btn-fullrow" style="margin-top:20px">';
    h += 'تأكيد الطلب</button>';

    container.innerHTML = h;
    setTimeout(initReveals, 60);
  }

  // ----- Submit Order -----
  function submitOrder() {
    var form = document.getElementById('checkoutForm');
    if (!form) return;

    var nameEl = document.getElementById('custName');
    var phoneEl = document.getElementById('custPhone');
    var addressEl = document.getElementById('custAddress');
    var notesEl = document.getElementById('custNotes');

    // Validate
    var valid = true;
    [nameEl, phoneEl, addressEl].forEach(function (el) {
      el.classList.remove('shake');
    });

    if (!nameEl.value.trim()) { nameEl.classList.add('shake'); valid = false; }
    if (!phoneEl.value.trim() || !/^01[0-9]{9}$/.test(phoneEl.value.trim())) {
      phoneEl.classList.add('shake'); valid = false;
    }
    if (!addressEl.value.trim()) { addressEl.classList.add('shake'); valid = false; }

    if (!valid) {
      showToast('لو سمحتي compléti البيانات المطلوبة ✦');
      setTimeout(function () {
        [nameEl, phoneEl, addressEl].forEach(function (el) { el.classList.remove('shake'); });
      }, 600);
      return;
    }

    var paymentType = 'deposit';
    var payRadio = document.querySelector('input[name="pay"]:checked');
    if (payRadio && payRadio.value === 'vip') paymentType = 'vip';

    var total = calculateTotal();
    var deposit = paymentType === 'vip' ? total : 50;

    var orderData = {
      customerName: nameEl.value.trim(),
      customerPhone: phoneEl.value.trim(),
      address: addressEl.value.trim(),
      notes: notesEl.value.trim() || '',
      items: cart.map(function (item) {
        return {
          productSlug: item.slug,
          name: item.name,
          price: item.price,
          qty: item.qty
        };
      }),
      total: paymentType === 'vip' ? calculateVIPPrice() : total,
      deposit: deposit,
      paymentMethod: 'instapay'
    };

    // Include wizard/custom story data ONLY if custom-story is in the cart
    var hasCustomStory = cart.some(function (item) { return item.slug === 'custom-story'; });
    var wizardData = loadWizardData();
    if (hasCustomStory && wizardData && wizardData.heroName) {
      var wizardAge = typeof wizardData.age === 'string' ? parseInt(wizardData.age, 10) : wizardData.age;
      if (isNaN(wizardAge)) wizardAge = 5; // fallback
      orderData.customStory = {
        heroName: wizardData.heroName,
        age: wizardAge,
        challenge: wizardData.challenge || 'شجاعة',
        photoUrl: wizardData.photoUrl || undefined
      };
    }

    // Disable button
    var btn = document.getElementById('submitOrderBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'جاري إرسال الطلب...';
      btn.style.opacity = '0.7';
    }

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success && data.data) {
          // Save order info for success page
          try {
            localStorage.setItem(ORDER_KEY, JSON.stringify({
              orderNumber: data.data.orderNumber,
              total: data.data.total,
              deposit: data.data.deposit
            }));
          } catch (e) { /* silent */ }

          // Clear cart and wizard data
          cart = [];
          saveCart();
          clearWizardData();
          updateCartBadge();

          // Navigate to success
          location.hash = '#/success';
        } else {
          // Show actual error from server
          var errorMsg = 'حصلت مشكلة، حاولي تاني ✦';
          if (data.error === 'Validation failed' && data.details && data.details.length > 0) {
            var fields = data.details.map(function (d) { return d.field; }).join('، ');
            errorMsg = 'خطأ في: ' + fields + ' ✦';
          } else if (data.error) {
            errorMsg = data.error + ' ✦';
          }
          throw new Error(errorMsg);
        }
      })
      .catch(function (err) {
        console.error('Order submission error:', err);
        showToast(err.message || 'حصلت مشكلة، حاولي تاني ✦');
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'تأكيد الطلب';
          btn.style.opacity = '1';
        }
      });
  }

  // ----- Success Page Rendering -----
  function renderSuccessPage() {
    var orderNumEl = document.getElementById('orderNumDisplay');
    var whatsappEl = document.getElementById('whatsappLink');

    try {
      var saved = localStorage.getItem(ORDER_KEY);
      if (saved) {
        var orderData = JSON.parse(saved);
        if (orderNumEl && orderData.orderNumber) {
          orderNumEl.textContent = orderData.orderNumber;
        }
        if (whatsappEl && orderData.orderNumber) {
          var msg = encodeURIComponent(
            'السلام عليكم، طلبي رقم ' + orderData.orderNumber + ' على متجر سراج. ها هي صورة الإيصال.'
          );
          whatsappEl.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + msg;
        }
      }
    } catch (e) { /* silent */ }
  }

  // ----- Remove from cart handler -----
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-remove-cart]');
    if (!btn) return;
    var slug = btn.dataset.removeCart;
    var idx = -1;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].slug === slug) { idx = i; break; }
    }
    if (idx === -1) return;
    if (cart[idx].qty > 1) {
      cart[idx].qty--;
    } else {
      cart.splice(idx, 1);
    }
    saveCart();
    updateCartBadge();
    renderCartPage();
    showToast('تم الشيل من السلة');
  });

  // ----- Submit order handler -----
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('#submitOrderBtn');
    if (!btn || btn.disabled) return;
    submitOrder();
  });

  // ----- Router -----
  var pages = document.querySelectorAll('.page');
  var bottomTabs = document.querySelectorAll('.bottom-nav a[data-tab]');

  function parseRoute() {
    var hash = location.hash.replace(/^#\//, '') || 'home';
    var parts = hash.split('/');
    var page = parts[0];
    var sub = parts[1];
    if (!page || page === '#') return { page: 'home', sub: undefined };
    return { page: page, sub: sub };
  }

  // Valid page names for the SPA router
  var validPages = ['home', 'products', 'about', 'wizard', 'preview', 'checkout', 'success', 'cart', 'product', 'mama-world'];

  function showPage(name, sub) {
    var target = name;
    // Check if this is a valid page, if not show 404
    if (validPages.indexOf(name) === -1) {
      target = 'not-found';
      name = 'not-found';
    }
    if (name === 'product') target = 'product';

    pages.forEach(function (p) {
      var isActive = p.dataset.page === target;
      p.classList.toggle('is-active', isActive);
    });

    bottomTabs.forEach(function (a) {
      a.classList.toggle('is-active', a.dataset.tab === name);
    });

    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(initReveals, 80);

    if (name === 'product') renderProductDetail(sub);
    if (name === 'cart') renderCartPage();
    if (name === 'checkout') renderCheckoutPage();
    if (name === 'wizard') setupWizard();
    if (name === 'success') {
      burstConfetti();
      renderSuccessPage();
    }
    if (name === 'mama-world') initMamaWorld();
    if (name === 'preview') {
      var heroName = state.heroName || 'بطلنا';
      document.querySelectorAll('#previewName, #previewName2')
        .forEach(function (el) { el.textContent = heroName; });
    }
  }

  function handleRoute() {
    var route = parseRoute();
    showPage(route.page, route.sub);
  }

  // Intercept data-link clicks
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[data-link]');
    if (!link) {
      var bareLink = e.target.closest('a[href="#"]');
      if (bareLink) e.preventDefault();
      return;
    }
    var href = link.getAttribute('href');
    if (!href || !href.startsWith('#/')) return;
  });

  window.addEventListener('hashchange', handleRoute);

  // ----- Reveal on scroll -----
  var revealObserver;
  function initReveals() {
    var els = document.querySelectorAll('.page.is-active .reveal:not(.is-visible), .page.is-active .how-section');
    if (revealObserver) revealObserver.disconnect();
    revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach(function (el) { revealObserver.observe(el); });
  }

  // ----- Counter -----
  function initCounter() {
    var counters = document.querySelectorAll('.counter');
    var arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    var toArabic = function (n) { return String(n).replace(/[0-9]/g, function (d) { return arabicDigits[+d]; }); };

    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var to = parseInt(el.dataset.to, 10) || 0;
          var duration = 1800;
          var start = performance.now();
          function step(t) {
            var p = Math.min((t - start) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = toArabic(Math.round(to * eased));
            if (p < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
          obs.unobserve(el);
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach(function (c) { obs.observe(c); });
  }

  // ----- Wizard -----
  var wizardInited = false;
  function setupWizard() {
    var wizardShell = document.querySelector('[data-page="wizard"] .wizard-shell');
    if (!wizardShell) return;

    // Reset wizard state when entering the wizard page
    state.wizardStep = 1;
    state.heroName = '';
    state.age = null;
    state.challenge = null;

    var nameInput = wizardShell.querySelector('#heroName');
    if (nameInput) nameInput.value = '';
    wizardShell.querySelectorAll('.age-chip').forEach(function (c) { c.classList.remove('is-active'); });
    wizardShell.querySelectorAll('.challenge-card').forEach(function (c) { c.classList.remove('is-active'); });

    var genBar = wizardShell.querySelector('#genBar');
    if (genBar) genBar.style.width = '0%';

    goToWizardStep(1);

    if (wizardInited) return;
    wizardInited = true;

    // ----- Photo upload (Step 3) -----
    var photoInput = wizardShell.querySelector('#photoInput');
    var dropzone = wizardShell.querySelector('.dropzone');

    if (photoInput) {
      photoInput.addEventListener('change', function (e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;

        // Validate type
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          showToast('الصورة لازم تكون JPEG أو PNG أو WebP ✦');
          return;
        }
        // Validate size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          showToast('حجم الصورة أكبر من ٥ ميجا ✦');
          return;
        }

        state.photoFile = file;

        // Show preview
        var reader = new FileReader();
        reader.onload = function (ev) {
          if (dropzone) {
            dropzone.classList.add('has-photo');
            // Check if preview already exists
            var existing = dropzone.querySelector('.dz-preview');
            if (existing) existing.remove();

            var preview = document.createElement('div');
            preview.className = 'dz-preview';
            preview.innerHTML = '<img src="' + ev.target.result + '" alt="صورة بطلنا" style="width:100%;height:100%;object-fit:cover;border-radius:14px"/>';
            dropzone.appendChild(preview);
          }
        };
        reader.readAsDataURL(file);
      });
    }

    // Drag & drop support
    if (dropzone) {
      dropzone.addEventListener('dragover', function (e) {
        e.preventDefault();
        dropzone.classList.add('drag-over');
      });
      dropzone.addEventListener('dragleave', function () {
        dropzone.classList.remove('drag-over');
      });
      dropzone.addEventListener('drop', function (e) {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        var file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (file && photoInput) {
          // Set the file on the input for consistency
          var dt = new DataTransfer();
          dt.items.add(file);
          photoInput.files = dt.files;
          photoInput.dispatchEvent(new Event('change'));
        }
      });
    }

    wizardShell.querySelectorAll('.age-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        wizardShell.querySelectorAll('.age-chip').forEach(function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        // Use data-age (Latin numeral) instead of textContent (Arabic numeral)
        state.age = parseInt(chip.getAttribute('data-age') || chip.textContent.trim(), 10);
      });
    });

    if (nameInput) {
      nameInput.addEventListener('input', function (e) {
        state.heroName = e.target.value.trim();
      });
    }

    wizardShell.querySelectorAll('.challenge-card').forEach(function (card) {
      card.addEventListener('click', function () {
        wizardShell.querySelectorAll('.challenge-card').forEach(function (c) { c.classList.remove('is-active'); });
        card.classList.add('is-active');
        state.challenge = card.querySelector('h4') ? card.querySelector('h4').textContent : '';
      });
    });

    wizardShell.querySelectorAll('[data-next]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = state.wizardStep + 1;
        if (next > 4) {
          saveWizardData();
          addCustomStoryToCart();
          location.hash = '#/preview';
          return;
        }
        if (state.wizardStep === 1 && !state.heroName) {
          if (nameInput) {
            nameInput.focus();
            nameInput.classList.add('shake');
            setTimeout(function () { nameInput.classList.remove('shake'); }, 500);
          }
          return;
        }
        goToWizardStep(next);
      });
    });

    wizardShell.querySelector('[data-back]') && wizardShell.querySelector('[data-back]').addEventListener('click', function () {
      if (state.wizardStep === 1) {
        history.back();
      } else {
        goToWizardStep(state.wizardStep - 1);
      }
    });
  }

  function goToWizardStep(n) {
    state.wizardStep = n;
    var shell = document.querySelector('[data-page="wizard"] .wizard-shell');
    if (!shell) return;

    shell.querySelectorAll('.wizard-step').forEach(function (s) {
      s.hidden = parseInt(s.dataset.step, 10) !== n;
    });

    var bar = shell.querySelector('#wizBar');
    var label = shell.querySelector('#wizStepLabel');
    var arabicDigits = ['٠', '١', '٢', '٣', '٤'];
    if (bar) bar.style.width = n * 25 + '%';
    if (label) label.textContent = 'الخطوة ' + arabicDigits[n] + ' من ٤';

    setTimeout(initReveals, 60);

    if (n === 4) {
      // Upload photo before running generator
      uploadPhotoAndGenerate();
    }
  }

  function uploadPhotoAndGenerate() {
    if (state.photoFile && !state.photoUrl) {
      state.photoUploading = true;
      var formData = new FormData();
      formData.append('file', state.photoFile);

      fetch('/api/upload-child-photo', {
        method: 'POST',
        body: formData
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.success && data.data) {
            state.photoUrl = data.data.url;
          }
          state.photoUploading = false;
          saveWizardData();
          runGenerator();
        })
        .catch(function () {
          state.photoUploading = false;
          saveWizardData();
          runGenerator();
        });
    } else {
      saveWizardData();
      runGenerator();
    }
  }

  function runGenerator() {
    var bar = document.querySelector('#genBar');
    var text = document.querySelector('#genText');
    var stages = [
      'بيخترع شخصيات القصة',
      'بيرسم الغلاف',
      'بيكتب أول فصل',
      'بيلون الصفحات',
      'خلصت المغامرة!',
    ];
    var pct = 0;
    var stageIdx = 0;
    if (text) text.textContent = stages[0];
    var int = setInterval(function () {
      pct += Math.random() * 8 + 4;
      if (pct > 100) pct = 100;
      if (bar) bar.style.width = pct + '%';
      var newStage = Math.min(Math.floor(pct / 22), stages.length - 1);
      if (newStage !== stageIdx && text) {
        stageIdx = newStage;
        text.textContent = stages[stageIdx];
      }
      if (pct >= 100) {
        clearInterval(int);
        // Save wizard data when generator completes
        saveWizardData();
        setTimeout(function () {
          addCustomStoryToCart();
          location.hash = '#/preview';
        }, 700);
      }
    }, 180);
  }

  // Add custom story to cart if not already there
  function addCustomStoryToCart() {
    var existing = false;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].slug === 'custom-story') {
        existing = true;
        break;
      }
    }
    if (!existing && PRODUCTS['custom-story']) {
      var p = PRODUCTS['custom-story'];
      cart.push({
        slug: 'custom-story',
        name: p.name,
        price: p.price,
        qty: 1
      });
      saveCart();
      updateCartBadge();
    }
  }

  // ----- Confetti -----
  function burstConfetti() {
    var host = document.getElementById('confetti');
    if (!host) return;
    host.innerHTML = '';
    var colors = ['#6bbf3f', '#c9974e', '#e85d4c', '#36a39a', '#ffffff'];
    for (var i = 0; i < 60; i++) {
      var s = document.createElement('span');
      s.style.setProperty('--c', colors[i % colors.length]);
      s.style.setProperty('--dur', (2.2 + Math.random() * 2) + 's');
      s.style.setProperty('--delay', (Math.random() * 2) + 's');
      s.style.setProperty('--rot', Math.random() * 360 + 'deg');
      s.style.left = Math.random() * 100 + '%';
      s.style.width = (6 + Math.random() * 8) + 'px';
      s.style.height = (10 + Math.random() * 10) + 'px';
      host.appendChild(s);
    }
  }

  // ----- Mama World Tabs -----
  var mamaInited = false;
  function initMamaWorld() {
    if (!mamaInited) {
      document.querySelectorAll('.mama-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
          var target = tab.dataset.mamaTab;
          document.querySelectorAll('.mama-tab').forEach(function (t) { t.classList.remove('is-active'); });
          tab.classList.add('is-active');
          document.querySelectorAll('.mama-panel').forEach(function (p) { p.classList.remove('is-active'); });
          var panel = document.querySelector('[data-mama-panel="' + target + '"]');
          if (panel) panel.classList.add('is-active');
          setTimeout(initReveals, 80);
        });
      });
      mamaInited = true;
    }
    document.querySelectorAll('.mama-tab').forEach(function (t) { t.classList.remove('is-active'); });
    document.querySelectorAll('.mama-panel').forEach(function (p) { p.classList.remove('is-active'); });
    var articlesTab = document.querySelector('[data-mama-tab="articles"]');
    var articlesPanel = document.querySelector('[data-mama-panel="articles"]');
    if (articlesTab) articlesTab.classList.add('is-active');
    if (articlesPanel) articlesPanel.classList.add('is-active');
  }

  // ----- Shake animation hook -----
  var styleShake = document.createElement('style');
  styleShake.textContent =
    '@keyframes shakeX { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }' +
    '.shake { animation: shakeX .35s ease; border-color: #e85d4c !important; }';
  document.head.appendChild(styleShake);

  // ----- Checkout form textarea styles -----
  var checkoutStyles = document.createElement('style');
  checkoutStyles.textContent =
    '.field textarea {' +
    '  width: 100%; padding: 14px 16px; border: 2px solid var(--line); border-radius: 14px;' +
    '  font-family: var(--body); font-size: 16px; background: var(--paper);' +
    '  resize: vertical; transition: box-shadow .2s, border-color .2s;' +
    '}' +
    '.field textarea:focus { outline: none; border-color: var(--seraj); box-shadow: 0 4px 0 var(--seraj-dark), 0 0 0 4px var(--seraj-wash); }' +
    '.field textarea::placeholder { color: var(--ink-mute); font-weight: 500; }' +
    '.checkout-form-section { max-width: 640px; margin: 28px auto 0; padding: 0 20px; }' +
    '.checkout-summary { max-width: 640px; margin: 20px auto 0; padding: 0 20px; }' +
    '.cart-qty { font-size: 14px; color: var(--ink-mute); font-weight: 600; margin-right: 6px; }' +
    '.checkout-form { display: grid; gap: 18px; }' +
    '.checkout-form .field { display: block; }' +
    // Dropzone photo preview styles
    '.dropzone.has-photo { border-style: solid; border-color: var(--seraj); }' +
    '.dropzone .dz-preview { position: absolute; inset: 0; z-index: 2; }' +
    '.dropzone.has-photo > :not(.dz-preview) { opacity: 0; }' +
    '.dropzone.drag-over { border-color: var(--seraj); background: var(--seraj-wash); }';
  document.head.appendChild(checkoutStyles);

  // ----- Value cards pre-select on landing (visual) -----
  document.addEventListener('click', function (e) {
    var vc = e.target.closest('.value-card');
    if (!vc) return;
    document.querySelectorAll('.value-card').forEach(function (c) { c.classList.remove('is-active'); });
    vc.classList.add('is-active');
    setTimeout(function () { location.hash = '#/wizard'; }, 220);
  });

  // ----- Filter Chips (Catalog) -----
  document.addEventListener('click', function (e) {
    var chip = e.target.closest('.chip[data-filter]');
    if (!chip) return;
    var container = chip.closest('.filter-chips');
    if (!container) return;
    container.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('is-active'); });
    chip.classList.add('is-active');
    var filter = chip.dataset.filter;
    var grid = document.getElementById('catalogGrid');
    if (!grid) return;
    grid.querySelectorAll('[data-cat]').forEach(function (card) {
      if (filter === 'all' || card.dataset.cat === filter) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  });

  // ----- Hero Video: Lazy-load + Intersection Observer -----
  function initHeroVideo() {
    var wrap = document.querySelector('[data-video-hero]');
    if (!wrap) return;
    var video = wrap.querySelector('video');
    if (!video) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (video.readyState === 0) video.load();
            video.play().catch(function () { /* autoplay blocked */ });
            wrap.classList.add('is-playing');
          } else {
            video.pause();
            wrap.classList.remove('is-playing');
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(wrap);
    video.addEventListener('error', function () { wrap.classList.remove('is-playing'); });
  }

  // ----- Zig-Zag Section Videos: Lazy-load -----
  function initZigzagVideos() {
    var wraps = document.querySelectorAll('.zz-video-wrap');
    if (!wraps.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var wrap = entry.target;
          var video = wrap.querySelector('video');
          if (!video) return;
          if (entry.isIntersecting) {
            if (video.readyState === 0) video.load();
            video.play().catch(function () { });
            wrap.classList.add('is-playing');
          } else {
            video.pause();
            wrap.classList.remove('is-playing');
          }
        });
      },
      { threshold: 0.25 }
    );
    wraps.forEach(function (w) { observer.observe(w); });
  }

  // ----- Add to Cart handler -----
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-add-cart]');
    if (!btn) return;
    var slug = btn.dataset.addCart;
    if (!slug) return;

    // Find if item already exists in cart
    var found = false;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].slug === slug) {
        cart[i].qty++;
        found = true;
        break;
      }
    }

    if (!found) {
      var product = PRODUCTS[slug];
      if (!product) return;
      cart.push({
        slug: slug,
        name: product.name,
        price: product.price || 0,
        qty: 1
      });
    }

    saveCart();
    updateCartBadge();

    var product2 = PRODUCTS[slug];
    var name = product2 ? product2.name : 'المنتج';
    showToast(name + ' اتضاف للسلة ✦');

    btn.style.transform = 'scale(.95)';
    setTimeout(function () { btn.style.transform = ''; }, 200);
  });

  // ----- Preview → Checkout: ensure custom story is in cart -----
  // Only auto-add when coming from the preview page (wizard completion flow),
  // NOT from cart or other pages — prevents forcing custom story on users.
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href="#/checkout"]');
    if (!link) return;
    if (location.hash !== '#/preview') return;
    var wizardData = loadWizardData();
    if (wizardData && wizardData.heroName) {
      addCustomStoryToCart();
    }
  });

  // ----- Init -----
  window.addEventListener('DOMContentLoaded', function () {
    loadCart();
    updateCartBadge();
    fetchProducts();
    fetchConfig();
    if (!location.hash) location.hash = '#/home';
    handleRoute();
    initReveals();
    initCounter();
    initZigzagVideos();
  });

  if (document.readyState !== 'loading') {
    initHeroVideo();
  } else {
    document.addEventListener('DOMContentLoaded', initHeroVideo);
  }

})();
