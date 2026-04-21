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
  var SHIPPING_FEE = 35; // fallback — overridden by /api/config
  var FREE_SHIPPING_ABOVE = 0; // 0 = never free unless fee is 0

  // ----- Cloudinary Config -----
  var CLOUD_NAME = 'dkhndsrhr';
  var UPLOAD_PRESET = 'seraj-uploads';

  // ----- Wizard state (ephemeral) -----
  var state = {
    heroName: '',
    age: null,
    challenge: null,
    customChallenge: '',
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
      category: 'قصص جاهزة',
      section: 'tales',
      series: 'سباق الفتوحات',
      shortDesc: 'قصة بطولة وشجاعة بأسلوب تعليمي ممتع',
      longDesc: 'تابع بطلنا في مغامرة ملهمة مع القائد خالد بن الوليد — القائد اللي ما خسرش معركة في حياته. القصة بتعلّم إن الشجاعة الحقيقية مش في القوة بس، لكن في الثبات والمرونة والجرأة إنه يعمل الصح حتى لو كان صعب.',
      features: ['٢٤ صفحة ملوّنة بجودة عالية', 'غلاف مقوّى مقاوم', 'رسوم أصلية بإيد فنانين مصريين', 'بتعلّم قيمة الشجاعة والإقدام', 'مناسبة من ٤ لـ ٩ سنين'],
      media: { type: 'book3d', image: 'assets/khaled-v2.png', title: 'خالد بن<br/>الوليد', bg: 'emerald' },
      action: 'cart',
      ctaText: 'أضيفي للسلة',
      reviews: [
        { text: 'ابني قعد يقرأ القصة مرتين في نفس اليوم! بقى بيقول "أنا شجاع زي خالد".', name: 'منى — أم يوسف', place: 'القاهرة · ٦ سنين', color: '#6bbf3f', initial: 'م' },
        { text: 'الرسومات تحفة والقصة مكتوبة بلغة بسيطة مفهومة. بنقرأها مع بعض كل يوم.', name: 'سارة — أم عمر', place: 'المنصورة · ٥ سنين', color: '#c9974e', initial: 'س' }
      ],
      related: ['hero-conqueror', 'custom-story', 'bundle']
    },
    'hero-conqueror': {
      name: 'بطل قهر المستحيل',
      badge: 'جديد',
      price: 140,
      priceText: '١٤٠ ج.م',
      category: 'قصص جاهزة',
      section: 'tales',
      series: 'سباق الفتوحات',
      shortDesc: 'مغامرة ملحمية من سلسلة سباق الفتوحات',
      longDesc: 'مغامرة ملحمية من سلسلة سباق الفتوحات — قصة بطلنا اللي واجه المستحيل وقدره. رسوم أصلية بإيد فنانين مصريين بتعلّم الأطفال معاني الثبات والإرادة.',
      features: ['٢٤ صفحة ملوّنة بجودة عالية', 'غلاف مقوّى مقاوم', 'رسوم أصلية بإيد فنانين مصريين', 'بتعلّم قيمة الإرادة والثبات', 'مناسبة من ٤ لـ ٩ سنين'],
      media: { type: 'book3d', image: 'assets/seraj.png', title: 'بطل قهر<br/>المستحيل', bg: 'emerald' },
      action: 'cart',
      ctaText: 'أضيفي للسلة',
      reviews: [
        { text: 'القصة الجديدة من السلسلة تحفة! ابني مستني كل قصة جديدة.', name: 'هدى — أم ياسين', place: 'الإسكندرية · ٥ سنين', color: '#36a39a', initial: 'ه' }
      ],
      related: ['story-khaled', 'custom-story', 'bundle']
    },
    'custom-story': {
      name: 'القصة المخصصة',
      badge: 'مخصصة باسم بطلنا',
      price: 220,
      priceText: '٢٢٠ ج.م',
      category: 'قصص مخصصة',
      section: 'custom-stories',
      shortDesc: 'قصة كاملة باسم طفلك وصورته',
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
      category: 'فلاش كاردز',
      section: 'play-learn',
      shortDesc: '٣٠ كارت مصوّر بتساعد بطلنا ينظم يومه',
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
      category: 'مجموعات',
      section: null,
      shortDesc: 'قصة مخصصة + كروت + قصة من السلسلة',
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

  // ----- Dynamic Price & Image Update -----
  function updateDOMPrices() {
    var cards = document.querySelectorAll('.product-card');
    cards.forEach(function (card) {
      if (card.classList.contains('coming-soon')) return;
      var slug = null;
      var href = card.getAttribute('href');
      if (href) {
        if (href.indexOf('#/product/') === 0) slug = href.replace('#/product/', '');
        else if (href === '#/wizard') slug = 'custom-story';
      }
      if (slug && PRODUCTS[slug]) {
        var p = PRODUCTS[slug];
        var foot = card.querySelector('.product-foot');
        if (foot) {
          var cta = foot.querySelector('.cta-mini');
          var ctaHTML = cta ? cta.outerHTML : '';
          var priceText = p.priceText || (toArabicNum(p.price) + ' ج.م');
          var priceHTML = '';
          if (p.originalPriceText) {
            priceHTML = '<div class="price-group" style="display:flex;align-items:center;gap:6px"><span class="price old-price" style="text-decoration:line-through;color:var(--ink-mute);font-size:0.85em">' + p.originalPriceText + '</span><span class="price">' + priceText + '</span></div>';
          } else {
            priceHTML = '<span class="price">' + priceText + '</span>';
          }
          foot.innerHTML = priceHTML + ctaHTML;
        }
        // Replace CSS mockup with real product image when available
        var photoUrl = resolvePhotoUrl(p.imageUrl, p.media);
        if (photoUrl) {
          var mediaDiv = card.querySelector('.product-media');
          if (mediaDiv) {
            mediaDiv.style.background = 'var(--cream-2)';
            var mockup = mediaDiv.querySelector('.book3d, .cards-fan, .bundle-stack');
            if (mockup) {
              var existing = mediaDiv.querySelector('.product-photo');
              if (!existing) {
                mockup.outerHTML = renderMedia(p.media, false, p.imageUrl);
              }
            }
          }
        }
      } else if (slug && productsLoaded && !PRODUCTS[slug]) {
        card.style.display = 'none';
      }
    });
  }

  // ----- Fetch Products from API (graceful fallback) -----
  var productsLoaded = false;
  var productsReady = false; // true once fetch resolves (success or fail)
  function fetchProducts() {
    fetch('/api/products')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success && data.data && data.data.length > 0) {
          var apiProducts = {};
          data.data.forEach(function (p) {
            var fallback = PRODUCTS[p.slug] || {};
            p.media = p.media || fallback.media || { bg: 'emerald' };
            p.features = p.features && p.features.length > 0 ? p.features : fallback.features || [];
            p.reviews = p.reviews && p.reviews.length > 0 ? p.reviews : fallback.reviews || [];
            p.gallery = p.gallery && p.gallery.length > 0 ? p.gallery : fallback.gallery || [];
            p.action = p.action || fallback.action || 'cart';
            p.imageUrl = p.imageUrl || fallback.imageUrl;
            apiProducts[p.slug] = p;
          });
          PRODUCTS = apiProducts;
          productsLoaded = true;
          console.log('✅ Products loaded from API (' + data.data.length + ')');
        }
        updateDOMPrices();
      })
      .catch(function () {
        console.warn('⚠️ API fetch failed, using fallback products');
        updateDOMPrices();
      })
      .finally(function () {
        productsReady = true;
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
          if (typeof data.data.shippingFee === 'number') SHIPPING_FEE = data.data.shippingFee;
          if (typeof data.data.freeShippingAbove === 'number') FREE_SHIPPING_ABOVE = data.data.freeShippingAbove;
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
        customChallenge: state.customChallenge || '',
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

  function getShippingFee(subtotal) {
    if (SHIPPING_FEE === 0) return 0;
    if (FREE_SHIPPING_ABOVE > 0 && subtotal >= FREE_SHIPPING_ABOVE) return 0;
    return SHIPPING_FEE;
  }

  function cartItemCount() {
    var count = 0;
    cart.forEach(function (item) { count += item.qty; });
    return count;
  }

  function isCustomStory(slug) {
    return slug === 'custom-story';
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

    // Dynamic SEO
    document.title = product.name + ' | سراج';
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', product.longDesc || '');

    var isSoon = product.comingSoon;
    var h = '';
    // Back nav
    h += '<div class="pd-topnav">';
    h += '<a href="#/products" data-link class="icon-btn"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M10 6l-6 6 6 6M4 12h16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></a>';
    h += '<span class="pd-nav-label">منتجات سِراج</span>';
    h += '<span></span></div>';
    // Hero
    h += '<div class="pd-wrap">';
    var heroPhoto = resolvePhotoUrl(product.imageUrl, product.media);
    var heroBg = heroPhoto ? ' style="background:var(--cream-2)"' : ' ' + product.media.bg;
    h += '<div class="pd-media reveal' + heroBg + '">' + renderMedia(product.media, true, product.imageUrl) + '</div>';
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
    // Gallery — build gallery from product photo + gallery[] images, then video section
    var galleryImages = [];
    var mainPhoto = resolvePhotoUrl(product.imageUrl, product.media);
    if (mainPhoto) {
      galleryImages.push({ url: mainPhoto, alt: product.name });
    }
    if (product.gallery && product.gallery.length > 0) {
      var sorted = product.gallery.slice().sort(function(a, b) { return (a.sortOrder || 0) - (b.sortOrder || 0); });
      var images = sorted.filter(function(gi) { return gi.resourceType !== 'video'; });
      for (var gi = 0; gi < images.length; gi++) {
        galleryImages.push({ url: images[gi].url, alt: images[gi].alt || product.name });
      }
    }

    var videos = [];
    if (product.gallery && product.gallery.length > 0) {
      var sortedAll = product.gallery.slice().sort(function(a, b) { return (a.sortOrder || 0) - (b.sortOrder || 0); });
      videos = sortedAll.filter(function(gi) { return gi.resourceType === 'video'; });
    }

    // Gallery section — images + videos together
    // Merge videos into gallery items for unified display
    var allGalleryItems = galleryImages.slice();
    for (var vi = 0; vi < videos.length; vi++) {
      allGalleryItems.push({ url: videos[vi].url, alt: videos[vi].alt || product.name, isVideo: true });
    }

    if (allGalleryItems.length > 0) {
      h += '<section class="section pd-gallery-section"><div class="section-head"><span class="kicker">معرض المنتج</span><h2>شوفي المنتج بالتفصيل</h2></div>';
      h += '<div class="pd-gallery-wrap">';
      // Main display — show first item
      h += '<div class="pd-gallery-main" data-gallery-main>';
      if (allGalleryItems[0].isVideo) {
        var firstPoster = getVideoPoster(allGalleryItems[0].url);
        h += '<video src="' + allGalleryItems[0].url + '" controls playsinline preload="none" poster="' + firstPoster + '" data-gallery-idx="0" style="width:100%;height:auto;display:block;border-radius:20px"></video>';
      } else {
        h += '<img src="' + cloudinaryUrl(allGalleryItems[0].url, 800) + '" alt="' + escHtml(allGalleryItems[0].alt) + '" data-gallery-idx="0"/>';
      }
      if (allGalleryItems.length > 1) {
        h += '<button class="gallery-arrow prev" data-gallery-prev><svg viewBox="0 0 24 24"><path d="M14 6l-6 6 6 6" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
        h += '<button class="gallery-arrow next" data-gallery-next><svg viewBox="0 0 24 24"><path d="M10 6l6 6-6 6" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
      }
      h += '<span class="pd-gallery-counter" data-gallery-counter>١ / ' + toArabicNum(allGalleryItems.length) + '</span>';
      h += '</div>';
      // Thumbnails
      if (allGalleryItems.length > 1) {
        h += '<div class="pd-gallery-thumbs" data-gallery-thumbs>';
        for (var t = 0; t < allGalleryItems.length; t++) {
          var thumbClass = t === 0 ? ' is-active' : '';
          var thumbSrc = allGalleryItems[t].isVideo
            ? getVideoPoster(allGalleryItems[t].url)
            : cloudinaryUrl(allGalleryItems[t].url, 120);
          h += '<div class="pd-gallery-thumb' + thumbClass + '" data-gallery-thumb="' + t + '" data-is-video="' + (allGalleryItems[t].isVideo ? '1' : '0') + '" data-src="' + allGalleryItems[t].url + '"><img src="' + thumbSrc + '" alt="' + escHtml(allGalleryItems[t].alt) + '" loading="lazy"/>';
          if (allGalleryItems[t].isVideo) h += '<span class="thumb-play-icon">▶</span>';
          h += '</div>';
        }
        h += '</div>';
      }
      h += '</div>';
      // Hidden data store for gallery URLs (images only for lightbox)
      h += '<script type="application/json" data-gallery-json>' + JSON.stringify(allGalleryItems.map(function(item) { return item.isVideo ? item.url : cloudinaryUrl(item.url, 1200); })) + '</script>';
      h += '<script type="application/json" data-gallery-types>' + JSON.stringify(allGalleryItems.map(function(item) { return item.isVideo ? 'video' : 'image'; })) + '</script>';
      h += '</section>';
    }
    // Reviews
    h += '<section class="section pd-reviews-section"><div class="section-head"><span class="kicker">آراء الأمهات</span><h2>اللي جربوا المنتج ده</h2></div><div class="testimonials-grid">';
    for (var r = 0; r < product.reviews.length; r++) {
      var rev = product.reviews[r];
      h += '<figure class="t-card"><blockquote>"' + rev.text + '"</blockquote><figcaption><span class="avatar" style="--c:' + rev.color + '">' + rev.initial + '</span><div><strong>' + rev.name + '</strong><small>' + rev.place + '</small></div></figcaption></figure>';
    }
    h += '</div></section>';
    // ===== Custom Story: Relocated sections from homepage =====
    if (slug === 'custom-story') {
      // Social proof
      h += '<section class="section counter-section">';
      h += '<div class="counter-card reveal">';
      h += '<div class="counter-left">';
      h += '<span class="kicker">من قلب البيوت المصرية</span>';
      h += '<h2><span>أكتر من</span> <span class="counter" data-to="842">٠</span> <span>قصة اتألفت لأبطالنا الصغار</span></h2>';
      h += '<p>صور حقيقية من أمهات جربوا سِراج وبعتوا لنا كتب بطلهم في إيديه</p>';
      h += '</div>';
      h += '<div class="counter-gallery">';
      h += '<div class="mini-card" style="--r:-6deg"><div class="mini-cover"><span>بطلنا يوسف</span></div></div>';
      h += '<div class="mini-card" style="--r:3deg"><div class="mini-cover alt"><span>بطلتنا ليلى</span></div></div>';
      h += '<div class="mini-card" style="--r:-2deg"><div class="mini-cover alt2"><span>بطلنا زين</span></div></div>';
      h += '</div></div></section>';

      // How it works — zig-zag
      h += '<section class="section zigzag-section" id="how-it-works">';
      h += '<header class="section-head reveal">';
      h += '<span class="kicker">٣ خطوات بس</span>';
      h += '<h2>إزاي سراج بيعمل قصة بصورة ابنك؟</h2>';
      h += '</header>';
      // Step 1
      h += '<article class="zz-row reveal" style="--d:.05s">';
      h += '<div class="zz-media"><div class="zz-video-wrap">';
      h += '<video class="zz-video" src="assets/1-.mp4" autoplay muted loop playsinline preload="auto" poster="assets/seraj.png" aria-label="الخطوة ١"></video>';
      h += '</div></div>';
      h += '<div class="zz-text"><span class="zz-num">١</span>';
      h += '<h3>قولي لسراج اسم بطلنا وسنه</h3>';
      h += '<p>ادخلي اسم طفلك وسنّه، واختاري القيمة اللي عايزاه يتعلمها.. وسراج هيبدأ الشغل.</p>';
      h += '</div></article>';
      // Step 2
      h += '<article class="zz-row zz-reversed reveal" style="--d:.1s">';
      h += '<div class="zz-media"><div class="zz-video-wrap">';
      h += '<video class="zz-video" src="assets/2.mp4" autoplay muted loop playsinline preload="auto" poster="assets/seraj.png" aria-label="الخطوة ٢"></video>';
      h += '</div></div>';
      h += '<div class="zz-text"><span class="zz-num">٢</span>';
      h += '<h3>سراج هيدخل ورشه السحرية يكتب ويرسم القصة مخصوص ليه</h3>';
      h += '<p>في الورشة، سراج بيكتب القصة باسم بطلك وبيرسمها بإيد فنانين مصريين.. كل حاجة مخصوصة.</p>';
      h += '</div></article>';
      // Step 3
      h += '<article class="zz-row reveal" style="--d:.15s">';
      h += '<div class="zz-media"><div class="zz-video-wrap">';
      h += '<video class="zz-video" src="assets/3.mp4" autoplay muted loop playsinline preload="auto" poster="assets/seraj.png" aria-label="الخطوة ٣"></video>';
      h += '</div></div>';
      h += '<div class="zz-text"><span class="zz-num">٣</span>';
      h += '<h3>القصة هتجيلك مطبوعة بجودة عالية لحد باب البيت</h3>';
      h += '<p>غلاف مقوّى، ورق سميك، ورسوم أصلية.. قصة حقيقية يستاهلها بطلنا.</p>';
      h += '</div></article>';
      h += '<div class="zz-cta reveal" style="--d:.2s">';
      h += '<a href="#/wizard" data-link class="btn btn-primary"><span>يلا نبدأ الحكاية</span>';
      h += '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M14 6l-6 6 6 6" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></a></div>';
      h += '</section>';

      // Values
      h += '<section class="section values-section">';
      h += '<header class="section-head reveal">';
      h += '<span class="kicker">القيم اللي هيتعلمها</span>';
      h += '<h2>اختاري القيمة اللي بطلنا محتاجها النهاردة</h2>';
      h += '<p>كل قيمة ليها قصة ومغامرة مختلفة</p>';
      h += '</header>';
      h += '<div class="values-grid">';
      h += '<button class="value-card" style="--c:#6bbf3f"><svg viewBox="0 0 48 48"><path d="M24 8l4 10 11 1-8 8 2 11-9-6-9 6 2-11-8-8 11-1z" fill="#6bbf3f" stroke="#231a14" stroke-width="2.5" stroke-linejoin="round"/></svg><h4>شجاعة</h4><span>زي القائد خالد</span></button>';
      h += '<button class="value-card" style="--c:#36a39a"><svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="14" fill="#36a39a" stroke="#231a14" stroke-width="2.5"/><path d="M16 24 l5 5 11-11" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg><h4>نظافة</h4><span>كل يوم أجمل</span></button>';
      h += '<button class="value-card" style="--c:#c9974e"><svg viewBox="0 0 48 48"><path d="M8 14h32v22a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" fill="#c9974e" stroke="#231a14" stroke-width="2.5"/><path d="M8 14l8-6h16l8 6" fill="#e9b86a" stroke="#231a14" stroke-width="2.5"/></svg><h4>علم ومذاكرة</h4><span>فضول مش حدود</span></button>';
      h += '<button class="value-card" style="--c:#e85d4c"><svg viewBox="0 0 48 48"><path d="M24 40s-14-8-14-20a8 8 0 0 1 14-5 8 8 0 0 1 14 5c0 12-14 20-14 20z" fill="#e85d4c" stroke="#231a14" stroke-width="2.5" stroke-linejoin="round"/></svg><h4>احترام</h4><span>بنكبر بالأدب</span></button>';
      h += '<button class="value-card" style="--c:#8b5e2a"><svg viewBox="0 0 48 48"><rect x="14" y="6" width="20" height="36" rx="4" fill="#e9b86a" stroke="#231a14" stroke-width="2.5"/><path d="M18 14h12M18 22h12M18 30h8" stroke="#231a14" stroke-width="2.5" stroke-linecap="round"/></svg><h4>صبر</h4><span>الحلم محتاج وقت</span></button>';
      h += '</div></section>';

      // CTA Banner
      h += '<section class="cta-ribbon reveal">';
      h += '<div class="ribbon-inner">';
      h += '<img src="assets/seraj.png" class="ribbon-mascot" alt="سِراج" loading="lazy"/>';
      h += '<div class="ribbon-copy">';
      h += '<h2>مستنية إيه؟ خلّي بطلنا يبدأ حكايته النهاردة!</h2>';
      h += '<p>بس ٣ خطوات صغيرة، وسِراج هيقعد يشتغل في الورشة</p>';
      h += '</div>';
      h += '<a href="#/wizard" data-link class="btn btn-primary btn-xl">اصنع قصة لابنك';
      h += '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M14 6l-6 6 6 6" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></a>';
      h += '</div></section>';
    }

    // Related
    if (product.related && product.related.length) {
      h += '<section class="section pd-related-section"><div class="section-head"><span class="kicker">هيعجب بطلنا كمان</span><h2>منتجات مقترحة</h2></div><div class="products-grid">';
      for (var p = 0; p < product.related.length; p++) {
        var rs = product.related[p], rp = PRODUCTS[rs];
        if (!rp) continue;
        var href = rp.action === 'wizard' ? '#/wizard' : '#/product/' + rs;
        var rpPrice = rp.priceText || (toArabicNum(rp.price) + ' ج.م');
        h += '<a href="' + href + '" data-link class="product-card"><div class="product-media ' + rp.media.bg + '">' + renderMedia(rp.media, false, rp.imageUrl) + '</div><div class="product-body"><h3>' + rp.name + '</h3><div class="product-foot"><span class="price">' + rpPrice + '</span><span class="cta-mini">شوفيها →</span></div></div></a>';
      }
      h += '</div></section>';
    }
    container.innerHTML = h;
    setTimeout(initReveals, 100);
    initProductGallery(container);
    // Re-init zigzag videos and counter for custom-story page
    if (slug === 'custom-story') {
      initZigzagVideos();
      initCounter();
    }
  }

  // ----- Product Gallery Interaction -----
  var galleryState = { current: 0, total: 0, urls: [], lightboxOpen: false };

  function initProductGallery(container) {
    var mainEl = container.querySelector('[data-gallery-main]');
    if (!mainEl) return;

    var jsonEl = container.querySelector('[data-gallery-json]');
    var typesEl = container.querySelector('[data-gallery-types]');
    if (!jsonEl) return;

    try {
      galleryState.urls = JSON.parse(jsonEl.textContent);
      galleryState.types = typesEl ? JSON.parse(typesEl.textContent) : galleryState.urls.map(function() { return 'image'; });
    } catch (e) { return; }
    galleryState.total = galleryState.urls.length;
    galleryState.current = 0;

    var counterEl = mainEl.querySelector('[data-gallery-counter]');
    var thumbsWrap = container.querySelector('[data-gallery-thumbs]');

    function goTo(idx) {
      if (idx < 0) idx = galleryState.total - 1;
      if (idx >= galleryState.total) idx = 0;
      galleryState.current = idx;

      var isVideo = galleryState.types[idx] === 'video';
      var url = galleryState.urls[idx];

      // Replace main content (image or video)
      var currentMain = mainEl.querySelector('img, video');
      if (currentMain) {
        if (currentMain.tagName === 'VIDEO') currentMain.pause();
        if (isVideo) {
          var vid = document.createElement('video');
          vid.src = url;
          vid.controls = true;
          vid.playsInline = true;
          vid.preload = 'none';
          vid.poster = getVideoPoster(url);
          vid.setAttribute('data-gallery-idx', idx);
          vid.style.cssText = 'width:100%;height:auto;display:block;border-radius:20px';
          currentMain.replaceWith(vid);
        } else {
          var img = document.createElement('img');
          img.src = url.replace('/w_1200,', '/w_800,');
          img.setAttribute('data-gallery-idx', idx);
          img.alt = '';
          currentMain.replaceWith(img);
        }
      }

      if (counterEl) {
        counterEl.textContent = toArabicNum(idx + 1) + ' / ' + toArabicNum(galleryState.total);
      }
      if (thumbsWrap) {
        thumbsWrap.querySelectorAll('.pd-gallery-thumb').forEach(function(thumb, i) {
          thumb.classList.toggle('is-active', i === idx);
        });
      }
      if (galleryState.lightboxOpen && !isVideo) updateLightboxImage(idx);
    }

    // Arrow buttons
    var prevBtn = mainEl.querySelector('[data-gallery-prev]');
    var nextBtn = mainEl.querySelector('[data-gallery-next]');
    if (prevBtn) prevBtn.addEventListener('click', function(e) { e.stopPropagation(); goTo(galleryState.current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function(e) { e.stopPropagation(); goTo(galleryState.current + 1); });

    // Thumbnail clicks
    if (thumbsWrap) {
      thumbsWrap.querySelectorAll('.pd-gallery-thumb').forEach(function(thumb) {
        thumb.addEventListener('click', function() {
          var idx = parseInt(thumb.getAttribute('data-gallery-thumb'), 10);
          goTo(idx);
        });
      });
    }

    // Main image click → open lightbox
    mainEl.addEventListener('click', function(e) {
      if (e.target.closest('.gallery-arrow')) return;
      openLightbox(galleryState.current);
    });

    // Swipe support on main image
    var swipeStartX = 0;
    var swipeStartY = 0;
    var swipeThreshold = 50;

    mainEl.addEventListener('touchstart', function(e) {
      swipeStartX = e.changedTouches[0].clientX;
      swipeStartY = e.changedTouches[0].clientY;
    }, { passive: true });

    mainEl.addEventListener('touchend', function(e) {
      var dx = e.changedTouches[0].clientX - swipeStartX;
      var dy = e.changedTouches[0].clientY - swipeStartY;
      if (Math.abs(dx) > swipeThreshold && Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) goTo(galleryState.current - 1);
        else goTo(galleryState.current + 1);
      }
    }, { passive: true });

    // Keyboard navigation
    function onKey(e) {
      if (!galleryState.lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goTo(galleryState.current + 1);
      if (e.key === 'ArrowRight') goTo(galleryState.current - 1);
    }
    document.addEventListener('keydown', onKey);

    // Clean up on page change
    var observer = new MutationObserver(function() {
      if (!container.closest('.is-active')) {
        closeLightbox();
        document.removeEventListener('keydown', onKey);
        observer.disconnect();
      }
    });
    observer.observe(container, { attributes: false, childList: true, subtree: false });
    var page = container.closest('.page');
    if (page) {
      var pageObs = new MutationObserver(function() {
        if (!page.classList.contains('is-active')) {
          closeLightbox();
          document.removeEventListener('keydown', onKey);
          pageObs.disconnect();
        }
      });
      pageObs.observe(page, { attributes: true, attributeFilter: ['class'] });
    }
  }

  function openLightbox(idx) {
    var existing = document.getElementById('pdLightbox');
    if (existing) existing.remove();

    galleryState.lightboxOpen = true;

    var lb = document.createElement('div');
    lb.id = 'pdLightbox';
    lb.className = 'pd-lightbox is-open';
    lb.innerHTML =
      '<button class="pd-lightbox-close" data-lightbox-close>&times;</button>' +
      '<button class="pd-lightbox-arrow prev" data-lightbox-prev><svg viewBox="0 0 24 24"><path d="M14 6l-6 6 6 6" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<div class="pd-lightbox-img-wrap"><img src="" alt="" data-lightbox-img/></div>' +
      '<button class="pd-lightbox-arrow next" data-lightbox-next><svg viewBox="0 0 24 24"><path d="M10 6l6 6-6 6" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<span class="pd-lightbox-counter" data-lightbox-counter></span>';

    document.body.appendChild(lb);
    document.body.style.overflow = 'hidden';

    updateLightboxImage(idx);

    lb.querySelector('[data-lightbox-close]').addEventListener('click', closeLightbox);
    lb.querySelector('[data-lightbox-prev]').addEventListener('click', function() {
      goTo(galleryState.current - 1);
    });
    lb.querySelector('[data-lightbox-next]').addEventListener('click', function() {
      goTo(galleryState.current + 1);
    });

    lb.addEventListener('click', function(e) {
      if (e.target === lb) closeLightbox();
    });

    // Swipe in lightbox
    var lbSwipeX = 0;
    var lbSwipeY = 0;
    lb.addEventListener('touchstart', function(e) {
      lbSwipeX = e.changedTouches[0].clientX;
      lbSwipeY = e.changedTouches[0].clientY;
    }, { passive: true });
    lb.addEventListener('touchend', function(e) {
      var dx = e.changedTouches[0].clientX - lbSwipeX;
      var dy = e.changedTouches[0].clientY - lbSwipeY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) goTo(galleryState.current - 1);
        else goTo(galleryState.current + 1);
      }
    }, { passive: true });
  }

  function updateLightboxImage(idx) {
    var lb = document.getElementById('pdLightbox');
    if (!lb) return;
    var img = lb.querySelector('[data-lightbox-img]');
    var counter = lb.querySelector('[data-lightbox-counter]');
    if (img) img.src = galleryState.urls[idx];
    if (counter) counter.textContent = toArabicNum(idx + 1) + ' / ' + toArabicNum(galleryState.total);
  }

  function closeLightbox() {
    var lb = document.getElementById('pdLightbox');
    if (lb) lb.remove();
    galleryState.lightboxOpen = false;
    document.body.style.overflow = '';
  }

  // Cloudinary URL transform: serve optimally sized images per context
  function cloudinaryUrl(url, width) {
    if (!url || url.indexOf('res.cloudinary.com') === -1) return url;
    return url.replace(/\/upload\//, '/upload/w_' + width + ',c_limit,f_auto,q_auto/');
  }

  // ----- Catalog Page — metadata per section (tab label + hero copy + mascot image) -----
  // To use your own section images, add files at: assets/catalog-tales.png, etc.
  var CATALOG_META = {
    'all':            { title: 'كل العوالم',           kicker: 'اكتشفي عالم سراج المتنوع',     desc: 'أكتر من قصص.. تجربة تعليمية متكاملة لبطلنا الصغير',    color: '#6bbf3f', img: 'assets/catagory/catalog-all.png' },
    'tales':          { title: 'سباق الفتوحات',         kicker: 'أبطالنا الحقيقيين!',            desc: 'أبطالنا بجد! مستويات تناسب كل الأعمار مع جزء خاص لتجهيز الأب والأم لأسئلة طفلك.',   color: '#6bbf3f', img: 'assets/catagory/catalog-tales.png' },
    'custom-stories': { title: 'قصة مخصوصة',  kicker: 'باسم وصورة طفلك!',          desc: 'هدية عمره ما هينساها.. قصة تفاعلية ممتعة ومطبوعة بجودة عالية بطلها طفلك!',           color: '#c9974e', img: 'assets/catagory/catalog-custom-stories.png' },
    'play-learn':     { title: 'ألعاب سراج',      kicker: 'العب واتعلم!',         desc: 'فلاش كاردز وألعاب ترفيهية بتنمي مهارات طفلك وتخليه يكتشف العالم وهو بيضحك ومبسوط.',           color: '#e85d4c', img: 'assets/catagory/catalog-play-learn.png' },
    'seraj-stories':  { title: 'حكايات سراج',    kicker: 'الأرنب المسافر عبر الزمن!', desc: 'رحلات مثيرة مع آلة الزمن لاكتشاف أسرار الماضي مع الأرنب سِراج وأصحابه.',        color: '#36a39a', img: 'assets/catagory/catalog-seraj-stories.png' }
  };

  // ----- Catalog Page — grid + filter tabs -----
  var activeCatalogTab = 'all';

  function buildCatalogCard(slug, p) {
    var isSoon = p.comingSoon;
    var photoUrl = resolvePhotoUrl(p.imageUrl, p.media);
    var coverContent;
    if (photoUrl) {
      coverContent = '<img src="' + cloudinaryUrl(photoUrl, 400) + '" alt="' + escHtml(p.name) + '" loading="lazy"/>';
    } else {
      coverContent = renderMedia(p.media, false, null);
    }
    var badgeHtml = p.badge
      ? '<span class="cat-badge' + (p.badgeSoon ? ' soon' : '') + '">' + escHtml(p.badge) + '</span>'
      : '';
    var soonOverlay = isSoon ? '<div class="cat-soon-overlay">قريباً</div>' : '';
    var priceHtml = p.originalPriceText
      ? '<span class="cat-old-price">' + p.originalPriceText + '</span><span class="cat-price">' + p.priceText + '</span>'
      : '<span class="cat-price">' + p.priceText + '</span>';

    var inner =
      '<div class="cat-cover">' + coverContent + badgeHtml + soonOverlay + '</div>' +
      '<div class="cat-info"><h3>' + escHtml(p.name) + '</h3>' +
      '<div class="cat-foot">' + priceHtml + '</div></div>';

    if (isSoon) {
      return '<div class="catalog-card-inner coming-soon">' + inner + '</div>';
    }
    return '<a href="#/product/' + slug + '" data-link class="catalog-card-inner">' + inner + '</a>';
  }

  function populateCatalog() {
    var nav = document.getElementById('catalogNav');
    var grid = document.getElementById('catalogGrid');
    if (!nav || !grid) return;

    // Build category tabs
    nav.innerHTML = '';
    Object.keys(CATALOG_META).forEach(function(tabId) {
      var meta = CATALOG_META[tabId];
      var btn = document.createElement('button');
      btn.className = 'cat-tab' + (tabId === activeCatalogTab ? ' is-active' : '');
      btn.dataset.catTab = tabId;
      btn.style.setProperty('--tab-color', meta.color);
      btn.textContent = meta.title;
      nav.appendChild(btn);
    });

    // Render all product cards
    grid.innerHTML = '';
    var sortedSlugs = Object.keys(PRODUCTS).sort(function(a, b) {
      return (PRODUCTS[a].order || 0) - (PRODUCTS[b].order || 0);
    });
    sortedSlugs.forEach(function(slug) {
      var p = PRODUCTS[slug];
      if (p.active === false) return;
      p._slug = slug;
      var sectionId = p.section || 'bundle';
      var visible = activeCatalogTab === 'all' || sectionId === activeCatalogTab;
      var card = document.createElement('div');
      card.className = 'catalog-card reveal';
      card.dataset.section = sectionId;
      if (!visible) card.style.display = 'none';
      card.innerHTML = buildCatalogCard(slug, p);
      grid.appendChild(card);
    });
  }

  function filterCatalog(tabId) {
    if (!CATALOG_META[tabId]) tabId = 'all';
    activeCatalogTab = tabId;

    // Update active tab button
    document.querySelectorAll('.cat-tab').forEach(function(btn) {
      btn.classList.toggle('is-active', btn.dataset.catTab === tabId);
    });
    
    // Sync dropdown
    var sel = document.getElementById('contentSelect');
    if (sel && sel.value !== tabId) sel.value = tabId;

    // Show/hide product cards
    var visible = 0;
    document.querySelectorAll('#catalogGrid .catalog-card').forEach(function(card) {
      var show = tabId === 'all' || card.dataset.section === tabId;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    // Update hero area
    var meta = CATALOG_META[tabId];
    var heroEl = document.getElementById('catalogHero');
    var mascot = document.getElementById('catalogMascotImg');
    var titleEl = document.getElementById('catalogTitle');
    var kickerEl = document.getElementById('catalogKicker');
    var descEl = document.getElementById('catalogDesc');
    if (heroEl) heroEl.style.setProperty('--hero-color', meta.color);
    if (titleEl) titleEl.textContent = meta.title;
    if (kickerEl) kickerEl.textContent = meta.kicker;
    if (descEl) descEl.textContent = meta.desc;
    if (mascot) {
      mascot.classList.add('is-transitioning');
      var newSrc = meta.img;
      setTimeout(function() { mascot.src = newSrc; mascot.classList.remove('is-transitioning'); }, 180);
    }

    // Empty state
    var grid = document.getElementById('catalogGrid');
    var emptyEl = document.getElementById('catalogEmpty');
    if (grid && visible === 0) {
      if (!emptyEl) {
        var em = document.createElement('div');
        em.id = 'catalogEmpty'; em.className = 'catalog-empty-state';
        em.innerHTML = '<p>مفيش منتجات في هذا القسم دلوقتي — تابعينا!</p>';
        grid.appendChild(em);
      } else { emptyEl.style.display = ''; }
    } else if (emptyEl) { emptyEl.style.display = 'none'; }
  }

  function getVideoPoster(videoUrl) {
    if (!videoUrl || videoUrl.indexOf('res.cloudinary.com') === -1) return '';
    if (videoUrl.indexOf('/video/upload/') !== -1) {
      return videoUrl.replace(/\/video\/upload\//, '/video/upload/so_0,w_720,c_limit,f_auto,q_auto/');
    }
    return videoUrl.replace(/\/upload\//, '/upload/so_0,w_720,c_limit,f_auto,q_auto/');
  }

  // Resolve the actual product photo URL: imageUrl takes priority,
  // then media.image if it's a Cloudinary upload (not a local asset)
  function resolvePhotoUrl(imageUrl, media) {
    if (imageUrl) return imageUrl;
    if (media && media.image && media.image.indexOf('res.cloudinary.com') !== -1) return media.image;
    return null;
  }

  function renderMedia(media, big, imageUrl) {
    var size = big ? ' big' : '';
    var photoUrl = resolvePhotoUrl(imageUrl, media);
    if (photoUrl) {
      var w = big ? 800 : 500;
      var optimized = cloudinaryUrl(photoUrl, w);
      return '<div class="product-photo' + size + '"><img src="' + optimized + '" alt="" loading="lazy"/></div>';
    }
    if (media.type === 'book3d') return '<div class="book3d' + size + '"><div class="book3d-cover"><span class="book3d-title">' + media.title + '</span><img src="' + media.image + '" class="book3d-mascot" alt="" loading="lazy"/></div></div>';
    if (media.type === 'cards-fan') { var c = ['#e85d4c', '#c9974e', '#36a39a', '#6bbf3f', '#8b5e2a'], f = '<div class="cards-fan">'; for (var i = 0; i < c.length; i++) f += '<i style="--i:' + i + ';--c:' + c[i] + '"></i>'; return f + '</div>'; }
    if (media.type === 'bundle-stack') return '<div class="bundle-stack"><div class="bundle-i"></div><div class="bundle-i"></div><div class="bundle-i"></div></div>';
    return '';
  }

  function renderCartMedia(media, imageUrl) {
    var photoUrl = resolvePhotoUrl(imageUrl, media);
    if (photoUrl) {
      var optimized = cloudinaryUrl(photoUrl, 100);
      return '<div class="product-photo" style="width:60px;height:76px"><img src="' + optimized + '" alt="" loading="lazy"/></div>';
    }
    return renderMedia(media, false, null);
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
      if (!product && item.slug !== 'coloring-workbook') return;
      var lineTotal = item.price * item.qty;
      total += lineTotal;

      // Coloring workbook — show special card
      if (item.slug === 'coloring-workbook' && item.coloringDetails) {
        var cd = item.coloringDetails;
        h += '<div class="cart-item cart-item-workbook">';
        h += '<div class="cart-item-media emerald-bg"><svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg></div>';
        h += '<div class="cart-item-info">';
        h += '<h3>' + item.name + '</h3>';
        h += '<div class="cart-workbook-details">';
        h += '<span class="cwd-tag">' + (cd.format === 'book' ? '📚 كشكول بغلاف' : '📄 ورق مطبوع') + '</span>';
        h += '<span class="cwd-tag">' + toArabicNum(cd.itemCount) + ' رسمة</span>';
        if (cd.coverTitle) h += '<span class="cwd-tag">✏️ ' + cd.coverTitle + '</span>';
        h += '</div>';
        h += '<span class="price">' + toArabicNum(item.price) + ' ج.م</span>';
        h += '</div>';
        h += '<button class="cart-remove" data-remove-cart="' + item.slug + '" title="شيلي">✕</button>';
        h += '</div>';
        return;
      }

      var bgClass = product.media.bg === 'emerald' ? 'emerald-bg' : product.media.bg === 'sand' ? 'sand-bg' : 'teal-bg';
      h += '<div class="cart-item">';
      h += '<div class="cart-item-media ' + bgClass + '">' + renderCartMedia(product.media, product.imageUrl) + '</div>';
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
    var shipping = getShippingFee(total);
    var grandTotal = total + shipping;
    h += '<div class="cart-summary">';
    h += '<div class="cart-summary-row"><span>المجموع الفرعي</span><span>' + toArabicNum(total) + ' ج.م</span></div>';
    if (shipping === 0) {
      h += '<div class="cart-summary-row"><span>الشحن</span><span style="color:var(--seraj-dark);font-weight:700">مجاناً ✦</span></div>';
    } else {
      h += '<div class="cart-summary-row"><span>الشحن</span><span>' + toArabicNum(shipping) + ' ج.م</span></div>';
    }
    h += '<div class="cart-summary-row total"><span>الإجمالي</span><span>' + toArabicNum(grandTotal) + ' ج.م</span></div>';
    h += '</div>';

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
    var shipping = getShippingFee(total);
    var grandTotal = total + shipping;

    var h = '';

    // Order summary
    h += '<div class="checkout-summary">';
    h += '<h3 style="font-size:18px;margin-bottom:16px;">ملخص الطلب</h3>';
    cart.forEach(function (item) {
      var product = PRODUCTS[item.slug];
      var bgClass = product && product.media ? (product.media.bg === 'emerald' ? 'emerald-bg' : product.media.bg === 'sand' ? 'sand-bg' : 'teal-bg') : '';
      h += '<div class="cart-item" style="margin-bottom:8px">';
      if (product && product.media) {
        h += '<div class="cart-item-media ' + bgClass + '" style="width:48px;height:48px;min-width:48px">' + renderCartMedia(product.media, product.imageUrl) + '</div>';
      }
      h += '<div class="cart-item-info"><h3 style="font-size:14px">' + item.name;
      if (item.qty > 1) h += ' × ' + toArabicNum(item.qty);
      h += '</h3>';
      h += '<span class="price" style="font-size:16px">' + toArabicNum(item.price * item.qty) + ' ج.م</span>';
      h += '</div></div>';
    });
    h += '<div class="cart-summary" style="margin-top:12px">';
    h += '<div class="cart-summary-row"><span>المجموع الفرعي</span><span>' + toArabicNum(total) + ' ج.م</span></div>';
    if (shipping === 0) {
      h += '<div class="cart-summary-row"><span>الشحن</span><span style="color:var(--seraj-dark);font-weight:700">مجاناً ✦</span></div>';
    } else {
      h += '<div class="cart-summary-row"><span>الشحن</span><span>' + toArabicNum(shipping) + ' ج.م</span></div>';
    }
    h += '<div class="cart-summary-row total"><span>الإجمالي</span><span>' + toArabicNum(grandTotal) + ' ج.م</span></div>';
    h += '</div></div>';

    // InstaPay card
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
      showToast('لو سمحتي كمّلي البيانات المطلوبة ✦');
      setTimeout(function () {
        [nameEl, phoneEl, addressEl].forEach(function (el) { el.classList.remove('shake'); });
      }, 600);
      return;
    }

    var total = calculateTotal();
    var shipping = getShippingFee(total);
    var grandTotal = total + shipping;

    var orderData = {
      customerName: nameEl.value.trim(),
      customerPhone: phoneEl.value.trim(),
      address: addressEl.value.trim(),
      notes: notesEl.value.trim() || '',
      items: cart.map(function (item) {
        var orderItem = {
          productSlug: item.slug,
          name: item.name,
          price: item.price,
          qty: item.qty
        };
        // Include coloring details for workbook items
        if (item.slug === 'coloring-workbook' && item.coloringDetails) {
          orderItem.coloringDetails = item.coloringDetails;
        }
        return orderItem;
      }),
      total: grandTotal,
      shippingFee: shipping,
      deposit: 0,
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
        customChallenge: wizardData.customChallenge || undefined,
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
    var full = location.hash.replace(/^#\//, '') || 'home';
    // Split on '#' to extract anchor (e.g., "products#tales" → route="products", anchor="tales")
    var hashParts = full.split('#');
    var route = hashParts[0];
    var anchor = hashParts[1] || null;
    var segments = route.split('/');
    var page = segments[0];
    var sub = segments[1];
    if (!page || page === '#') return { page: 'home', sub: undefined, anchor: null };
    return { page: page, sub: sub, anchor: anchor };
  }

  // Valid page names for the SPA router
  var validPages = ['home', 'products', 'about', 'wizard', 'preview', 'checkout', 'success', 'cart', 'product', 'mama-world', 'article', 'faq', 'shipping', 'returns', 'mama-coloring', 'coloring-book'];

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
      // mama-coloring shouldn't necessarily highlight mama-world but maybe we want it to?
      if (a.dataset.tab === 'mama-world' && (name === 'mama-coloring' || name === 'coloring-book')) {
         a.classList.add('is-active');
      } else {
         a.classList.toggle('is-active', a.dataset.tab === name);
      }
    });

    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(initReveals, 80);

    var pageTitles = {
      'home': 'سراج | حكايات بتكبر مع طفلك',
      'products': 'سراج | المنتجات',
      'about': 'سراج | حكايتنا',
      'wizard': 'سراج | اصنع قصتك',
      'cart': 'سراج | سلة المشتريات',
      'checkout': 'سراج | إتمام الطلب',
      'mama-world': 'سراج | عالم ماما',
      'article': 'سراج | عالم ماما', // could be dynamic
      'mama-coloring': 'سراج | أنشطة وتلوين مجاني',
      'coloring-book': 'سراج | كشكولي المطبوع',
      'faq': 'سراج | الأسئلة الشائعة',
      'shipping': 'سراج | سياسة الشحن',
      'returns': 'سراج | سياسة الاسترجاع'
    };
    if (pageTitles[name]) document.title = pageTitles[name];


    if (name === 'product') renderProductDetail(sub);
    if (name === 'cart') renderCartPage();
    if (name === 'checkout') renderCheckoutPage();
    if (name === 'wizard') setupWizard();
    if (name === 'success') {
      burstConfetti();
      renderSuccessPage();
    }
    if (name === 'mama-world') initMamaWorld();
    if (name === 'article') renderArticleDetail(sub);
    if (name === 'mama-coloring') {
      // Redirect to mama-world with coloring tab activated
      initMamaWorld();
      var coloringTab = document.querySelector('[data-mama-tab="coloring"]');
      var coloringPanel = document.querySelector('[data-mama-panel="coloring"]');
      if (coloringTab && coloringPanel) {
        document.querySelectorAll('.mama-tab').forEach(function (t) { t.classList.remove('is-active'); });
        document.querySelectorAll('.mama-panel').forEach(function (p) { p.classList.remove('is-active'); });
        coloringTab.classList.add('is-active');
        coloringPanel.classList.add('is-active');
        renderColoringCatalog();
      }
    }
    if (name === 'coloring-book') renderColoringBook();
    if (name === 'preview') {
      var heroName = state.heroName || 'بطلنا';
      var el = document.getElementById('previewName');
      if (el) el.textContent = heroName;
    }
  }

  function handleRoute() {
    var route = parseRoute();
    showPage(route.page, route.sub);
    if (route.anchor) {
      if (route.page === 'products' && CATALOG_META[route.anchor]) {
        // Filter catalog to the specified section tab
        filterCatalog(route.anchor);
      } else {
        setTimeout(function() {
          var target = document.getElementById(route.anchor);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 350);
      }
    }
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
    state.customChallenge = '';

    var nameInput = wizardShell.querySelector('#heroName');
    if (nameInput) nameInput.value = '';
    var customChallengeInput = wizardShell.querySelector('#customChallenge');
    if (customChallengeInput) customChallengeInput.value = '';
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

    var customChallengeInput = wizardShell.querySelector('#customChallenge');
    if (customChallengeInput) {
      customChallengeInput.addEventListener('input', function (e) {
        state.customChallenge = e.target.value.trim();
      });
    }

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

  // ----- Mama World Tabs & Articles -----
  var mamaInited = false;
  var articlesState = { page: 1, limit: 12, total: 0, section: '', search: '', sections: [] };
  var articlesSearchTimer = null;

  // ----- Outings (Fas7a Helwa) state -----
  var outingsState = {
    city: '',
    type: '',          // '', 'indoor', 'outdoor', 'mixed'
    category: '',      // '', '1', '2', '3', '4', '5', '6'
    search: '',
    page: 1,
    limit: 12,
    data: [],
    count: 0,
    totalPages: 0,
    loading: false
  };
  var outingsInited = false;
  var outingsSearchTimer;

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
          if (target === 'outings' && !outingsInited) {
            initOutings();
          }
          if (target === 'coloring') {
            renderColoringCatalog();
          }
        });
      });

      // Search input with debounce
      var searchInput = document.getElementById('articles-search');
      if (searchInput) {
        searchInput.addEventListener('input', function () {
          clearTimeout(articlesSearchTimer);
          articlesSearchTimer = setTimeout(function () {
            articlesState.search = searchInput.value.trim();
            articlesState.page = 1;
            fetchArticles();
          }, 300);
        });
      }

      // Load more button
      var loadMoreBtn = document.getElementById('articles-load-more');
      if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function () {
          articlesState.page++;
          fetchArticles(true);
        });
      }

      mamaInited = true;
    }

    document.querySelectorAll('.mama-tab').forEach(function (t) { t.classList.remove('is-active'); });
    document.querySelectorAll('.mama-panel').forEach(function (p) { p.classList.remove('is-active'); });
    var articlesTab = document.querySelector('[data-mama-tab="articles"]');
    var articlesPanel = document.querySelector('[data-mama-panel="articles"]');
    if (articlesTab) articlesTab.classList.add('is-active');
    if (articlesPanel) articlesPanel.classList.add('is-active');

    // Reset and fetch articles
    articlesState.page = 1;
    articlesState.section = '';
    fetchArticles();
  }

  function fetchArticles(append) {
    var grid = document.getElementById('articles-grid');
    var loading = document.getElementById('articles-loading');
    var empty = document.getElementById('articles-empty');
    var error = document.getElementById('articles-error');
    var loadMore = document.getElementById('articles-load-more');
    if (!grid) return;

    loading.style.display = 'block';
    empty.style.display = 'none';
    error.style.display = 'none';

    var params = new URLSearchParams({
      page: String(articlesState.page),
      limit: String(articlesState.limit)
    });
    if (articlesState.section) params.set('section', articlesState.section);
    if (articlesState.search) params.set('search', articlesState.search);

    fetch('/api/articles?' + params.toString())
      .then(function (r) { return r.json(); })
      .then(function (data) {
        loading.style.display = 'none';
        if (!data.success) {
          error.style.display = 'block';
          return;
        }
        var html = '';
        data.data.forEach(function (a, i) {
          var sectionColor = getSectionColor(a.section);
          var coverStyle = a.coverImage
            ? 'background-image:url(' + a.coverImage + ')'
            : 'background:linear-gradient(135deg,' + sectionColor + ',' + sectionColor + '88)';
          html += '<article class="article-card reveal" style="--d:.' + ((i % 12) * 5 + 5) + 's" onclick="location.hash=\'#/article/' + a.slug + '\'">';
          html += '<div class="article-img" style="' + coverStyle + '"></div>';
          html += '<div class="article-body">';
          html += '<span class="article-badge" style="background:' + sectionColor + '">' + a.section + '</span>';
          html += '<h3>' + escHtml(a.title) + '</h3>';
          html += '<p>' + escHtml(a.excerpt) + '</p>';
          html += '<span class="article-time">⏱ ' + (a.readingTime || 5) + ' دقائق قراءة</span>';
          html += '</div></article>';
        });

        if (append) {
          grid.insertAdjacentHTML('beforeend', html);
        } else {
          grid.innerHTML = html;
        }

        articlesState.total = data.pagination.total;
        loadMore.style.display = (articlesState.page * articlesState.limit < articlesState.total) ? 'inline-flex' : 'none';
        empty.style.display = (data.data.length === 0 && !append) ? 'block' : 'none';

        // Update chips
        if (data.sections && data.sections.length > 0) {
          articlesState.sections = data.sections;
          renderArticleChips(data.sections);
        }

        setTimeout(initReveals, 80);
      })
      .catch(function () {
        loading.style.display = 'none';
        error.style.display = 'block';
      });
  }

  function renderArticleChips(sections) {
    var chipsEl = document.getElementById('articles-chips');
    if (!chipsEl) return;
    var html = '<button class="chip' + (!articlesState.section ? ' is-active' : '') + '" data-article-section="">الكل</button>';
    sections.forEach(function (s) {
      var isActive = articlesState.section === s.name ? ' is-active' : '';
      html += '<button class="chip' + isActive + '" data-article-section="' + escHtml(s.name) + '">' + escHtml(s.name) + ' (' + s.count + ')</button>';
    });
    chipsEl.innerHTML = html;

    // Bind click events
    chipsEl.querySelectorAll('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        chipsEl.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        articlesState.section = chip.dataset.articleSection || '';
        articlesState.page = 1;
        fetchArticles();
      });
    });
  }

  // Section colors map
  var SECTION_COLORS_MAP = {
    'الحمل والرضاعة': '#e85d4c',
    'من الولادة إلى سنتين': '#f59e42',
    'من 2 إلى 5 سنوات': '#6bbf3f',
    'من 5 إلى 10 سنوات': '#3b8fd9',
    'العلاقة مع الأم نفسيا': '#c9974e',
    'الأهل والأسرة الممتدة': '#36a39a',
    'العدل بين الولد والبنت': '#8b5e2a',
    'المدرسة والضغط الدراسي': '#5b7fc7',
    'الشاشات والإنترنت': '#9b59b6',
    'السلوكيات الصعبة والصحة النفسية': '#e74c3c',
    'الأب والتربية المشتركة': '#2c3e50',
    'مشاعر الأم وصورتها عن نفسها': '#e08283',
    'القيم والمراحل العمرية': '#27ae60'
  };

  function getSectionColor(section) {
    return SECTION_COLORS_MAP[section] || '#6bbf3f';
  }

  function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ----- Outings (Fas7a Helwa) Functions -----
  function initOutings() {
    // City chips
    document.querySelectorAll('#cityChips .chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('#cityChips .chip').forEach(function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        outingsState.city = chip.dataset.city || '';
        outingsState.page = 1;
        fetchPlaces();
      });
    });

    // Type chips
    document.querySelectorAll('#typeChips .chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('#typeChips .chip').forEach(function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        outingsState.type = chip.dataset.type || '';
        outingsState.page = 1;
        fetchPlaces();
      });
    });

    // Category chips
    document.querySelectorAll('#catChips .chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('#catChips .chip').forEach(function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        outingsState.category = chip.dataset.cat || '';
        outingsState.page = 1;
        fetchPlaces();
      });
    });

    // Search input (the existing one in the outings panel — enable it)
    var searchInput = document.querySelector('[data-mama-panel="outings"] .mama-search input');
    if (searchInput) {
      searchInput.disabled = false;
      searchInput.addEventListener('input', function () {
        clearTimeout(outingsSearchTimer);
        outingsSearchTimer = setTimeout(function () {
          outingsState.search = searchInput.value.trim();
          outingsState.page = 1;
          fetchPlaces();
        }, 350);
      });
    }

    // Load more
    var loadMoreBtn = document.getElementById('outingsLoadMore');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', function () {
        outingsState.page++;
        fetchPlaces(true);
      });
    }

    // Clear filters
    var clearBtn = document.getElementById('outingsClearFilters');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        resetOutingsFilters();
      });
    }

    // Close modal
    var modalBackdrop = document.getElementById('placeModal');
    var modalClose = document.getElementById('placeModalClose');
    if (modalClose) {
      modalClose.addEventListener('click', function () {
        modalBackdrop.style.display = 'none';
        document.body.style.overflow = '';
      });
    }
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', function (e) {
        if (e.target === modalBackdrop) {
          modalBackdrop.style.display = 'none';
          document.body.style.overflow = '';
        }
      });
    }

    outingsInited = true;
    fetchPlaces(); // Initial load
  }

  function fetchPlaces(append) {
    var grid = document.getElementById('outingsGrid');
    var loading = document.getElementById('outingsLoading');
    var empty = document.getElementById('outingsEmpty');
    var loadMore = document.getElementById('outingsLoadMore');
    var resultsBar = document.getElementById('outingsResultsBar');
    var countEl = document.getElementById('outingsCount');
    var clearBtn = document.getElementById('outingsClearFilters');
    if (!grid) return;

    if (!append) {
      grid.innerHTML = '';
      outingsState.data = [];
    }
    loading.style.display = 'block';
    empty.style.display = 'none';
    if (loadMore) loadMore.style.display = 'none';
    outingsState.loading = true;

    // Build query params
    var params = new URLSearchParams();
    params.set('limit', outingsState.limit);
    params.set('page', outingsState.page);
    if (outingsState.city) params.set('city', outingsState.city);
    if (outingsState.type) params.set('indoor_outdoor', outingsState.type);
    if (outingsState.category) params.set('category', outingsState.category);
    if (outingsState.search) params.set('q', outingsState.search);

    fetch('/api/places?' + params.toString())
      .then(function (res) { return res.json(); })
      .then(function (json) {
        outingsState.loading = false;
        loading.style.display = 'none';

        if (!json.success || !json.data) {
          empty.style.display = 'block';
          return;
        }

        outingsState.data = append ? outingsState.data.concat(json.data) : json.data;
        outingsState.count = json.count || 0;
        outingsState.totalPages = json.totalPages || 1;

        // Results bar
        if (resultsBar) {
          resultsBar.style.display = 'flex';
          countEl.textContent = outingsState.count + ' مكان';
        }

        // Show clear button if any filter is active
        var hasFilters = outingsState.city || outingsState.type || outingsState.category || outingsState.search;
        if (clearBtn) clearBtn.style.display = hasFilters ? 'block' : 'none';

        if (outingsState.data.length === 0) {
          empty.style.display = 'block';
          return;
        }

        // Render cards
        var newCards = json.data.map(function (place) { return renderPlaceCard(place); }).join('');
        if (append) {
          grid.innerHTML += newCards;
        } else {
          grid.innerHTML = newCards;
        }

        // Load more
        if (loadMore) {
          loadMore.style.display = outingsState.page < outingsState.totalPages ? 'block' : 'none';
        }

        setTimeout(initReveals, 80);
      })
      .catch(function () {
        outingsState.loading = false;
        loading.style.display = 'none';
        empty.style.display = 'block';
      });
  }

  function renderPlaceCard(place) {
    var ageText = 'من ' + toArabicNum(place.min_age) + ' لـ ' + toArabicNum(place.max_age) + ' سنة';
    var catLabel = getCategoryLabel(place.category_ids);
    var searchUrl = getPlaceSearchUrl(place);
    var imgHtml = place.image_url
      ? '<img src="' + place.image_url + '" alt="' + escHtml(place.name_ar || place.name_en) + '" loading="lazy"/>'
      : '';
    var catBadge = catLabel ? '<span class="outing-cat-badge">' + catLabel + '</span>' : '';
    var offerBadge = (place.offer_active && place.offer_text)
      ? '<span class="outing-offer-tag">' + escHtml(place.offer_text) + '</span>'
      : '';

    return '<article class="outing-card reveal" onclick="window._openPlace(\'' + place._id + '\')">' +
      '<div class="outing-img">' + imgHtml + offerBadge + catBadge + '</div>' +
      '<div class="outing-body">' +
        '<h3>' + escHtml(place.name_ar || place.name_en) + '</h3>' +
        '<div class="outing-info-row">' +
          '<span class="outing-loc">' + escHtml(place.city || place.area || '') + (place.area && place.city ? ' · ' + escHtml(place.area) : '') + '</span>' +
          '<span class="outing-age">' + ageText + '</span>' +
        '</div>' +
        '<a href="' + searchUrl + '" target="_blank" rel="noopener" class="outing-info-btn" onclick="event.stopPropagation()">' +
          '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
          'اعرف أكتر عن المكان' +
        '</a>' +
      '</div>' +
    '</article>';
  }

  function getPlaceSearchUrl(place) {
    if (place.website_url) return place.website_url;
    if (place.external_detail_url) return place.external_detail_url;
    return 'https://www.google.com/search?q=' + encodeURIComponent((place.name_en || place.name_ar) + ' ' + (place.city || '') + ' Egypt');
  }

  function getPlaceMapUrl(place) {
    if (place.location && place.location.lat && place.location.lon)
      return 'https://www.google.com/maps/search/?api=1&query=' + place.location.lat + ',' + place.location.lon;
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(place.name_en + ' ' + (place.city || ''));
  }

  function getCategoryLabel(ids) {
    if (!ids || !ids.length) return '';
    var map = {1:'🎠 لعب',2:'🎬 سينما',3:'🌳 حدائق',4:'🎨 فنون',5:'🐾 حيوانات',6:'🍕 مطاعم'};
    return map[ids[0]] || '';
  }

  window._openPlace = function (id) {
    var place = outingsState.data.find(function (p) { return p._id === id; });
    if (!place) return;

    var modal = document.getElementById('placeModal');
    var imgContainer = document.getElementById('placeModalImg');
    var body = document.getElementById('placeModalBody');

    var mapUrl = getPlaceMapUrl(place);
    var searchUrl = getPlaceSearchUrl(place);

    imgContainer.innerHTML = place.image_url
      ? '<img src="' + place.image_url + '" alt="' + escHtml(place.name_ar) + '"/>'
      : '';

    var typeMap = {indoor:'أماكن مغلقة',outdoor:'في الهوا الطلق',mixed:'مختلط',unknown:''};
    var typeLabel = typeMap[place.indoor_outdoor] || '';

    // Offer banner
    var offerHtml = '';
    if (place.offer_active && place.offer_text) {
      offerHtml = '<div class="place-offer-banner">' +
        '<span class="place-offer-icon">🎁</span>' +
        '<span>' + escHtml(place.offer_text) + '</span>' +
      '</div>';
    }

    // Actions
    var actionsHtml = '<a href="' + searchUrl + '" target="_blank" rel="noopener" class="btn-search">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
      'اعرف أكتر عن المكان</a>';

    actionsHtml += '<a href="' + mapUrl + '" target="_blank" rel="noopener" class="btn-map">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>' +
      'افتح في Google Maps</a>';

    if (place.phone) {
      actionsHtml += '<a href="tel:' + place.phone + '" class="btn-call">' +
        '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' +
        'اتصلي بالمكان</a>';
    }

    if (place.website_url) {
      actionsHtml += '<a href="' + place.website_url + '" target="_blank" rel="noopener" class="btn-website">' +
        '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>' +
        'الموقع الإلكتروني</a>';
    }

    body.innerHTML =
      '<h2>' + escHtml(place.name_ar || place.name_en) + '</h2>' +
      (place.description_short ? '<p class="place-desc">' + escHtml(place.description_short) + '</p>' : '') +
      offerHtml +
      '<div class="place-detail-chips">' +
        (typeLabel ? '<span class="chip" style="background:#e8f0fe;color:#3b82f6;border-color:#93c5fd">' + typeLabel + '</span>' : '') +
        '<span class="chip" style="background:var(--brass-wash);color:var(--brass-dark);border-color:var(--brass)">من ' + toArabicNum(place.min_age) + ' لـ ' + toArabicNum(place.max_age) + ' سنة</span>' +
        (place.booking_required ? '<span class="chip" style="background:#fef3cd;color:#856404;border-color:#ffc107">حجز مطلوب</span>' : '') +
      '</div>' +
      '<div class="place-actions">' + actionsHtml + '</div>';

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  function resetOutingsFilters() {
    outingsState.city = '';
    outingsState.type = '';
    outingsState.category = '';
    outingsState.search = '';
    outingsState.page = 1;

    // Reset UI
    ['#cityChips', '#typeChips', '#catChips'].forEach(function (sel) {
      document.querySelectorAll(sel + ' .chip').forEach(function (c, i) {
        c.classList.toggle('is-active', i === 0);
      });
    });
    var searchInput = document.querySelector('[data-mama-panel="outings"] .mama-search input');
    if (searchInput) searchInput.value = '';

    fetchPlaces();
  }

  // ----- Article Detail Page -----
  function renderArticleDetail(slug) {
    var container = document.getElementById('article-detail');
    if (!container) return;
    container.innerHTML = '<div class="articles-loading"><div class="articles-spinner"></div><p>جاري تحميل المقال...</p></div>';

    fetch('/api/articles/' + slug)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.success || !data.data) {
          container.innerHTML = '<div class="articles-error"><p>المقال غير موجود</p><a href="#/mama-world" class="btn btn-outline" style="margin-top:16px;display:inline-block">← رجوع لعالم ماما</a></div>';
          return;
        }
        var a = data.data;

        // Dynamic SEO
        document.title = (a.seoTitle || a.title) + ' | سراج';
        var metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', a.metaDescription || a.excerpt || '');

        var sectionColor = getSectionColor(a.section);
        var coverHtml = a.coverImage
          ? '<div class="article-detail-cover" style="background-image:url(' + a.coverImage + ')"></div>'
          : '';

        // Convert markdown to HTML (simple converter)
        // Strip duplicate sources section from markdown (we render sources separately from the sources[] array)
        var cleanedMd = (a.contentMarkdown || '')
          .replace(/---\s*##\s*\*{0,2}مصادر وروابط\*{0,2}[\s\S]*$/, '')
          .replace(/##\s*\*{0,2}مصادر وروابط\*{0,2}[\s\S]*$/, '')
          .replace(/---\s*##\s*\*{0,2}المصادر والمراجع\*{0,2}[\s\S]*$/, '')
          .replace(/##\s*\*{0,2}المصادر والمراجع\*{0,2}[\s\S]*$/, '')
          .replace(/---\s*##\s*\*{0,2}المصادر\*{0,2}\s[\s\S]*$/, '')
          .replace(/##\s*\*{0,2}المصادر\*{0,2}\s[\s\S]*$/, '')
          .trim();
        var contentHtml = simpleMarkdown(cleanedMd);

        // Sources
        var sourcesHtml = '';
        if (a.sources && a.sources.length > 0) {
          sourcesHtml = '<div class="article-sources"><h2>📚 المصادر والمراجع</h2><div class="sources-list">';
          a.sources.forEach(function (s) {
            sourcesHtml += '<div class="source-item">';
            sourcesHtml += '<strong>' + escHtml(s.label) + '</strong>';
            if (s.url) sourcesHtml += ' <a href="' + escHtml(s.url) + '" target="_blank" rel="noopener">↗ رابط المصدر</a>';
            if (s.note) sourcesHtml += ' <span class="source-note">· ' + escHtml(s.note) + '</span>';
            sourcesHtml += '</div>';
          });
          sourcesHtml += '</div></div>';
        }

        // Related articles
        var relatedHtml = '';
        if (data.related && data.related.length > 0) {
          relatedHtml = '<div class="article-related"><h2>مقالات ذات صلة</h2><div class="related-grid">';
          data.related.forEach(function (r) {
            var rColor = getSectionColor(r.section);
            var rCover = r.coverImage
              ? 'background-image:url(' + r.coverImage + ')'
              : 'background:linear-gradient(135deg,' + rColor + ',' + rColor + '88)';
            relatedHtml += '<a href="#/article/' + r.slug + '" class="related-card">';
            relatedHtml += '<div class="related-img" style="' + rCover + '"></div>';
            relatedHtml += '<div class="related-body"><h4>' + escHtml(r.title) + '</h4>';
            relatedHtml += '<span class="article-time">⏱ ' + (r.readingTime || 5) + ' دقائق</span>';
            relatedHtml += '</div></a>';
          });
          relatedHtml += '</div></div>';
        }

        // Format date
        var dateStr = '';
        if (a.publishedAt) {
          try {
            var d = new Date(a.publishedAt);
            dateStr = d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
          } catch (e) { dateStr = ''; }
        }

        container.innerHTML =
          '<a href="#/mama-world" class="article-back">← رجوع لعالم ماما</a>' +
          coverHtml +
          '<div class="article-detail-content">' +
          '<span class="article-badge" style="background:' + sectionColor + '">' + escHtml(a.section) + '</span>' +
          '<h1 class="article-detail-title">' + escHtml(a.title) + '</h1>' +
          '<div class="article-meta">✏️ ' + escHtml(a.author || 'فريق سراج') + ' · ⏱ ' + (a.readingTime || 5) + ' دقائق قراءة' + (dateStr ? ' · ' + dateStr : '') + '</div>' +
          '<hr class="article-divider"/>' +
          '<div class="article-body-content">' + contentHtml + '</div>' +
          '<hr class="article-divider"/>' +
          sourcesHtml +
          relatedHtml +
          '</div>';

        window.scrollTo({ top: 0, behavior: 'instant' });
      })
      .catch(function () {
        container.innerHTML = '<div class="articles-error"><p>حصلت مشكلة في تحميل المقال</p><a href="#/mama-world" class="btn btn-outline" style="margin-top:16px;display:inline-block">← رجوع لعالم ماما</a></div>';
      });
  }

  // Simple Markdown to HTML converter (no external dependency)
  function simpleMarkdown(md) {
    if (!md) return '';
    var html = md;
    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Links
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // Unordered lists
    html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^\- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    // Horizontal rules
    html = html.replace(/^---+$/gm, '<hr/>');
    // Tables (simple)
    html = html.replace(/^\|(.+)\|$/gm, function (match) {
      if (match.match(/^\|[\s-|]+\|$/)) return '';
      var cells = match.split('|').filter(function (c) { return c.trim(); });
      return '<tr>' + cells.map(function (c) { return '<td>' + c.trim() + '</td>'; }).join('') + '</tr>';
    });
    html = html.replace(/(<tr>.*<\/tr>\n?)+/g, '<div class="table-scroll-wrap"><table>$&</table></div>');
    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>\s*(<h[1-6]>)/g, '$1');
    html = html.replace(/(<\/h[1-6]>)\s*<\/p>/g, '$1');
    html = html.replace(/<p>\s*(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)\s*<\/p>/g, '$1');
    html = html.replace(/<p>\s*(<table>)/g, '$1');
    html = html.replace(/(<\/table>)\s*<\/p>/g, '$1');
    html = html.replace(/<p>\s*(<hr\/>)/g, '$1');
    html = html.replace(/(<hr\/>)\s*<\/p>/g, '$1');
    return html;
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

  // ----- Catalog Tab Clicks (filter products by section) -----
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.cat-tab[data-cat-tab]');
    if (!btn) return;
    filterCatalog(btn.dataset.catTab);
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

  // ----- Fetch Testimonials -----
  function fetchTestimonials() {
    var grid = document.getElementById('testimonialsGrid');
    if (!grid) return;

    fetch('/api/testimonials')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.success || !data.data || !data.data.length) return;
        var html = '';
        data.data.forEach(function (t, i) {
          html += '<figure class="t-card reveal" style="--d:.' + ((i % 12) * 5 + 5) + 's">';
          html += '<blockquote>"' + escHtml(t.quote) + '"</blockquote>';
          html += '<figcaption>';
          html += '<span class="avatar" style="--c:' + (t.avatarColor || '#6bbf3f') + '">' + escHtml(t.avatarInitials) + '</span>';
          html += '<div><strong>' + escHtml(t.name) + '</strong><small>' + escHtml(t.location) + ' · ' + escHtml(t.childAge) + '</small></div>';
          html += '</figcaption></figure>';
        });
        grid.innerHTML = html;
        setTimeout(initReveals, 80);
      });
  }

  // ---------------------------------------------------------
  // CMS CONTENT / DOM INJECTION
  // ---------------------------------------------------------
  var SITE_CONTENT = {};
  var HTML_KEYS = ['hero.title', 'hero.subtitle', 'about.quote'];
  var MARKDOWN_KEYS = ['faq.content', 'shipping.content', 'returns.content', 'about.story'];

  function fetchSiteContent() {
    fetch('/api/content')
      .then(function (res) { return res.json(); })
      .then(function (json) {
        if (json.success && json.data) {
          var flat = {};
          Object.keys(json.data).forEach(function (section) {
            Object.keys(json.data[section]).forEach(function (key) {
              flat[key] = json.data[section][key];
            });
          });
          SITE_CONTENT = flat;
          injectSiteContent();
        }
      })
      .catch(function (err) {
        console.warn("Failed to fetch site content, using default local HTML.", err);
      });
  }

  function injectSiteContent() {
    document.querySelectorAll('[data-content-key]').forEach(function (el) {
      var key = el.getAttribute('data-content-key');
      if (SITE_CONTENT[key]) {
        // Special Case: Counter Number
        if (key === 'counter.number') {
          el.setAttribute('data-to', SITE_CONTENT[key]);
          el.textContent = '٠';
          return;
        }

        if (HTML_KEYS.indexOf(key) !== -1) {
          el.innerHTML = SITE_CONTENT[key];
        } else if (MARKDOWN_KEYS.indexOf(key) !== -1) {
          el.innerHTML = simpleMarkdown(SITE_CONTENT[key]);
        } else {
          el.textContent = SITE_CONTENT[key];
        }
      }
    });

    // Special handling for wizard inputs
    ['wizard.step1_q', 'wizard.step2_q', 'wizard.step3_q'].forEach(function(key, index) {
       if (SITE_CONTENT[key]) {
         var h2 = document.querySelector('.wizard-step[data-step="' + (index + 1) + '"] h2');
         if(h2) h2.textContent = SITE_CONTENT[key];
       }
    });

    // Re-initialize any dynamic components like counters
    // that might have been recreated when innerHTML was injected!
    initCounter();
  }

  // ---------------------------------------------------------
  // MAMA COLORING & WORKBOOK
  // ---------------------------------------------------------
  var COLORING_CART_KEY = 'seraj-coloring-cart';
  var coloringCart = [];
  var coloringState = {
    page: 1,
    limit: 20,
    search: '',
    category: '',
    difficulty: '',
    ageRange: '',
    hasMore: true,
    loading: false,
    pricePerPage: 3, // fallback, will be fetched from SiteContent
    coverPrice: 20   // fallback, will be fetched from SiteContent
  };

  function loadColoringCart() {
    try {
      var saved = localStorage.getItem(COLORING_CART_KEY);
      if (saved) {
        coloringCart = JSON.parse(saved);
        if (!Array.isArray(coloringCart)) coloringCart = [];
      }
    } catch (e) { coloringCart = []; }
    updateColoringFab();
  }

  function saveColoringCart() {
    localStorage.setItem(COLORING_CART_KEY, JSON.stringify(coloringCart));
    updateColoringFab();
  }

  function updateColoringFab() {
    var bar = document.getElementById('coloringWorkbookBar');
    var countEl = document.getElementById('cwbCount');
    if (!bar || !countEl) return;
    
    if (coloringCart.length > 0) {
      bar.style.display = 'flex';
      countEl.textContent = toArabicNum(coloringCart.length);
    } else {
      bar.style.display = 'none';
    }
  }

  function fetchColoringItems(append) {
    if (coloringState.loading) return;
    coloringState.loading = true;
    
    var loader = document.getElementById('coloringLoading');
    var loadMoreBtn = document.getElementById('coloringLoadMore');
    var grid = document.getElementById('coloringGrid');
    
    if (!append) {
       grid.innerHTML = '';
       if(loader) loader.style.display = 'block';
       if(loadMoreBtn) loadMoreBtn.style.display = 'none';
    } else {
       if(loadMoreBtn) {
         loadMoreBtn.disabled = true;
         loadMoreBtn.textContent = 'جاري التحميل...';
       }
    }

    var params = new URLSearchParams();
    params.set('page', coloringState.page);
    params.set('limit', coloringState.limit);
    if (coloringState.search) params.set('q', coloringState.search);
    if (coloringState.category) params.set('category', coloringState.category);
    if (coloringState.difficulty) params.set('difficulty', coloringState.difficulty);
    if (coloringState.ageRange) params.set('age', coloringState.ageRange);

    fetch('/api/coloring/items?' + params.toString())
      .then(function(res) { return res.json(); })
      .then(function(data) {
         coloringState.loading = false;
         if(loader) loader.style.display = 'none';
         if(loadMoreBtn) {
           loadMoreBtn.disabled = false;
           loadMoreBtn.textContent = 'عرض المزيد ↓';
         }

         if (data.success) {
           var items = data.data || [];
           coloringState.hasMore = data.pagination && data.pagination.page < data.pagination.pages;
           
           if (!append && items.length === 0) {
              grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--ink-mute);">مفيش رسومات هنا، جربي بحث أو قسم تاني.</div>';
              if(loadMoreBtn) loadMoreBtn.style.display = 'none';
              return;
           }

            items.forEach(function(item) {
              var isAdded = coloringCart.some(function(c) { return c._id === item._id; });
              var card = document.createElement('div');
              card.className = 'coloring-card';
              var sourceAttr = item.sourceUrl ? ' data-source="' + item.sourceUrl.replace(/"/g, '&quot;') + '"' : '';
              card.innerHTML = 
                '<div class="coloring-img-wrap">' +
                  '<img src="' + item.thumbnail + '" alt="' + item.title + '" loading="lazy" />' +
                  '<button class="coloring-heart ' + (isAdded ? 'is-loved' : '') + '" data-action="toggle" data-id="' + item._id + '" data-img="' + item.thumbnail + '" data-title="' + item.title + '" title="' + (isAdded ? 'شيلي من الكشكول' : 'ضيفي للكشكول') + '">' +
                    '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="' + (isAdded ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2"/></svg>' +
                  '</button>' +
                '</div>' +
                '<div class="coloring-body">' +
                  '<h3 class="coloring-title">' + item.title + '</h3>' +
                  '<div class="coloring-actions">' +
                    '<button class="coloring-btn-add ' + (isAdded ? 'is-added' : '') + '" data-action="toggle" data-id="' + item._id + '" data-img="' + item.thumbnail + '" data-title="' + item.title + '">' +
                       (isAdded ? '✓ في الكشكول' : '+ ضيفي للكشكول') +
                    '</button>' +
                    '<button class="coloring-btn-share" data-action="share" data-title="' + item.title + '"' + sourceAttr + '>' +
                      '🔗 مشاركة' +
                    '</button>' +
                  '</div>' +
                '</div>';
              grid.appendChild(card);
            });

           if (coloringState.hasMore) {
             if(loadMoreBtn) loadMoreBtn.style.display = 'block';
           } else {
             if(loadMoreBtn) loadMoreBtn.style.display = 'none';
           }
         }
      })
      .catch(function(err) {
         coloringState.loading = false;
         if(loader) loader.style.display = 'none';
         if(loadMoreBtn) loadMoreBtn.disabled = false;
         console.error('Fetch Coloring Error:', err);
      });
  }

  function fetchColoringCategories() {
    var tabsWrap = document.getElementById('coloringTabs');
    if (!tabsWrap) return;
    
    // Always start with "All"
    fetch('/api/coloring/categories')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.success && data.data) {
           var html = '<button class="chip ' + (!coloringState.category ? 'is-active' : '') + '" data-val="">كل الأقسام</button>';
           data.data.forEach(function(cat) {
             html += '<button class="chip ' + (coloringState.category === cat.slug ? 'is-active' : '') + '" data-val="' + cat.slug + '">' + cat.nameAr + '</button>';
           });
           tabsWrap.innerHTML = html;
        }
      });
  }

  function fetchColoringPricing() {
    fetch('/api/coloring/pricing')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.success && data.data) {
           coloringState.pricePerPage = parseFloat(data.data.pricePerPage) || 3;
           coloringState.coverPrice = parseFloat(data.data.coverPrice) || 20;
        }
      });
  }

  function renderColoringCatalog() {
    fetchColoringCategories();
    fetchColoringPricing();
    
    coloringState.page = 1;
    coloringState.hasMore = true;
    
    var searchInput = document.getElementById('coloringSearch');
    if (searchInput) searchInput.value = coloringState.search;
    
    fetchColoringItems(false);
  }

  function attachColoringListeners() {
    // Top Tabs Event
    var tabsWrap = document.getElementById('coloringTabs');
    if (tabsWrap) {
      tabsWrap.addEventListener('click', function(e) {
        if (e.target.classList.contains('chip')) {
          tabsWrap.querySelectorAll('.chip').forEach(function(c) { c.classList.remove('is-active'); });
          e.target.classList.add('is-active');
          coloringState.category = e.target.dataset.val;
          coloringState.page = 1;
          fetchColoringItems(false);
        }
      });
    }

    // Difficulty Event
    var diffWrap = document.getElementById('coloringDifficulty');
    if (diffWrap) {
      diffWrap.addEventListener('click', function(e) {
        if (e.target.classList.contains('chip')) {
          diffWrap.querySelectorAll('.chip').forEach(function(c) { c.classList.remove('is-active'); });
          e.target.classList.add('is-active');
          coloringState.difficulty = e.target.dataset.val;
          coloringState.page = 1;
          fetchColoringItems(false);
        }
      });
    }

    // Age Range Event
    var ageWrap = document.getElementById('coloringAge');
    if (ageWrap) {
      ageWrap.addEventListener('click', function(e) {
        if (e.target.classList.contains('chip')) {
          ageWrap.querySelectorAll('.chip').forEach(function(c) { c.classList.remove('is-active'); });
          e.target.classList.add('is-active');
          coloringState.ageRange = e.target.dataset.val;
          coloringState.page = 1;
          fetchColoringItems(false);
        }
      });
    }

    // Search Event
    var searchInput = document.getElementById('coloringSearch');
    if (searchInput) {
      var timeout = null;
      searchInput.addEventListener('input', function(e) {
        clearTimeout(timeout);
        timeout = setTimeout(function() {
          coloringState.search = e.target.value.trim();
          coloringState.page = 1;
          fetchColoringItems(false);
        }, 500);
      });
    }

    // Load More Event
    var loadMore = document.getElementById('coloringLoadMore');
    if (loadMore) {
      loadMore.addEventListener('click', function() {
        if (coloringState.hasMore && !coloringState.loading) {
          coloringState.page++;
          fetchColoringItems(true);
        }
      });
    }

    // Grid Event Delegate (toggle + share)
    var grid = document.getElementById('coloringGrid');
    if (grid) {
      grid.addEventListener('click', function(e) {
        // Share button
        var shareBtn = e.target.closest('[data-action="share"]');
        if (shareBtn) {
          var shareTitle = shareBtn.dataset.title || 'رسومة تلوين من سِراج';
          var shareUrl = shareBtn.dataset.source || window.location.href;
          if (navigator.share) {
            navigator.share({ title: shareTitle, url: shareUrl }).catch(function(){});
          } else {
            navigator.clipboard.writeText(shareUrl).then(function() {
              showToast('تم نسخ الرابط ✓');
            }).catch(function() {
              showToast('مفيش دعم للمشاركة على المتصفح ده');
            });
          }
          return;
        }

        // Toggle add/remove — works for both heart and text button
        var btn = e.target.closest('[data-action="toggle"]');
        if (!btn) return;
        
        var id = btn.dataset.id;
        var img = btn.dataset.img;
        var title = btn.dataset.title;
        var card = btn.closest('.coloring-card');
        
        var index = coloringCart.findIndex(function(c) { return c._id === id; });
        if (index > -1) {
           coloringCart.splice(index, 1);
           // Update all toggle buttons in this card
           if (card) {
             var hearts = card.querySelectorAll('.coloring-heart');
             var addBtns = card.querySelectorAll('.coloring-btn-add');
             hearts.forEach(function(h) { h.classList.remove('is-loved'); h.querySelector('path').setAttribute('fill','none'); h.title = 'ضيفي للكشكول'; });
             addBtns.forEach(function(b) { b.classList.remove('is-added'); b.textContent = '+ ضيفي للكشكول'; });
           }
           showToast('اتشالت من الكشكول');
        } else {
           coloringCart.push({ _id: id, thumbnail: img, title: title });
           if (card) {
             var hearts2 = card.querySelectorAll('.coloring-heart');
             var addBtns2 = card.querySelectorAll('.coloring-btn-add');
             hearts2.forEach(function(h) { h.classList.add('is-loved'); h.querySelector('path').setAttribute('fill','currentColor'); h.title = 'شيلي من الكشكول'; });
             addBtns2.forEach(function(b) { b.classList.add('is-added'); b.textContent = '✓ في الكشكول'; });
           }
           showToast('اتضافت للكشكول ✓');
        }
        saveColoringCart();
      });
    }
  }

  function renderColoringBook() {
     var wrap = document.getElementById('coloringBookContent');
     if (!wrap) return;

     // Check for shared workbook in URL
     var loadFromUrl = function() {
       try {
         var hash = window.location.hash || '';
         var match = hash.match(/[\?&]w=([^&]+)/);
         if (match) {
           var decoded = JSON.parse(atob(decodeURIComponent(match[1])));
           if (Array.isArray(decoded) && decoded.length > 0) {
             // Merge shared items into cart (don't overwrite existing)
             decoded.forEach(function(shared) {
               var exists = coloringCart.some(function(c) { return c._id === (shared._id || shared); });
               if (!exists) {
                 coloringCart.push(typeof shared === 'string' ? { _id: shared, thumbnail: '', title: 'رسومة' } : shared);
               }
             });
             saveColoringCart();
           }
         }
       } catch(e) {}
     };
     loadFromUrl();

     if (coloringCart.length === 0) {
        wrap.innerHTML = 
          '<div class="cb-empty-state">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>' +
            '<p>لسه ما اخترتيش رسومات لبطلنا.</p>' +
            '<p style="font-size:14px;color:var(--ink-mute)">اختاري رسومات مجانية من قسم الأنشطة والتلوين</p>' +
            '<a href="#/mama-world" data-link class="btn btn-primary">يلا نختار سويًا</a>' +
          '</div>';
        return;
     }

      var totalPages = coloringCart.length;

      // Min/max pages validation
      var minPages = parseInt(SITE_CONTENT['coloring_min_pages']) || 5;
      var maxPages = parseInt(SITE_CONTENT['coloring_max_pages']) || 50;
      var pagesWarning = '';
      if (totalPages < minPages) {
        pagesWarning = '<div class="cb-warning">⚠️ الحد الأدنى ' + toArabicNum(minPages) + ' رسومات — اختاري ' + toArabicNum(minPages - totalPages) + ' كمان</div>';
      } else if (totalPages > maxPages) {
        pagesWarning = '<div class="cb-warning">⚠️ الحد الأقصى ' + toArabicNum(maxPages) + ' رسمة — شيلي ' + toArabicNum(totalPages - maxPages) + '</div>';
      }

      var pricePer = SITE_CONTENT['pricePerPage'];
     if (!pricePer) pricePer = coloringState.pricePerPage;
     else pricePer = parseFloat(pricePer);

     var coverPriceVal = SITE_CONTENT['coverPrice'];
     if (!coverPriceVal) coverPriceVal = coloringState.coverPrice || 20;
     else coverPriceVal = parseFloat(coverPriceVal);

     var html = '<div class="cb-page-wrap">';
     
      // Free download notice
      html += '<div class="coloring-free-notice">';
      html += '<p>اختاري الرسومات اللي تعجبك وحددي شكل الكشكول — وسِراج هيطبعها ويجلّدها ويوصّلها ✦</p>';
      html += '</div>';

      // Pages warning
      html += pagesWarning;
     
     // Left: Items Grid
     html += '<div class="cb-items-wrap"><div class="cb-items-list">';
     coloringCart.forEach(function(item) {
        html += 
          '<div class="cb-item-card" data-id="' + item._id + '">' +
            '<img src="' + item.thumbnail + '" alt="' + item.title + '" class="cb-item-img" />' +
            '<span class="cb-item-title">' + item.title + '</span>' +
            '<button class="cb-item-remove" data-id="' + item._id + '">✕ شيل</button>' +
          '</div>';
     });
     html += '</div>';

     // Share workbook link
     html += '<div class="cb-share-bar">';
     html += '  <button class="btn btn-outline" id="cbShareLink">🔗 شاركي كشكولك (ابعتيله لنفسك على واتساب)</button>';
     html += '</div>';
     html += '</div>'; // end cb-items-wrap

     // Right: Summary Panel with format options
     html += '<div class="cb-summary-panel">';

     // Format selection
     html += '<h3 class="cb-panel-title">اختاري الشكل</h3>';
     html += '<div class="cb-format-options">';
     html += '  <label class="cb-format-card is-selected">';
     html += '    <input type="radio" name="cbFormat" value="sheets" checked style="display:none" />';
     html += '    <div class="cb-format-icon">📄</div>';
     html += '    <div class="cb-format-info">';
     html += '      <strong>ورق مطبوع</strong>';
     html += '      <span>أوراق تلوين مفردة</span>';
     html += '    </div>';
     html += '  </label>';
     html += '  <label class="cb-format-card">';
     html += '    <input type="radio" name="cbFormat" value="book" style="display:none" />';
     html += '    <div class="cb-format-icon">📚</div>';
     html += '    <div class="cb-format-info">';
     html += '      <strong>كشكول بغلاف مخصص</strong>';
     html += '      <span>+ ' + toArabicNum(coverPriceVal) + ' ج.م للغلاف</span>';
     html += '    </div>';
     html += '  </label>';
     html += '</div>';

     // Cover selection (hidden by default, shows when "book" is selected)
     html += '<div class="cb-cover-section" id="cbCoverSection" style="display:none">';
     html += '  <h4>اختاري غلاف الكشكول</h4>';
     html += '  <div class="cb-cover-grid" id="cbCoverGrid">';
     html += '    <label class="cb-cover-option is-selected"><input type="radio" name="cbCover" value="cover-seraj" checked style="display:none" /><img src="assets/seraj.png" alt="سِراج" /><span>سِراج</span></label>';
     html += '    <label class="cb-cover-option"><input type="radio" name="cbCover" value="cover-khaled" style="display:none" /><img src="assets/khaled-v2.png" alt="خالد" /><span>خالد</span></label>';
     html += '    <label class="cb-cover-option"><input type="radio" name="cbCover" value="cover-layla" style="display:none" /><img src="assets/layla.png" alt="ليلى" /><span>ليلى</span></label>';
     html += '    <label class="cb-cover-option"><input type="radio" name="cbCover" value="cover-zain" style="display:none" /><img src="assets/zain.png" alt="زين" /><span>زين</span></label>';
     html += '  </div>';
     html += '  <div class="cb-cover-name">';
     html += '    <label>اسم الكشكول (اختياري):</label>';
     html += '    <input type="text" id="cbCoverTitle" placeholder="مثلاً: كشكول يوسف للتلوين" maxlength="40" />';
     html += '  </div>';
     html += '</div>';

     // Price breakdown
     html += '<div class="cb-price-breakdown">';
     html += '  <div class="cb-summary-row"><span>عدد الرسومات</span><strong>' + toArabicNum(totalPages) + '</strong></div>';
     html += '  <div class="cb-summary-row"><span>سعر الورقة</span><strong>' + toArabicNum(pricePer) + ' ج.م</strong></div>';
     html += '  <div class="cb-summary-row"><span>الأوراق</span><strong>' + toArabicNum(totalPages * pricePer) + ' ج.م</strong></div>';
     html += '  <div class="cb-summary-row cb-cover-price-row" id="cbCoverPriceRow" style="display:none"><span>غلاف مخصص</span><strong>+' + toArabicNum(coverPriceVal) + ' ج.م</strong></div>';
     html += '  <div class="cb-summary-total" id="cbTotalRow"><span>الإجمالي</span><span id="cbTotalPrice">' + toArabicNum(totalPages * pricePer) + ' ج.م</span></div>';
     html += '</div>';

      html += '<p style="font-size:12px;color:var(--ink-mute);text-align:center;margin-top:12px;line-height:1.6;">شامل الطباعة والتغليف — مصاريف الشحن بتتحسب عند الطلب</p>';
      var canCheckout = totalPages >= minPages && totalPages <= maxPages;
      html += '<button class="btn btn-primary cb-checkout-btn' + (canCheckout ? '' : ' is-disabled') + '" id="btnColoringCheckout"' + (canCheckout ? '' : ' disabled') + '>' + (canCheckout ? 'أضيفي للسلة 🛒' : 'اختاري ' + toArabicNum(minPages) + ' رسومات على الأقل') + '</button>';
     html += '</div>'; // end summary panel

     html += '</div>'; // end cb-page-wrap
     wrap.innerHTML = html;

     // --- Event listeners ---

     // Format toggle (sheets / book)
     wrap.querySelectorAll('input[name="cbFormat"]').forEach(function(radio) {
       radio.addEventListener('change', function() {
         // Update visual selection
         wrap.querySelectorAll('.cb-format-card').forEach(function(c) { c.classList.remove('is-selected'); });
         radio.closest('.cb-format-card').classList.add('is-selected');
         var isBook = radio.value === 'book';
         document.getElementById('cbCoverSection').style.display = isBook ? 'block' : 'none';
         document.getElementById('cbCoverPriceRow').style.display = isBook ? 'flex' : 'none';
         updateBookPrice();
       });
     });

     // Cover selection
     wrap.querySelectorAll('input[name="cbCover"]').forEach(function(radio) {
       radio.addEventListener('change', function() {
         wrap.querySelectorAll('.cb-cover-option').forEach(function(c) { c.classList.remove('is-selected'); });
         radio.closest('.cb-cover-option').classList.add('is-selected');
       });
     });

     function updateBookPrice() {
       var format = wrap.querySelector('input[name="cbFormat"]:checked').value;
       var pagesTotal = totalPages * pricePer;
       var total = format === 'book' ? pagesTotal + coverPriceVal : pagesTotal;
       var totalEl = document.getElementById('cbTotalPrice');
       if (totalEl) totalEl.textContent = toArabicNum(total) + ' ج.م';
       return total;
     }

     // Remove items
     wrap.querySelectorAll('.cb-item-remove').forEach(function(btn) {
       btn.addEventListener('click', function(e) {
          var id = e.target.dataset.id;
          var index = coloringCart.findIndex(function(c) { return c._id === id; });
          if (index > -1) {
             coloringCart.splice(index, 1);
             saveColoringCart();
             renderColoringBook();
          }
       });
     });

     // Share workbook link
     var shareBtn = document.getElementById('cbShareLink');
     if (shareBtn) {
       shareBtn.addEventListener('click', function() {
         var ids = coloringCart.map(function(c) { return { _id: c._id, thumbnail: c.thumbnail, title: c.title }; });
         var encoded = encodeURIComponent(btoa(JSON.stringify(ids)));
         var shareUrl = window.location.origin + '/#/coloring-book?w=' + encoded;
         if (navigator.share) {
           navigator.share({ title: 'كشكول ألوان من سِراج', url: shareUrl }).catch(function(){});
         } else {
           navigator.clipboard.writeText(shareUrl).then(function() {
             showToast('تم نسخ رابط الكشكول ✓ ابعتيله لنفسك على واتساب');
           });
         }
       });
     }

     // Checkout btn
     var coBtn = document.getElementById('btnColoringCheckout');
     if (coBtn) {
          coBtn.addEventListener('click', function() {
            var format = wrap.querySelector('input[name="cbFormat"]:checked').value;
            var coverTitle = '';
            var coverImg = '';
            if (format === 'book') {
              var coverInput = document.getElementById('cbCoverTitle');
              coverTitle = coverInput ? coverInput.value.trim() : '';
              var selectedCover = wrap.querySelector('input[name="cbCover"]:checked');
              coverImg = selectedCover ? selectedCover.value : '';
            }

            var pagesTotal = totalPages * pricePer;
            var total = format === 'book' ? pagesTotal + coverPriceVal : pagesTotal;
            var itemName = format === 'book'
              ? 'كشكول ألوان سِراج (' + toArabicNum(totalPages) + ' ورقة)' + (coverTitle ? ' — ' + coverTitle : '')
              : 'ورق تلوين مطبوع (' + toArabicNum(totalPages) + ' ورقة)';

            var workbookItem = {
              slug: 'coloring-workbook',
              name: itemName,
              price: total,
              qty: 1,
              media: { type: 'book3d', bg: 'emerald' },
              coloringDetails: {
                itemCount: totalPages,
                format: format,
                coverTitle: coverTitle,
                coverImage: coverImg,
                items: coloringCart.map(function(c) { return c._id; })
              }
            };
            
            // Remove existing coloring workbook in cart if any, then add new
            var existingIdx = cart.findIndex(function(c) { return c.slug === 'coloring-workbook'; });
            if (existingIdx > -1) cart.splice(existingIdx, 1);
            
            cart.push(workbookItem);
            saveCart();
            updateCartBadge();
            showToast('اتضاف للسلة ✓');
            window.location.hash = '#/cart';
        });
     }
  }


  // ----- Init -----
  window.addEventListener('DOMContentLoaded', function () {
    loadColoringCart();
    attachColoringListeners();
    loadCart();
    updateCartBadge();
    fetchProducts();
    fetchConfig();
    fetchSiteContent();
    fetchTestimonials();
    if (!location.hash) location.hash = '#/home';
    // Wait for products API to resolve before first render to avoid flash
    var waitForProducts = setInterval(function () {
      if (productsReady) {
        clearInterval(waitForProducts);
        populateCatalog();
        handleRoute();
        initReveals();
        initCounter();
        initZigzagVideos();
      }
    }, 50);
    // Safety timeout: render with fallback data after 2s even if API hasn't responded
    setTimeout(function () {
      clearInterval(waitForProducts);
      if (!productsReady) {
        productsReady = true;
        populateCatalog();
        handleRoute();
        initReveals();
        initCounter();
        initZigzagVideos();
      }
    }, 2000);
  });

  if (document.readyState !== 'loading') {
    initHeroVideo();
  } else {
    document.addEventListener('DOMContentLoaded', initHeroVideo);
  }

})();
