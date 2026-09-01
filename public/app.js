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
  var COUPON_KEY = 'seraj-applied-coupon';
  var PENDING_PROMO_KEY = 'seraj-promo-code';
  var PROMO_DISMISSED_KEY = 'seraj-promo-dismissed-at';
  var PROMO_DISMISS_MS = 7 * 24 * 60 * 60 * 1000;
  var PRODUCTS_CACHE_KEY = 'seraj-products-cache-v1';
  var PRODUCTS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
  var SHIPPING_FEE = 35; // fallback — overridden by /api/config
  var FREE_SHIPPING_ABOVE = 500; // fallback — overridden by /api/config
  var appliedCoupon = null;
  var CHECKOUT_CONTINUE_TEXT = 'كمل تسوق';
  var CHECKOUT_DELIVERY_TEXT = 'عادةً الطلب بيوصل خلال 5 إلى 7 أيام عمل.';

  var DEPOSIT_ENABLED = true;       // overridden by /api/config
  var DEPOSIT_PERCENT = 60;          // overridden by /api/config
  var paymentMode = 'full';          // 'full' | 'deposit' (chosen on checkout page)

  // ----- Cloudinary Config -----
  var CLOUD_NAME = 'dkhndsrhr';
  var UPLOAD_PRESET = 'seraj-uploads';

  // ----- Wizard state (ephemeral) -----
  var state = {
    heroName: '',
    age: null,
    gender: null,
    challenge: null,
    customChallenge: '',
    language: 'ar',
    dedicationType: 'none',
    dedicationText: '',
    deliveryRecipientType: 'customer',
    recipientName: '',
    recipientPhone: '',
    recipientAddress: '',
    photoUrl: null,
    photoUrls: [],
    photoFile: null,
    photoFiles: [],
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
      features: ['٢٤ صفحة ملوّنة بجودة عالية', 'غلاف مقوّى مقاوم', 'رسوم أصلية مبهجة ومميزة', 'بتعلّم قيمة الشجاعة والإقدام', 'مناسبة من ٤ لـ ٩ سنين'],
      media: { type: 'book3d', image: 'assets/khaled-v2.png', title: 'خالد بن<br/>الوليد', bg: 'emerald' },
      action: 'cart',
      ctaText: 'أضيف للسلة',
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
      longDesc: 'مغامرة ملحمية من سلسلة سباق الفتوحات — قصة بطلنا اللي واجه المستحيل وقدره. رسوم أصلية مبهجة بتعلّم الأطفال معاني الثبات والإرادة.',
      features: ['٢٤ صفحة ملوّنة بجودة عالية', 'غلاف مقوّى مقاوم', 'رسوم أصلية مبهجة ومميزة', 'بتعلّم قيمة الإرادة والثبات', 'مناسبة من ٤ لـ ٩ سنين'],
      media: { type: 'book3d', image: 'assets/seraj.png', title: 'بطل قهر<br/>المستحيل', bg: 'emerald' },
      action: 'cart',
      ctaText: 'أضيف للسلة',
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
      longDesc: 'قصة مغامرة كاملة باسم بطلك وبتعلّم قيمة من اختيارك. سراج بيكتب القصة مخصوص ليه وبيرسمها برسومات أصلية مبهجة. غلاف مقوّى وورق سميك يستحمل كل مرات القراية.',
      features: ['٢٤ صفحة ملوّنة باسم طفلك', 'غلاف مقوّى مقاوم', 'رسوم أصلية مبهجة ومميزة', 'باسم طفلك على الغلاف والصفحات', 'اختار القيمة اللي عايزه يتعلمها'],
      media: { type: 'book3d', image: 'assets/seraj.png', title: 'حكاية<br/>بطلنا', bg: 'emerald' },
      action: 'wizard',
      ctaText: 'ابدأ القصة',
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
      badge: 'وفّر ٢٠٪',
      price: 420,
      originalPrice: 530,
      priceText: '٤٢٠ ج.م',
      originalPriceText: '٥٣٠ ج.م',
      category: 'مجموعات',
      section: null,
      shortDesc: 'قصة مخصصة + كروت + قصة من السلسلة',
      longDesc: 'المجموعة الكاملة لبطلنا! قصة مخصصة باسمه + كروت روتين يومي + قصة من سلسلة سباق الفتوحات. وفّر ٢٠٪ لما تطلبهم مع بعض!',
      features: ['قصة مخصصة باسم طفلك (٢٤ صفحة)', 'كروت الروتين اليومي (٣٠ كارت)', 'قصة من سلسلة سباق الفتوحات', 'غلاف مقوّى لكل المنتجات', 'بتوفّر ١١٠ جنيه!'],
      media: { type: 'bundle-stack', bg: 'teal' },
      action: 'cart',
      ctaText: 'أضيف للسلة',
      reviews: [
        { text: 'طلبت المجموعة الكاملة وأولادي ماخلصوش منها لحد دلوقتي! كل قرش يستاهل.', name: 'أمينة — أم توأم', place: 'القاهرة · ٥ سنين', color: '#c9974e', initial: 'أ' },
        { text: 'أحلى هدية لأحفادي! الجودة ممتازة والمحتوى تعليمي وممتع في نفس الوقت.', name: 'فاطمة — جدة', place: 'المنصورة · ٤ و ٦ سنين', color: '#6bbf3f', initial: 'ف' }
      ],
      related: ['story-khaled', 'custom-story']
    }
  };

  // Preload the real product photo and only then swap the static mockup
  // with the new <img> element. Reading the already-decoded image from the
  // browser cache makes the swap instant, so users never see an empty
  // container between the mockup disappearing and the image rendering.
  function swapMediaWithPhoto(mediaDiv, mockup, product) {
    var photoUrl = resolvePhotoUrl(product.imageUrl, product.media);
    if (!photoUrl) return;
    var optimized = cloudinaryUrl(photoUrl, 500);
    var replaced = false;
    function doSwap() {
      if (replaced) return;
      replaced = true;
      // Re-check the mockup is still attached — route changes may have
      // re-rendered the page while the image was loading.
      if (!mockup.isConnected) return;
      if (mediaDiv.querySelector('.product-photo')) return;
      mediaDiv.style.background = 'var(--cream-2)';
      mockup.outerHTML = renderMedia(product.media, false, product.imageUrl);
    }
    var img = new Image();
    img.src = optimized;
    if (typeof img.decode === 'function') {
      img.decode().then(doSwap, doSwap);
    } else if (img.complete) {
      doSwap();
    } else {
      img.onload = doSwap;
      img.onerror = doSwap;
    }
  }

  function getOrderedProductSlugs() {
    return Object.keys(PRODUCTS).sort(function(a, b) {
      return (PRODUCTS[a].order || 0) - (PRODUCTS[b].order || 0);
    });
  }

  function buildHomeProductCard(slug, product, index) {
    var isSoon = product.comingSoon || product.action === 'none';
    var media = product.media || { type: 'book3d', bg: 'emerald' };
    var bg = media.bg || 'emerald';
    var priceText = product.priceText || (toArabicNum(product.price || 0) + ' ج.م');
    var priceHTML = product.originalPriceText
      ? '<div class="price-group" style="display:flex;align-items:center;gap:6px"><span class="price old-price" style="text-decoration:line-through;color:var(--ink-mute);font-size:0.85em">' + product.originalPriceText + '</span><span class="price">' + priceText + '</span></div>'
      : '<span class="price">' + priceText + '</span>';
    var badgeClass = product.badgeSoon || isSoon ? ' soon-badge' : '';
    var badgeHTML = product.badge
      ? '<span class="badge' + badgeClass + '">' + escapeHtml(product.badge) + '</span>'
      : '';
    var soonOverlay = isSoon ? '<div class="soon-overlay">قريباً</div>' : '';
    var ctaHTML = isSoon
      ? '<span class="cta-mini soon-text">قريباً</span>'
      : '<span class="cta-mini">شوفها →</span>';
    var delay = (0.05 + (index * 0.07)).toFixed(2);
    var inner =
      '<div class="product-media ' + bg + '">' +
        badgeHTML +
        renderMedia(media, false, product.imageUrl) +
        soonOverlay +
      '</div>' +
      '<div class="product-body">' +
        '<h3>' + escapeHtml(product.name || '') + '</h3>' +
        '<p>' + escapeHtml(product.shortDesc || product.longDesc || '') + '</p>' +
        '<div class="product-foot">' + priceHTML + ctaHTML + '</div>' +
      '</div>';

    if (isSoon) {
      return '<div class="product-card coming-soon reveal" data-home-product="' + slug + '" style="--d:' + delay + 's">' + inner + '</div>';
    }

    return '<a href="#/product/' + slug + '" data-link class="product-card reveal" data-home-product="' + slug + '" style="--d:' + delay + 's">' + inner + '</a>';
  }

  function renderHomeProductsPreview() {
    var grid = document.getElementById('homeProductsGrid');
    if (!grid) return;
    if (!productsLoaded) return;

    var slugs = getOrderedProductSlugs().filter(function(slug) {
      var product = PRODUCTS[slug];
      return product && product.active !== false;
    }).slice(0, 8); // show up to 8 products in the horizontal strip

    if (!slugs.length) return;

    var html = slugs.map(function(slug, index) {
      return buildHomeProductCard(slug, PRODUCTS[slug], index);
    }).join('');

    html += '<a href="#/products" data-link class="product-card reveal is-visible" style="display:flex; align-items:center; justify-content:center; background:var(--cream-1); text-decoration:none; border:2px dashed var(--ink); box-shadow:none;">';
    html += '<div style="text-align:center; padding:12px; color:var(--ink); font-weight:bold;">';
    html += '<span style="font-size:24px; display:block; margin-bottom:8px;">➔</span>';
    html += 'باقي المنتجات';
    html += '</div></a>';

    grid.innerHTML = html;
    
    // CRITICAL: Immediately make product cards visible.
    // Do NOT rely on IntersectionObserver for the product grid — it is the
    // most important content on the page and must render instantly. Previous
    // bugs were caused by initReveals() running before the page had
    // .is-active, leaving cards at opacity:0 forever.
    var cards = grid.querySelectorAll('.reveal');
    for (var i = 0; i < cards.length; i++) {
      cards[i].classList.add('is-visible');
    }
  }

  // ----- Dynamic Price & Image Update -----
  function updateDOMPrices() {
    updateStaticWizardLinks();
    var cards = document.querySelectorAll('.product-card');
    cards.forEach(function (card) {
      if (card.classList.contains('coming-soon')) return;
      var slug = null;
      var href = card.getAttribute('href');
      if (href) {
        if (href.indexOf('#/product/') === 0) slug = href.replace('#/product/', '');
        else if (href === '#/wizard') slug = getWizardSlug();
      }
      if (slug && PRODUCTS[slug]) {
        var p = PRODUCTS[slug];
        // Hide card if product is marked inactive (admin soft-delete)
        if (p.active === false) { card.style.display = 'none'; return; }
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
        // Replace CSS mockup with real product image when available.
        // Preload & decode the image BEFORE swapping to avoid the empty-container
        // flicker that caused images to "change" between refreshes.
        var photoUrl = resolvePhotoUrl(p.imageUrl, p.media);
        if (photoUrl) {
          var mediaDiv = card.querySelector('.product-media');
          if (mediaDiv) {
            var mockup = mediaDiv.querySelector('.book3d, .cards-fan, .bundle-stack');
            var existing = mediaDiv.querySelector('.product-photo');
            if (mockup && !existing) {
              swapMediaWithPhoto(mediaDiv, mockup, p);
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

  function mergeApiProducts(list) {
    var merged = {};
    list.forEach(function (p) {
      var fallback = PRODUCTS[p.slug];
      if (!fallback) {
        for (var key in PRODUCTS) {
          if (PRODUCTS[key] && PRODUCTS[key].action === p.action && p.action !== 'cart') {
            fallback = PRODUCTS[key];
            break;
          }
        }
      }
      fallback = fallback || {};
      p.media = p.media || fallback.media || { bg: 'emerald' };
      p.features = p.features && p.features.length > 0 ? p.features : fallback.features || [];
      p.reviews = p.reviews && p.reviews.length > 0 ? p.reviews : fallback.reviews || [];
      p.gallery = p.gallery && p.gallery.length > 0 ? p.gallery : fallback.gallery || [];
      p.action = p.action || fallback.action || 'cart';
      p.imageUrl = p.imageUrl || fallback.imageUrl;
      merged[p.slug] = p;
    });
    return merged;
  }

  // Hydrate PRODUCTS synchronously from localStorage so returning visitors
  // render real product images on first paint — avoiding the mockup → photo
  // flicker they used to see on every refresh.
  function hydrateProductsFromCache() {
    try {
      var raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
      if (!raw) return false;
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.data) || parsed.data.length === 0) return false;
      if (typeof parsed.ts === 'number' && (Date.now() - parsed.ts) > PRODUCTS_CACHE_TTL_MS) return false;
      PRODUCTS = mergeApiProducts(parsed.data);
      productsLoaded = true;
      return true;
    } catch (e) {
      return false;
    }
  }

  function fetchProducts() {
    fetch('/api/products')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success && data.data && data.data.length > 0) {
          PRODUCTS = mergeApiProducts(data.data);
          try {
            localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify({
              ts: Date.now(),
              data: data.data
            }));
          } catch (e) { /* quota — silent */ }
          console.log('✅ Products loaded from API (' + data.data.length + ')');
        } else {
          console.warn('⚠️ API returned no products, using fallback products');
        }
      })
      .catch(function () {
        console.warn('⚠️ API fetch failed, using fallback products');
      })
      .finally(function () {
        productsLoaded = true;
        productsReady = true;
        renderHomeProductsPreview();
        populateCatalog();
        updateDOMPrices();
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
          if (data.data.checkoutContinueShoppingText) CHECKOUT_CONTINUE_TEXT = data.data.checkoutContinueShoppingText;
          if (data.data.checkoutDeliveryEstimateText) CHECKOUT_DELIVERY_TEXT = data.data.checkoutDeliveryEstimateText;

          if (typeof data.data.depositEnabled === 'boolean') DEPOSIT_ENABLED = data.data.depositEnabled;
          if (typeof data.data.depositPercent === 'number') DEPOSIT_PERCENT = data.data.depositPercent;
          showFreeShipBanner();
          console.log('✅ Config loaded from API');
        }
      })
      .catch(function () {
        console.warn('⚠️ Config fetch failed, using fallback values');
        showFreeShipBanner();
      });
  }

  // ----- Cart State -----
  // Each item: { slug, name, price, qty }
  var cart = [];

  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* silent */ }
    if (appliedCoupon) clearAppliedCoupon();
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

  function saveAppliedCoupon() {
    try { localStorage.setItem(COUPON_KEY, JSON.stringify(appliedCoupon)); } catch (e) { /* silent */ }
  }

  function loadAppliedCoupon() {
    try {
      var saved = localStorage.getItem(COUPON_KEY);
      appliedCoupon = saved ? JSON.parse(saved) : null;
    } catch (e) { appliedCoupon = null; }
  }

  function clearAppliedCoupon() {
    appliedCoupon = null;
    try { localStorage.removeItem(COUPON_KEY); } catch (e) { /* silent */ }
  }

  function getPendingPromoCode() {
    try { return localStorage.getItem(PENDING_PROMO_KEY) || ''; } catch (e) { return ''; }
  }

  function savePendingPromoCode(code) {
    try { localStorage.setItem(PENDING_PROMO_KEY, code); } catch (e) { /* silent */ }
  }

  function clearPendingPromoCode() {
    try { localStorage.removeItem(PENDING_PROMO_KEY); } catch (e) { /* silent */ }
  }

  function getCurrentCoupon(subtotal, shippingFee) {
    if (!appliedCoupon) return null;
    if (appliedCoupon.subtotal !== subtotal || appliedCoupon.shippingFee !== shippingFee) {
      clearAppliedCoupon();
      return null;
    }
    return appliedCoupon;
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
        gender: state.gender,
        challenge: state.challenge || '',
        customChallenge: state.customChallenge || '',
        language: 'ar',
        dedicationType: state.dedicationType || 'none',
        dedicationText: state.dedicationText || '',
        deliveryRecipientType: state.deliveryRecipientType || 'customer',
        recipientName: state.recipientName || '',
        recipientPhone: state.recipientPhone || '',
        recipientAddress: state.recipientAddress || '',
        photoUrl: state.photoUrl || null,
        photoUrls: state.photoUrls || [],
        wizardStep: state.wizardStep
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

  function renderShippingProgress(subtotal) {
    if (FREE_SHIPPING_ABOVE <= 0) return '';
    var remaining = FREE_SHIPPING_ABOVE - subtotal;
    if (remaining <= 0) {
      return '<div class="ship-progress"><div class="ship-progress-done">🎉 الشحن مجاني! نيالك ✦</div></div>';
    }
    var pct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_ABOVE) * 100));
    return '<div class="ship-progress">' +
      '<div class="ship-progress-text">فاوتي بـ <b>' + toArabicNum(remaining) + ' ج.م</b> والشحن يجي مجاني!</div>' +
      '<div class="ship-progress-bar"><div class="ship-progress-fill" style="width:' + pct + '%"></div></div>' +
      '</div>';
  }

  function showFreeShipBanner() {
    var banner = document.getElementById('freeShipBanner');
    var text = document.getElementById('freeShipText');
    if (!banner || FREE_SHIPPING_ABOVE <= 0) return;
    text.textContent = 'شحن مجاني للطلبات فوق ' + toArabicNum(FREE_SHIPPING_ABOVE) + ' ج.م ✦';
    banner.hidden = false;
  }

  function cartItemCount() {
    var count = 0;
    cart.forEach(function (item) { count += item.qty; });
    return count;
  }

  function getWizardSlug() {
    for (var key in PRODUCTS) {
      if (PRODUCTS[key] && PRODUCTS[key].action === 'wizard') {
        return key;
      }
    }
    return 'custom-story';
  }

  function updateStaticWizardLinks() {
    var wizardSlug = getWizardSlug();
    if (!wizardSlug) return;
    var links = document.querySelectorAll('a[href="#/product/custom-story"]');
    links.forEach(function (link) {
      link.setAttribute('href', '#/product/' + wizardSlug);
    });
  }

  function isCustomStory(slug) {
    return slug === getWizardSlug();
  }

  function toArabicNum(n) {
    var digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(n).replace(/[0-9]/g, function (d) { return digits[+d]; });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ----- Product Detail Rendering -----
  function renderProductDetail(slug) {
    if (slug === 'custom-story' && !PRODUCTS['custom-story']) {
      var wSlug = getWizardSlug();
      if (wSlug && PRODUCTS[wSlug]) {
        slug = wSlug;
      }
    }
    var container = document.getElementById('productDetail');
    if (!container) return;
    var product = PRODUCTS[slug];
    if (!product || product.active === false) {
      container.innerHTML = '<div class="page-head tight"><span class="kicker">المنتج غير موجود</span><h1>منتهي!</h1><p>المنتج ده مش موجود. شوف منتجاتنا التانية.</p><a href="#/products" data-link class="btn btn-primary" style="margin-top:20px">شوف المنتجات</a></div>';
      return;
    }

    // Dynamic SEO
    document.title = product.name + ' | سراج';
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', product.longDesc || '');

    // Dynamic Open Graph for shareable product links
    function setMetaProp(prop, value) {
      var el = document.querySelector('meta[property="' + prop + '"]');
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', prop);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value || '');
    }
    var ogTitle = product.name + ' — سِراج';
    var ogImage = resolvePhotoUrl(product.imageUrl, product.media) ||
      window.location.origin + '/assets/social-card-1200x630.webp';
    setMetaProp('og:title', ogTitle);
    setMetaProp('og:description', product.shortDesc || product.longDesc || '');
    setMetaProp('og:image', ogImage);
    setMetaProp('og:url', window.location.origin + '/product/' + encodeURIComponent(slug));
    setMetaProp('og:type', 'product');

    // Inject Product JSON-LD so Google's product rich-result
    // (price, availability, brand, image) can show on the SERP.
    var oldLd = document.getElementById('seraj-product-jsonld');
    if (oldLd) oldLd.parentNode.removeChild(oldLd);
    try {
      var ld = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: (product.shortDesc || product.longDesc || '').slice(0, 500),
        image: ogImage,
        brand: { '@type': 'Brand', name: 'سِراج' },
        offers: {
          '@type': 'Offer',
          url: window.location.origin + '/product/' + encodeURIComponent(slug),
          priceCurrency: 'EGP',
          price: String(product.price),
          availability: product.comingSoon
            ? 'https://schema.org/PreOrder'
            : 'https://schema.org/InStock'
        }
      };
      var s = document.createElement('script');
      s.id = 'seraj-product-jsonld';
      s.type = 'application/ld+json';
      // JSON.stringify doesn't escape forward slashes, so a product field
      // containing "</script>" would break out of this tag. Escape it.
      s.text = JSON.stringify(ld).replace(/<\//g, '<\\/');
      document.head.appendChild(s);
    } catch (e) { /* ignore — SEO enhancement only */ }

    var isSoon = product.comingSoon;
    var h = '';
    // Back nav
    h += '<div class="pd-topnav">';
    h += '<a href="#/products" data-link class="icon-btn"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M10 6l-6 6 6 6M4 12h16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></a>';
    h += '<span class="pd-nav-label">منتجات سِراج</span>';
    h += '<button class="pd-share-btn" onclick="window.shareProduct(\'' + slug + '\', \'' + escapeHtml(product.name).replace(/\'/g, "\\\\\'" ) + '\')"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> شارك</button></div>';
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
      h += '<div class="pd-actions">';
      h += '<button class="btn btn-buy-now btn-xl" data-buy-now="' + slug + '">اشتري الآن <svg viewBox="0 0 24 24" width="20" height="20"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
      h += '<button class="btn btn-add-cart btn-xl" data-add-cart="' + slug + '">' + product.ctaText + ' <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg></button>';
      h += '</div>';

    }
    h += '</div></div></div>';

    // Gallery — only items uploaded by the admin into product.gallery. The main
    // product image (product.imageUrl) is already shown in the hero above and is
    // intentionally NOT auto-prepended here, so the admin has full control over
    // what appears in the gallery and in what order.
    var galleryImages = [];
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
      h += '<section class="section pd-gallery-section"><div class="section-head"><span class="kicker">معرض المنتج</span><h2>شوف المنتج بالتفصيل</h2></div>';
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
    // Reviews section removed.
    // ===== Custom Story: Relocated sections from homepage =====
    if (product && product.action === 'wizard') {
      // Social proof removed

      // How it works — zig-zag
      h += '<section class="section zigzag-section" id="how-it-works">';
      h += '<header class="section-head reveal">';
      h += '<span class="kicker">٣ خطوات بس</span>';
      h += '<h2>إزاي سراج بيعمل قصة بصورة ابنك؟</h2>';
      h += '</header>';
      // Step 1
      h += '<article class="zz-row reveal" style="--d:.05s">';
      h += '<div class="zz-media"><div class="zz-video-wrap">';
      h += '<video class="zz-video" data-src="assets/1-.mp4" muted loop playsinline preload="none" poster="assets/seraj.webp" aria-label="الخطوة ١"></video>';
      h += '</div></div>';
      h += '<div class="zz-text"><span class="zz-num">١</span>';
      h += '<h3>قول لسراج اسم بطلنا وسنه</h3>';
      h += '<p>ادخل اسم طفلك وسنّه، واختار القيمة اللي عايزه يتعلمها.. وسراج هيبدأ الشغل.</p>';
      h += '</div></article>';
      // Step 2
      h += '<article class="zz-row zz-reversed reveal" style="--d:.1s">';
      h += '<div class="zz-media"><div class="zz-video-wrap">';
      h += '<video class="zz-video" data-src="assets/2.mp4" muted loop playsinline preload="none" poster="assets/seraj.webp" aria-label="الخطوة ٢"></video>';
      h += '</div></div>';
      h += '<div class="zz-text"><span class="zz-num">٢</span>';
      h += '<h3>سراج هيدخل ورشه السحرية يكتب ويرسم القصة مخصوص ليه</h3>';
      h += '<p>في الورشة، سراج بيكتب القصة باسم بطلك ويرسمها برسومات أصلية مبهجة.. كل حاجة مخصوصة.</p>';
      h += '</div></article>';
      // Step 3
      h += '<article class="zz-row reveal" style="--d:.15s">';
      h += '<div class="zz-media"><div class="zz-video-wrap">';
      h += '<video class="zz-video" data-src="assets/3.mp4" muted loop playsinline preload="none" poster="assets/seraj.webp" aria-label="الخطوة ٣"></video>';
      h += '</div></div>';
      h += '<div class="zz-text"><span class="zz-num">٣</span>';
      h += '<h3>القصة هتجيلك مطبوعة بجودة عالية لحد باب البيت</h3>';
      h += '<p>القصة بتتطبع بجودة عالية وتوصلك لحد باب البيت.</p>';
      h += '</div></article>';
      h += '<div class="zz-cta reveal" style="--d:.2s">';
      h += '<a href="#/wizard" data-link class="btn btn-primary"><span>يلا نبدأ الحكاية</span>';
      h += '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M14 6l-6 6 6 6" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></a></div>';
      h += '</section>';

      // Values
      h += '<section class="section values-section">';
      h += '<header class="section-head reveal">';
      h += '<span class="kicker">القيم اللي هيتعلمها</span>';
      h += '<h2>اختار القيمة اللي بطلنا محتاجها النهاردة</h2>';
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
      h += '<img src="assets/seraj.webp" class="ribbon-mascot" alt="سِراج" loading="lazy"/>';
      h += '<div class="ribbon-copy">';
      h += '<h2>مستني إيه؟ خلّي بطلنا يبدأ حكايته النهاردة!</h2>';
      h += '<p>بس ٣ خطوات صغيرة، وسِراج هيقعد يشتغل في الورشة</p>';
      h += '</div>';
      h += '<a href="#/wizard" data-link class="btn btn-primary btn-xl">اصنع قصة لابنك';
      h += '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M14 6l-6 6 6 6" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></a>';
      h += '</div></section>';
    }

    // Related
    var relatedSlugs = (product.related || []).slice();
    // Fill up to 4 items from other active products if manually defined list is short
    if (relatedSlugs.length < 4) {
      var allSlugs = Object.keys(PRODUCTS);
      for (var sIdx = 0; sIdx < allSlugs.length; sIdx++) {
        var potentialSlug = allSlugs[sIdx];
        if (potentialSlug !== slug && 
            PRODUCTS[potentialSlug].active !== false && 
            relatedSlugs.indexOf(potentialSlug) === -1) {
          relatedSlugs.push(potentialSlug);
          if (relatedSlugs.length >= 4) break;
        }
      }
    }

    var hasRelated = false;
    for (var rIdx = 0; rIdx < relatedSlugs.length; rIdx++) {
      var checkRp = PRODUCTS[relatedSlugs[rIdx]];
      if (checkRp && checkRp.active !== false && relatedSlugs[rIdx] !== slug) {
        hasRelated = true;
        break;
      }
    }

    if (hasRelated) {
      h += '<section class="section pd-related-section">';
      h += '  <div class="section-head">';
      h += '    <span class="kicker">هيعجب بطلنا كمان</span>';
      h += '    <h2>منتجات مقترحة</h2>';
      h += '  </div>';
      h += '  <div class="pd-related-strip">';
      h += '    <div class="pd-related-scroll">';
      
      for (var p = 0; p < relatedSlugs.length; p++) {
        var rs = relatedSlugs[p], rp = PRODUCTS[rs];
        if (!rp || rp.active === false || rs === slug) continue;
        var href = rp.action === 'wizard' ? '#/wizard' : '#/product/' + rs;
        var rpPrice = rp.priceText || (toArabicNum(rp.price) + ' ج.م');
        var bgClass = rp.media.bg === 'emerald' ? 'emerald-bg' : rp.media.bg === 'sand' ? 'sand-bg' : 'teal-bg';
        
        h += '<div class="pd-related-card">';
        h += '  <a href="' + href + '" data-link class="pd-related-img-wrap ' + bgClass + '">';
        h += '    ' + renderMedia(rp.media, false, rp.imageUrl);
        h += '  </a>';
        h += '  <div class="pd-related-info">';
        h += '    <a href="' + href + '" data-link><h3>' + rp.name + '</h3></a>';
        h += '    <div class="pd-related-foot">';
        h += '      <span class="price">' + rpPrice + '</span>';
        if (rp.action === 'wizard') {
          h += '      <a href="#/wizard" data-link class="btn-quick-add" title="ابدأ القصة"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></a>';
        } else {
          h += '      <button type="button" class="btn-quick-add" onclick="window.quickAddRelated(\'' + rs + '\')" title="ضيف للسلة"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg></button>';
        }
        h += '    </div>';
        h += '  </div>';
        h += '</div>';
      }
      
      h += '    </div>';
      h += '  </div>';
      h += '</section>';
    }
    container.innerHTML = h;
    setTimeout(initReveals, 100);
    initProductGallery(container);
    // Re-init zigzag videos and counter for custom-story page
    if (product && product.action === 'wizard') {
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
  // To use your own section images, add files at: assets/catalog-tales.webp, etc.
  var CATALOG_META = {
    'all':            { title: 'كل العوالم',           kicker: 'اكتشفي عالم سراج المتنوع',     desc: 'أكتر من قصص.. تجربة تعليمية متكاملة لبطلنا الصغير',    color: '#c9974e', img: 'assets/catagory/catalog-all.webp' },
    'tales':          { title: 'سباق الفتوحات',         kicker: 'أبطالنا الحقيقيين!',            desc: 'أبطالنا بجد! مستويات تناسب كل الأعمار مع جزء خاص لتجهيز الأب والأم لأسئلة طفلك.',   color: '#36a39a', img: 'assets/catagory/catalog-tales.webp' },
    'custom-stories': { title: 'قصة مخصوصة',  kicker: 'باسم وصورة طفلك!',          desc: 'هدية عمره ما هينساها.. قصة تفاعلية ممتعة ومطبوعة بجودة عالية بطلها طفلك!',           color: '#c9974e', img: 'assets/catagory/catalog-custom-stories.webp' },
    'play-learn':     { title: 'ألعاب سراج',      kicker: 'العب واتعلم!',         desc: 'فلاش كاردز وألعاب ترفيهية بتنمي مهارات طفلك وتخليه يكتشف العالم وهو بيضحك ومبسوط.',           color: '#e85d4c', img: 'assets/catagory/catalog-play-learn.webp' },
    'bundle':         { title: 'بوكسات ومجموعات',  kicker: 'اختيارات جاهزة للهدايا والأنشطة', desc: 'مجموعات خارج عوالم سراج تجمع قصص وأنشطة وبازل في تجربة واحدة سهلة الشراء.',      color: '#36a39a', img: 'assets/catagory/catalog-all.webp' },
    'seraj-stories':  { title: 'حكايات سراج',    kicker: 'الأرنب المسافر عبر الزمن!', desc: 'رحلات مثيرة مع آلة الزمن لاكتشاف أسرار الماضي مع الأرنب سِراج وأصحابه.',        color: '#6bbf3f', img: 'assets/catagory/catalog-seraj-stories.webp' }
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
    var sortedSlugs = getOrderedProductSlugs();
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
        em.innerHTML =
          '<img src="assets/seraj.webp" alt="" class="empty-mascot" loading="lazy"/>' +
          '<h3>القسم ده لسه فاضي!</h3>' +
          '<p>بنحضّر حاجات حلوة للقسم ده — لحد ما يجهز، شوف اقتراحاتنا:</p>' +
          '<div class="empty-actions">' +
            '<a href="#/products" data-link class="btn btn-primary">كل المنتجات</a>' +
            '<a href="#/wizard" data-link class="btn btn-secondary">اصنع قصة مخصصة</a>' +
          '</div>';
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

  // Render up to 3 product suggestion cards for the cart page that the user
  // hasn't already added. Each card has a one-tap "أضيف" button that fires
  // the same data-add-cart handler the rest of the site uses.
  function renderCrossSellStrip() {
    var inCart = {};
    cart.forEach(function (it) { inCart[it.slug] = true; });

    var slugs = Object.keys(PRODUCTS).filter(function (s) {
      var p = PRODUCTS[s];
      if (!p || !p.price || p.comingSoon) return false;
      if (inCart[s]) return false;
      // Hide the wizard slug; users add custom story via the wizard, not a chip.
      if (p.action === 'wizard') return false;
      return true;
    });

    if (!slugs.length) return '';

    // Stable shuffle: pick first 3 after shuffling once per cart render.
    slugs.sort(function () { return Math.random() - 0.5; });
    var picks = slugs.slice(0, 3);

    var h = '<div class="cross-sell-strip">';
    h += '<h3 class="cross-sell-title">ممكن يعجبك كمان</h3>';
    h += '<div class="cross-sell-row">';
    picks.forEach(function (slug) {
      var p = PRODUCTS[slug];
      var photoUrl = resolvePhotoUrl(p.imageUrl, p.media);
      var img = photoUrl ? cloudinaryUrl(photoUrl, 200) : '';
      h += '<div class="cross-sell-card">';
      if (img) {
        h += '<a href="#/product/' + slug + '" data-link class="cs-thumb"><img src="' + img + '" alt="' + escapeHtml(p.name) + '" loading="lazy"/></a>';
      } else {
        h += '<a href="#/product/' + slug + '" data-link class="cs-thumb cs-thumb-fallback"></a>';
      }
      h += '<div class="cs-meta">';
      h += '<a href="#/product/' + slug + '" data-link class="cs-name">' + escapeHtml(p.name) + '</a>';
      h += '<span class="cs-price">' + toArabicNum(p.price) + ' ج.م</span>';
      h += '</div>';
      h += '<button class="cs-add" data-add-cart="' + slug + '" aria-label="أضيف ' + escapeHtml(p.name) + ' للسلة">+ أضيف</button>';
      h += '</div>';
    });
    h += '</div></div>';
    return h;
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
        '<p>مفيش منتجات في السلة دلوقتي.. شوف منتجاتنا الحلوة!</p>' +
        '<a href="#/products" data-link class="btn btn-primary btn-xl">شوف المنتجات</a>' +
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

    // Free shipping progress
    h += renderShippingProgress(total);

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

    // Cross-sell: surface up to 3 products not already in cart.
    h += renderCrossSellStrip();

    h += '<a href="#/checkout" data-link class="btn btn-primary btn-xl btn-fullrow" style="margin-top:24px">إتمام الطلب</a>';
    h += '<a href="#/products" data-link class="btn btn-ghost btn-fullrow" style="margin-top:8px">' + escapeHtml(CHECKOUT_CONTINUE_TEXT) + '</a>';

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
        '<a href="#/products" data-link class="btn btn-primary btn-xl">شوف المنتجات</a>' +
        '</div>';
      return;
    }

    var total = calculateTotal();
    var shipping = getShippingFee(total);
    var currentCoupon = getCurrentCoupon(total, shipping);
    var pendingPromoCode = currentCoupon ? '' : getPendingPromoCode();
    var discount = currentCoupon ? currentCoupon.discountTotal : 0;
    var grandTotal = Math.max(0, total + shipping - discount);
    var checkoutStory = loadWizardData();
    var deliversToAnotherPerson = checkoutStory && checkoutStory.deliveryRecipientType === 'other';
    var savedDeliveryAddress = deliversToAnotherPerson ? checkoutStory.recipientAddress || '' : '';

    var h = '';

    // Order summary
    h += '<div class="checkout-summary">';
    h += '<h3 style="font-size:18px;margin-bottom:16px;">ملخص الطلب</h3>';
    cart.forEach(function (item, idx) {
      var product = PRODUCTS[item.slug];
      var bgClass = product && product.media ? (product.media.bg === 'emerald' ? 'emerald-bg' : product.media.bg === 'sand' ? 'sand-bg' : 'teal-bg') : '';
      h += '<div class="cart-item" style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">';
      h += '<div style="display:flex; align-items:center; gap:12px;">';
      if (product && product.media) {
        h += '<div class="cart-item-media ' + bgClass + '" style="width:48px;height:48px;min-width:48px">' + renderCartMedia(product.media, product.imageUrl) + '</div>';
      }
      h += '<div class="cart-item-info"><h3 style="font-size:14px">' + item.name;
      if (item.qty > 1) h += ' × ' + toArabicNum(item.qty);
      h += '</h3>';
      h += '<span class="price" style="font-size:16px">' + toArabicNum(item.price * item.qty) + ' ج.م</span>';
      h += '</div></div>';
      h += '<button type="button" class="btn btn-ghost" style="padding:4px 8px; color:var(--ember); font-size:18px; line-height:1;" onclick="window.removeCheckoutItem(' + idx + ')" aria-label="حذف المنتج">✕</button>';
      h += '</div>';
    });
    h += '<div class="cart-summary" style="margin-top:12px">';
    h += '<div class="cart-summary-row"><span>المجموع الفرعي</span><span>' + toArabicNum(total) + ' ج.م</span></div>';
    if (shipping === 0) {
      h += '<div class="cart-summary-row"><span>الشحن</span><span style="color:var(--seraj-dark);font-weight:700">مجاناً ✦</span></div>';
    } else {
      h += '<div class="cart-summary-row"><span>الشحن</span><span>' + toArabicNum(shipping) + ' ج.م</span></div>';
    }
    if (currentCoupon) {
      h += '<div class="cart-summary-row coupon-discount-row"><span>كوبون ' + currentCoupon.code + '</span><span>- ' + toArabicNum(discount) + ' ج.م</span></div>';
    }

    h += '<div class="cart-summary-row total"><span>الإجمالي</span><span>' + toArabicNum(grandTotal) + ' ج.م</span></div>';
    h += '</div>';
    if (CHECKOUT_DELIVERY_TEXT) {
      h += '<p class="checkout-delivery-note">' + escapeHtml(CHECKOUT_DELIVERY_TEXT) + '</p>';
    }
    h += '<details class="coupon-box" style="margin-bottom:12px; border:1px solid var(--line); border-radius:8px; padding:12px; background:var(--cream-2); cursor:pointer;">';
    h += '<summary style="font-weight:bold; color:var(--seraj); display:flex; justify-content:space-between; align-items:center; list-style:none;">';
    h += '<span>معاك كود خصم؟</span><span>▼</span>';
    h += '</summary>';
    h += '<div style="margin-top:12px; cursor:auto;">';
    h += '<label class="field">';
    h += '<div class="coupon-inline">';
    h += '<input type="text" id="couponCode" placeholder="SERAJ10" value="' + escapeHtml(currentCoupon ? currentCoupon.code : pendingPromoCode) + '" dir="ltr"/>';
    h += '<button type="button" id="applyCouponBtn" class="btn btn-ghost">تطبيق</button>';
    if (currentCoupon) h += '<button type="button" id="removeCouponBtn" class="coupon-remove">إزالة</button>';
    h += '</div></label>';
    h += '<p id="couponStatus" class="' + (currentCoupon ? 'coupon-status ok' : 'coupon-status') + '">' + (currentCoupon ? 'تم تطبيق الخصم بنجاح ✦' : 'اكتبي الكود واضغطي تطبيق قبل تأكيد الطلب.') + '</p>';
    h += '</div></details></div>';

    // Payment mode picker — full vs deposit. The full-payment option is the
    // visible default; the deposit option is a small link below so customers
    // who don't read carefully take the faster (full-pay) path.
    var canDeposit = depositAvailable();
    var depositAmt = canDeposit ? calculateDeposit() : 0;
    var remainingAmt = Math.max(0, grandTotal - depositAmt);
    var amountToPayNow = paymentMode === 'deposit' && canDeposit ? depositAmt : grandTotal;

    h += '<div class="pay-mode reveal">';
    h += '<label class="pay-mode-card ' + (paymentMode === 'full' ? 'is-active' : '') + '">';
    h += '<input type="radio" name="payMode" value="full"' + (paymentMode === 'full' ? ' checked' : '') + '/>';
    h += '<div class="pay-mode-body">';
    h += '<div class="pay-mode-title">💳 ادفع الكامل (' + toArabicNum(grandTotal) + ' ج.م)</div>';
    h += '<div class="pay-mode-sub">الأسرع — التوصيل ' + toArabicNum(2) + '–' + toArabicNum(5) + ' أيام</div>';
    h += '</div>';
    h += '<span class="pay-mode-badge">موصى به</span>';
    h += '</label>';
    if (canDeposit) {
      h += '<label class="pay-mode-card pay-mode-deposit ' + (paymentMode === 'deposit' ? 'is-active' : '') + '">';
      h += '<input type="radio" name="payMode" value="deposit"' + (paymentMode === 'deposit' ? ' checked' : '') + '/>';
      h += '<div class="pay-mode-body">';
      h += '<div class="pay-mode-title">ادفع عربون ' + toArabicNum(depositAmt) + ' ج.م</div>';
      h += '<div class="pay-mode-sub">والباقي ' + toArabicNum(remainingAmt) + ' ج.م كاش عند التوصيل</div>';
      h += '</div>';
      h += '</label>';
      if (paymentMode === 'deposit') {
        h += '<p class="pay-mode-note">⚠️ العربون لا يُردّ في حالة الإلغاء (رسوم تجهيز).</p>';
      }
    }
    h += '</div>';

    // InstaPay card — compact rectangular box
    h += '<div class="insta-card reveal" style="border:1.5px solid #6c3287; background:#faf5ff; border-radius:12px; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:20px; box-shadow:0 2px 8px rgba(108, 50, 135, 0.05);">';
    h += '<div style="display:flex; flex-direction:column; gap:6px;">';
    h += '<img src="https://www.instapay.eg/assets/images/logo.svg" alt="InstaPay" style="height:20px; object-fit:contain; margin-bottom:4px;" onerror="this.outerHTML=\'<strong style=\\\'color:#6c3287; font-size:15px;\\\'>InstaPay</strong>\'" />';
    h += '<p style="margin:0; font-size:12px; color:var(--ink-mute);">المبلغ المطلوب: <strong style="color:var(--ink); font-size:13px;">' + toArabicNum(amountToPayNow) + ' ج.م</strong></p>';
    h += '<div style="font-size:12px; font-weight:bold; color:#6c3287; cursor:pointer; display:inline-flex; align-items:center; gap:4px; padding:4px 8px; background:rgba(108,50,135,0.08); border-radius:6px; transition:all 0.2s;" onclick="navigator.clipboard.writeText(\'' + INSTAPAY_NUMBER + '\').then(()=>alert(\'تم نسخ رقم انستا باي بنجاح\'))" title="انسخ الرقم"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> <span style="user-select:all;">' + INSTAPAY_NUMBER + '</span></div>';
    h += '</div>';
    h += '<a href="' + INSTAPAY_LINK + '" target="_blank" rel="noopener" class="btn" style="background:#6c3287; color:#fff; border:none; padding:10px 20px; border-radius:8px; font-weight:bold; font-size:14px; text-decoration:none; display:inline-flex; align-items:center; gap:6px; flex-shrink:0; box-shadow:0 4px 12px rgba(108, 50, 135, 0.2); transition:all 0.2s;">';
    h += '<span>ادفع الآن</span> <span style="font-size:16px;">➔</span></a>';
    h += '</div>';

    // Customer form
    h += '<div class="checkout-form-section">';
    h += '<h3 style="font-size:18px;margin-bottom:16px">' + (deliversToAnotherPerson ? 'بيانات طالب القصة والتوصيل' : 'بيانات التوصيل') + '</h3>';
    if (deliversToAnotherPerson) {
      h += '<div class="checkout-recipient-summary"><strong>المستلم: ' + escapeHtml(checkoutStory.recipientName) + '</strong>' +
        '<span dir="ltr">' + escapeHtml(checkoutStory.recipientPhone) + '</span></div>';
    }
    h += '<form id="checkoutForm" class="checkout-form" onsubmit="return false">';
    h += '<label class="field"><span>' + (deliversToAnotherPerson ? 'اسم طالب القصة' : 'الاسم') + ' <small style="color:var(--ember)">*</small></span>';
    h += '<input type="text" id="custName" required placeholder="الاسم بالكامل" autocomplete="name"/></label>';
    h += '<label class="field"><span>' + (deliversToAnotherPerson ? 'رقم موبايل طالب القصة' : 'رقم الموبايل') + ' (واتساب) <small style="color:var(--ember)">*</small></span>';
    h += '<div style="position:relative">';
    h += '<span style="position:absolute;left:16px;top:50%;transform:translateY(-50%);font-size:14px;color:var(--ink-mute);font-weight:600;pointer-events:none">🇪🇬</span>';
    h += '<input type="tel" id="custPhone" required pattern="01[0-9]{9}" placeholder="01xxxxxxxxx" autocomplete="tel" dir="ltr" style="text-align:left;padding-left:48px"/>';
    h += '</div></label>';
    h += '<label class="field" style="margin-top:16px;"><span>' + (deliversToAnotherPerson ? 'عنوان توصيل القصة' : 'العنوان') + ' <small style="color:var(--ember)">*</small></span>';
    h += '<textarea id="custAddress" required placeholder="العنوان بالتفصيل: المدينة، المنطقة، الشارع..." rows="2">' + escapeHtml(savedDeliveryAddress) + '</textarea></label>';
    h += '<label class="field"><span>ملاحظات <small style="color:var(--ink-mute)">(اختياري)</small></span>';
    h += '<textarea id="custNotes" placeholder="أي ملاحظات تانية..." rows="2"></textarea></label>';
    h += '</form></div>';

    // Submit button
    h += '<button id="submitOrderBtn" class="btn btn-primary btn-xl btn-fullrow" style="margin-top:20px">';
    h += 'تأكيد الطلب</button>';

    container.innerHTML = h;
    setTimeout(initReveals, 60);
    if (pendingPromoCode && !pendingCouponApplying) {
      setTimeout(function () { applyCouponCode(pendingPromoCode); }, 80);
    }
  }

  var pendingCouponApplying = false;
  function applyCouponCode(codeOverride) {
    var input = document.getElementById('couponCode');
    var status = document.getElementById('couponStatus');
    var phoneEl = document.getElementById('custPhone');
    var code = codeOverride || (input ? input.value.trim() : '');
    if (!code) {
      if (status) status.textContent = 'اكتبي كود الخصم الأول.';
      return;
    }

    var subtotal = calculateTotal();
    var shipping = getShippingFee(subtotal);
    var payload = {
      code: code,
      shippingFee: shipping,
      customerPhone: phoneEl && /^01[0-9]{9}$/.test(phoneEl.value.trim()) ? phoneEl.value.trim() : undefined,
      items: cart.map(function (item) {
        return {
          productSlug: item.slug,
          qty: item.qty,
          price: item.price
        };
      })
    };

    var btn = document.getElementById('applyCouponBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'جاري...';
    }
    if (codeOverride) pendingCouponApplying = true;
    if (status) status.textContent = 'بنراجع الكود...';

    fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.success || !data.data) {
          throw new Error(data.error || 'الكوبون غير صالح');
        }
        appliedCoupon = data.data;
        saveAppliedCoupon();
        clearPendingPromoCode();
        renderCheckoutPage();
        showToast('تم تطبيق الكوبون ✦');
      })
      .catch(function (err) {
        clearAppliedCoupon();
        if (codeOverride) clearPendingPromoCode();
        if (status) {
          status.textContent = err.message || 'الكوبون غير صالح';
          status.className = 'coupon-status error';
        }
        showToast(err.message || 'الكوبون غير صالح');
      })
      .finally(function () {
        pendingCouponApplying = false;
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'تطبيق';
        }
      });
  }

  // ----- Deposit calculator (mirrors server lib/depositCalc.ts) -----
  function calculateDeposit() {
    if (!DEPOSIT_ENABLED) return 0;
    var pct = Math.max(0, Math.min(100, Number(DEPOSIT_PERCENT) || 0));
    var total = 0;
    cart.forEach(function (item) {
      if (!isCustomStory(item.slug)) return; // Only calculate deposit for custom stories
      var qty = Math.max(1, Number(item.qty) || 1);
      var unit = Math.max(0, Number(item.price) || 0);
      var product = PRODUCTS[item.slug];
      var override =
        product && typeof product.depositAmount === 'number' && product.depositAmount > 0
          ? Math.min(product.depositAmount, unit)
          : null;
      var perUnit = override !== null ? override : (unit * pct) / 100;
      total += perUnit * qty;
    });
    return Math.max(0, Math.round(total));
  }

  function depositAvailable() {
    if (!DEPOSIT_ENABLED) return false;
    if (!cart || cart.length === 0) return false;
    var dep = calculateDeposit();
    if (dep <= 0) return false;
    var subtotal = calculateTotal();
    var shipping = getShippingFee(subtotal);
    var grand = Math.max(
      0,
      subtotal + shipping - (appliedCoupon ? appliedCoupon.discountTotal : 0)
    );
    return dep < grand;
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
    var currentCoupon = getCurrentCoupon(total, shipping);
    var grandTotal = Math.max(0, total + shipping - (currentCoupon ? currentCoupon.discountTotal : 0));

    var canDeposit = depositAvailable();
    var depositValue = paymentMode === 'deposit' && canDeposit ? calculateDeposit() : 0;

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
        return orderItem;
      }),
      total: grandTotal,
      shippingFee: shipping,
      couponCode: currentCoupon ? currentCoupon.code : undefined,
      deposit: depositValue,
      paymentMode: depositValue > 0 ? 'deposit' : 'full',
      paymentMethod: 'instapay'
    };

    // Include wizard/custom story data ONLY if custom-story is in the cart
    var hasCustomStory = cart.some(function (item) { return item.slug === getWizardSlug(); });
    var wizardData = loadWizardData();
    var hasWizardPhoto = wizardData && ((wizardData.photoUrls && wizardData.photoUrls.length) || wizardData.photoUrl);
    var recipientReady = wizardData && (wizardData.deliveryRecipientType !== 'other' || (wizardData.recipientName && /^01[0-9]{9}$/.test(wizardData.recipientPhone) && wizardData.recipientAddress));
    var storyReady = wizardData && wizardData.heroName && wizardData.age && wizardData.gender && wizardData.challenge && hasWizardPhoto && recipientReady;
    if (hasCustomStory && !storyReady) {
      showToast('كمّلي بيانات القصة وصورة بطلنا الأول ✦');
      location.hash = '#/wizard';
      return;
    }
    if (hasCustomStory && wizardData && wizardData.heroName) {
      var wizardAge = typeof wizardData.age === 'string' ? parseInt(wizardData.age, 10) : wizardData.age;
      orderData.customStory = {
        heroName: wizardData.heroName,
        age: wizardAge,
        gender: wizardData.gender,
        challenge: wizardData.challenge,
        customChallenge: wizardData.customChallenge || undefined,
        language: 'ar',
        dedicationType: wizardData.dedicationType || 'none',
        dedicationText: wizardData.dedicationText || undefined,
        deliveryRecipientType: wizardData.deliveryRecipientType || 'customer',
        recipientName: wizardData.deliveryRecipientType === 'other' ? wizardData.recipientName : undefined,
        recipientPhone: wizardData.deliveryRecipientType === 'other' ? wizardData.recipientPhone : undefined,
        recipientAddress: wizardData.deliveryRecipientType === 'other' ? addressEl.value.trim() : undefined,
        photoUrl: wizardData.photoUrl || undefined,
        photoUrls: wizardData.photoUrls || (wizardData.photoUrl ? [wizardData.photoUrl] : undefined)
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
              deposit: data.data.deposit,
              remaining: data.data.remaining,
              paymentMode: data.data.paymentMode || (data.data.deposit > 0 ? 'deposit' : 'full')
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
          var errorMsg = 'حصلت مشكلة، حاول تاني ✦';
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
        showToast(err.message || 'حصلت مشكلة، حاول تاني ✦');
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
    var depositInfoEl = document.getElementById('successDepositInfo');

    try {
      var saved = localStorage.getItem(ORDER_KEY);
      if (saved) {
        var orderData = JSON.parse(saved);
        if (orderNumEl && orderData.orderNumber) {
          orderNumEl.textContent = orderData.orderNumber;
        }
        var isDeposit = orderData.paymentMode === 'deposit' && Number(orderData.deposit) > 0;
        if (depositInfoEl) {
          if (isDeposit) {
            depositInfoEl.innerHTML =
              'دفعت <strong>' + toArabicNum(orderData.deposit) + ' ج.م</strong> عربون الآن — ' +
              'الباقي <strong>' + toArabicNum(orderData.remaining || 0) + ' ج.م</strong> كاش عند التوصيل.';
            depositInfoEl.hidden = false;
          } else {
            depositInfoEl.hidden = true;
          }
        }
        if (whatsappEl && orderData.orderNumber) {
          var baseMsg = isDeposit
            ? 'السلام عليكم، طلبي رقم ' + orderData.orderNumber +
              ' (دفعت عربون ' + orderData.deposit + ' ج.م — الباقي ' +
              (orderData.remaining || 0) + ' ج.م كاش عند التوصيل). ها هي صورة الإيصال.'
            : 'السلام عليكم، طلبي رقم ' + orderData.orderNumber + ' على متجر سراج. ها هي صورة الإيصال.';
          whatsappEl.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(baseMsg);
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

  document.addEventListener('click', function (e) {
    var applyBtn = e.target.closest('#applyCouponBtn');
    if (applyBtn && !applyBtn.disabled) {
      applyCouponCode();
      return;
    }

    var removeBtn = e.target.closest('#removeCouponBtn');
    if (removeBtn) {
      clearAppliedCoupon();
      renderCheckoutPage();
      showToast('تمت إزالة الكوبون');
    }
  });

  // Payment mode picker (full vs deposit) — re-render so InstaPay amount updates.
  // Preserves any data the user has already typed in the customer form, since
  // renderCheckoutPage() rebuilds the entire checkout DOM via innerHTML.
  document.addEventListener('change', function (e) {
    var radio = e.target.closest('input[name="payMode"]');
    if (!radio) return;
    paymentMode = radio.value === 'deposit' ? 'deposit' : 'full';

    var prev = {};
    ['custName', 'custPhone', 'custAddress', 'custNotes'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) prev[id] = el.value;
    });

    renderCheckoutPage();

    Object.keys(prev).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = prev[id];
    });
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

  function updateSerajChatVisibility(pageName) {
    var btn = document.getElementById('serajChatBtn');
    var win = document.getElementById('serajChatWindow');
    if (!btn || !win) return;

    var currentPage = pageName || parseRoute().page;
    var shouldHide = !CHAT_WIDGET_ENABLED || CHAT_HIDDEN_PAGES.indexOf(currentPage) !== -1;
    if (shouldHide) {
      if (typeof scState !== 'undefined' && scState) scState.open = false;
      win.hidden = true;
      btn.hidden = true;
      btn.style.display = 'none';
      return;
    }

    btn.hidden = false;
    btn.style.display = (typeof scState !== 'undefined' && scState && scState.open) ? 'none' : '';
  }

  // Valid page names for the SPA router
  var validPages = ['home', 'products', 'about', 'wizard', 'preview', 'checkout', 'success', 'cart', 'product', 'mama-world', 'article', 'faq', 'shipping', 'returns'];

  function showPage(name, sub) {
    var target = name;
    // Check if this is a valid page, if not show 404
    if (validPages.indexOf(name) === -1) {
      target = 'not-found';
      name = 'not-found';
    }


    pages.forEach(function (p) {
      var isActive = p.dataset.page === target;
      p.classList.toggle('is-active', isActive);
    });

    bottomTabs.forEach(function (a) {
      a.classList.toggle('is-active', a.dataset.tab === name);
    });

    var floatingWhatsApp = document.querySelector('.floating-wa');
    if (floatingWhatsApp) {
      floatingWhatsApp.hidden = ['wizard', 'checkout'].indexOf(name) !== -1;
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(initReveals, 80);

    var pageTitles = {
      'home': 'سِراج — قصص أطفال عربية مخصصة وألعاب تعليمية',
      'products': 'قصص وألعاب تعليمية للأطفال | سراج',
      'about': 'حكاية سراج | قصص أطفال عربية',
      'wizard': 'اصنع قصة مخصصة لطفلك | سراج',
      'cart': 'سلة المشتريات | سراج',
      'checkout': 'إتمام الطلب | سراج',
      'mama-world': 'عالم ماما وبابا | سراج',
      'article': 'عالم ماما وبابا | سراج',
      'faq': 'الأسئلة الشائعة | سراج',
      'shipping': 'سياسة الشحن | سراج',
      'returns': 'سياسة الاسترجاع | سراج'
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

    if (name === 'preview') {
      var heroName = state.heroName || 'بطلنا';
      var el = document.getElementById('previewName');
      if (el) el.textContent = heroName;
      renderStoryReview();
    }

    schedulePromotion();

  }

  function renderStoryReview() {
    var review = document.getElementById('storyReview');
    if (!review) return;
    var saved = loadWizardData();
    if (!saved) { review.innerHTML = ''; return; }
    var dedicationLabel = saved.dedicationText || 'بدون إهداء';
    var recipientLabel = saved.deliveryRecipientType === 'other'
      ? escapeHtml(saved.recipientName) + ' · ' + escapeHtml(saved.recipientPhone) + ' · ' + escapeHtml(saved.recipientAddress)
      : 'بيانات التوصيل تُستكمل في الطلب';
    var imageCount = saved.photoUrls && saved.photoUrls.length ? saved.photoUrls.length : (saved.photoUrl ? 1 : 0);
    review.innerHTML =
      '<div class="story-review-row"><span>بطل الحكاية</span><strong>' + escapeHtml(saved.heroName) + ' · ' + toArabicNum(saved.age) + ' سنوات · ' + (saved.gender === 'girl' ? 'بطلة' : 'بطل') + '</strong></div>' +
      '<div class="story-review-row"><span>القيمة</span><strong>' + escapeHtml(saved.challenge) + '</strong></div>' +
      '<div class="story-review-row"><span>الصور</span><strong>' + toArabicNum(imageCount) + ' صورة</strong></div>' +
      '<div class="story-review-row"><span>الإهداء</span><strong>' + escapeHtml(dedicationLabel) + '</strong></div>' +
      '<div class="story-review-row"><span>التوصيل</span><strong>' + recipientLabel + '</strong></div>' +
      '<button type="button" class="story-review-edit" data-edit-story>تعديل بيانات القصة</button>';
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
    if (!els.length) return;

    if (typeof IntersectionObserver === 'undefined') {
      els.forEach(function(el) { el.classList.add('is-visible'); });
      return;
    }

    try {
      if (!revealObserver) {
        revealObserver = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.1, rootMargin: '50px' }
        );
      }
      els.forEach(function (el) { revealObserver.observe(el); });
    } catch (e) {
      console.warn('IntersectionObserver error, falling back to visible', e);
      els.forEach(function(el) { el.classList.add('is-visible'); });
    }
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

  function restoreWizardState() {
    var saved = loadWizardData();
    if (!saved) return false;
    state.heroName = saved.heroName || '';
    state.age = saved.age || null;
    state.gender = saved.gender || null;
    state.challenge = saved.challenge || null;
    state.customChallenge = saved.customChallenge || '';
    state.language = 'ar';
    state.dedicationType = saved.dedicationType || 'none';
    state.dedicationText = saved.dedicationText || '';
    state.deliveryRecipientType = saved.deliveryRecipientType || 'customer';
    state.recipientName = saved.recipientName || '';
    state.recipientPhone = saved.recipientPhone || '';
    state.recipientAddress = saved.recipientAddress || '';
    state.photoUrl = saved.photoUrl || null;
    state.photoUrls = saved.photoUrls || (saved.photoUrl ? [saved.photoUrl] : []);
    state.wizardStep = Math.min(4, Math.max(1, Number(saved.wizardStep) || 1));
    return true;
  }

  function setExclusiveChoice(shell, selector, activeElement, ariaAttribute) {
    shell.querySelectorAll(selector).forEach(function (element) {
      var active = element === activeElement;
      element.classList.toggle('is-active', active);
      element.setAttribute(ariaAttribute, active ? 'true' : 'false');
    });
  }

  function renderPhotoPreviews(dropzone, sources) {
    if (!dropzone) return;
    var existing = dropzone.querySelector('.dz-preview');
    if (existing) existing.remove();
    if (!sources.length) {
      dropzone.classList.remove('has-photo');
      return;
    }
    dropzone.classList.add('has-photo');
    var preview = document.createElement('div');
    preview.className = 'dz-preview dz-preview-grid';
    dropzone.appendChild(preview);
    sources.forEach(function (source) {
      var img = document.createElement('img');
      img.alt = 'صورة الطفل';
      preview.appendChild(img);
      if (typeof source === 'string') {
        img.src = source;
        return;
      }
      var reader = new FileReader();
      reader.onload = function (event) { img.src = event.target.result; };
      reader.readAsDataURL(source);
    });
  }

  function syncWizardControls(shell) {
    var nameInput = shell.querySelector('#heroName');
    var customChallengeInput = shell.querySelector('#customChallenge');
    var dedicationText = shell.querySelector('#dedicationText');
    var recipientName = shell.querySelector('#recipientName');
    var recipientPhone = shell.querySelector('#recipientPhone');
    var recipientAddress = shell.querySelector('#recipientAddress');
    if (nameInput) nameInput.value = state.heroName;
    if (customChallengeInput) customChallengeInput.value = state.customChallenge;
    if (dedicationText) dedicationText.value = state.dedicationType === 'custom' ? state.dedicationText : '';
    if (recipientName) recipientName.value = state.recipientName;
    if (recipientPhone) recipientPhone.value = state.recipientPhone;
    if (recipientAddress) recipientAddress.value = state.recipientAddress;
    shell.querySelectorAll('.age-chip').forEach(function (chip) {
      chip.classList.toggle('is-active', Number(chip.dataset.age) === Number(state.age));
    });
    shell.querySelectorAll('[data-gender]').forEach(function (choice) {
      var active = choice.dataset.gender === state.gender;
      choice.classList.toggle('is-active', active);
      choice.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    shell.querySelectorAll('.challenge-card').forEach(function (card) {
      var heading = card.querySelector('h4');
      card.classList.toggle('is-active', !!heading && heading.textContent === state.challenge);
    });
    shell.querySelectorAll('[data-dedication]').forEach(function (card) {
      var active = card.dataset.dedication === state.dedicationType;
      card.classList.toggle('is-active', active);
      card.setAttribute('aria-checked', active ? 'true' : 'false');
    });
    var customBox = shell.querySelector('#dedicationCustomBox');
    if (customBox) customBox.hidden = state.dedicationType !== 'custom';
    shell.querySelectorAll('[data-recipient-type]').forEach(function (choice) {
      var active = choice.dataset.recipientType === state.deliveryRecipientType;
      choice.classList.toggle('is-active', active);
      choice.setAttribute('aria-checked', active ? 'true' : 'false');
    });
    var recipientFields = shell.querySelector('#recipientFields');
    if (recipientFields) recipientFields.hidden = state.deliveryRecipientType !== 'other';
    renderPhotoPreviews(shell.querySelector('.dropzone'), state.photoUrls);
  }

  function resetWizardStateValues() {
    state.heroName = '';
    state.age = null;
    state.gender = null;
    state.challenge = null;
    state.customChallenge = '';
    state.language = 'ar';
    state.dedicationType = 'none';
    state.dedicationText = '';
    state.deliveryRecipientType = 'customer';
    state.recipientName = '';
    state.recipientPhone = '';
    state.recipientAddress = '';
    state.photoUrl = null;
    state.photoUrls = [];
    state.photoFile = null;
    state.photoFiles = [];
    state.wizardStep = 1;
  }

  function resetWizard(shell) {
    clearWizardData();
    resetWizardStateValues();
    var preview = shell.querySelector('.dz-preview');
    if (preview) preview.remove();
    var dropzone = shell.querySelector('.dropzone');
    if (dropzone) dropzone.classList.remove('has-photo');
    syncWizardControls(shell);
    goToWizardStep(1);
  }

  function validateWizardStep(step, shell) {
    if (step === 1 && !state.heroName) {
      var nameInput = shell.querySelector('#heroName');
      if (nameInput) nameInput.focus();
      showToast('اكتبي اسم بطل الحكاية ✦');
      return false;
    }
    if (step === 1 && !state.age) {
      showToast('اختاري عمر بطلنا ✦');
      return false;
    }
    if (step === 1 && !state.gender) {
      showToast('اختاري بطل أو بطلة ✦');
      return false;
    }
    if (step === 2 && !state.challenge && !state.customChallenge) {
      showToast('اختاري قيمة للقصة أو اكتبي تفاصيل خاصة ✦');
      return false;
    }
    if (step === 2 && !state.challenge) state.challenge = 'قيمة مخصصة';
    if (step === 3 && !state.photoFiles.length && !state.photoUrls.length) {
      showToast('اختاري صورة واضحة واحدة على الأقل ✦');
      return false;
    }
    if (step === 4 && state.dedicationType === 'custom' && !state.dedicationText) {
      var dedicationInput = shell.querySelector('#dedicationText');
      if (dedicationInput) dedicationInput.focus();
      showToast('اكتبي نص الإهداء الخاص ✦');
      return false;
    }
    if (step === 4 && state.deliveryRecipientType === 'other' && !state.recipientName) {
      shell.querySelector('#recipientName').focus();
      showToast('اكتبي اسم الشخص اللي هيستلم القصة ✦');
      return false;
    }
    if (step === 4 && state.deliveryRecipientType === 'other' && !/^01[0-9]{9}$/.test(state.recipientPhone)) {
      shell.querySelector('#recipientPhone').focus();
      showToast('اكتبي رقم موبايل مصري صحيح للمستلم ✦');
      return false;
    }
    if (step === 4 && state.deliveryRecipientType === 'other' && !state.recipientAddress) {
      shell.querySelector('#recipientAddress').focus();
      showToast('اكتبي عنوان توصيل القصة للمستلم ✦');
      return false;
    }
    return true;
  }

  function dedicationForSelection() {
    if (state.dedicationType === 'warm') {
      return 'إلى ' + state.heroName + '، لكل طفل مميز قصة تشبهه. نتمنى أن تمتلئ أيامك فرحاً وشجاعة وحباً.';
    }
    if (state.dedicationType === 'dream') {
      return 'إلى ' + state.heroName + '، اقرأ بابتسامة، واحلم أحلاماً جميلة، وتذكر دائماً أنك بطل حكايتك.';
    }
    return state.dedicationType === 'custom' ? state.dedicationText : '';
  }

  function acceptPhotoFiles(files, dropzone) {
    var candidates = Array.prototype.slice.call(files || []).slice(0, 5);
    var valid = candidates.filter(function (file) {
      return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && file.size <= 5 * 1024 * 1024;
    });
    if (!valid.length) {
      showToast('اختاري صور JPEG أو PNG أو WebP وأقل من ٥ ميجا ✦');
      return;
    }
    state.photoFiles = valid;
    state.photoFile = valid[0];
    state.photoUrl = null;
    state.photoUrls = [];
    saveWizardData();
    renderPhotoPreviews(dropzone, valid);
  }

  function setupWizard() {
    var wizardShell = document.querySelector('[data-page="wizard"] .wizard-shell');
    if (!wizardShell) return;
    var hasSavedWizard = restoreWizardState();
    if (!hasSavedWizard) resetWizardStateValues();
    var nameInput = wizardShell.querySelector('#heroName');
    var customChallengeInput = wizardShell.querySelector('#customChallenge');
    var dedicationText = wizardShell.querySelector('#dedicationText');
    var recipientName = wizardShell.querySelector('#recipientName');
    var recipientPhone = wizardShell.querySelector('#recipientPhone');
    var recipientAddress = wizardShell.querySelector('#recipientAddress');
    var resetButton = wizardShell.querySelector('#wizardReset');
    var promoChip = wizardShell.querySelector('#wizardPromoChip');
    var genBar = wizardShell.querySelector('#genBar');
    if (genBar) genBar.style.width = '0%';
    var generating = wizardShell.querySelector('#wizardGenerating');
    if (generating) generating.hidden = true;
    if (resetButton) resetButton.hidden = !hasSavedWizard;
    var pendingCode = getPendingPromoCode();
    if (promoChip) {
      promoChip.hidden = !pendingCode;
      promoChip.textContent = pendingCode ? 'خصمك محفوظ: ' + pendingCode + ' ✦' : '';
    }
    syncWizardControls(wizardShell);
    goToWizardStep(state.wizardStep);

    if (wizardInited) return;
    wizardInited = true;
    var photoInput = wizardShell.querySelector('#photoInput');
    var dropzone = wizardShell.querySelector('.dropzone');
    if (photoInput) {
      photoInput.addEventListener('change', function (e) {
        acceptPhotoFiles(e.target.files, dropzone);
      });
    }
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
        acceptPhotoFiles(e.dataTransfer.files, dropzone);
      });
    }
    wizardShell.querySelectorAll('.age-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        wizardShell.querySelectorAll('.age-chip').forEach(function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        state.age = parseInt(chip.getAttribute('data-age') || chip.textContent.trim(), 10);
        saveWizardData();
      });
    });
    if (nameInput) {
      nameInput.addEventListener('input', function (e) {
        state.heroName = e.target.value.trim();
        saveWizardData();
      });
    }
    wizardShell.querySelectorAll('[data-gender]').forEach(function (choice) {
      choice.addEventListener('click', function () {
        state.gender = choice.dataset.gender;
        setExclusiveChoice(wizardShell, '[data-gender]', choice, 'aria-pressed');
        saveWizardData();
      });
    });
    wizardShell.querySelectorAll('.challenge-card').forEach(function (card) {
      card.addEventListener('click', function () {
        wizardShell.querySelectorAll('.challenge-card').forEach(function (c) { c.classList.remove('is-active'); });
        card.classList.add('is-active');
        state.challenge = card.querySelector('h4') ? card.querySelector('h4').textContent : '';
        saveWizardData();
      });
    });
    if (customChallengeInput) {
      customChallengeInput.addEventListener('input', function (e) {
        state.customChallenge = e.target.value.trim();
        saveWizardData();
      });
    }
    wizardShell.querySelectorAll('[data-dedication]').forEach(function (card) {
      card.addEventListener('click', function () {
        state.dedicationType = card.dataset.dedication;
        state.dedicationText = state.dedicationType === 'custom' ? '' : dedicationForSelection();
        setExclusiveChoice(wizardShell, '[data-dedication]', card, 'aria-checked');
        var customBox = wizardShell.querySelector('#dedicationCustomBox');
        if (customBox) customBox.hidden = state.dedicationType !== 'custom';
        if (dedicationText) dedicationText.value = state.dedicationType === 'custom' ? '' : state.dedicationText;
        saveWizardData();
      });
    });
    if (dedicationText) {
      dedicationText.addEventListener('input', function (e) {
        state.dedicationText = e.target.value.trim();
        saveWizardData();
      });
    }
    wizardShell.querySelectorAll('[data-recipient-type]').forEach(function (choice) {
      choice.addEventListener('click', function () {
        state.deliveryRecipientType = choice.dataset.recipientType;
        setExclusiveChoice(wizardShell, '[data-recipient-type]', choice, 'aria-checked');
        var recipientFields = wizardShell.querySelector('#recipientFields');
        if (recipientFields) recipientFields.hidden = state.deliveryRecipientType !== 'other';
        saveWizardData();
      });
    });
    if (recipientName) recipientName.addEventListener('input', function (event) {
      state.recipientName = event.target.value.trim();
      saveWizardData();
    });
    if (recipientPhone) recipientPhone.addEventListener('input', function (event) {
      state.recipientPhone = event.target.value.replace(/\D/g, '').slice(0, 11);
      event.target.value = state.recipientPhone;
      saveWizardData();
    });
    if (recipientAddress) recipientAddress.addEventListener('input', function (event) {
      state.recipientAddress = event.target.value.trim();
      saveWizardData();
    });
    wizardShell.querySelectorAll('[data-next]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!validateWizardStep(state.wizardStep, wizardShell)) return;
        state.dedicationText = dedicationForSelection();
        saveWizardData();
        var next = state.wizardStep + 1;
        if (next > 4) {
          uploadPhotoAndGenerate();
          return;
        }
        goToWizardStep(next);
      });
    });
    if (resetButton) resetButton.addEventListener('click', function () { resetWizard(wizardShell); });
    var backButton = wizardShell.querySelector('[data-back]');
    if (backButton) {
      backButton.addEventListener('click', function () {
        if (state.wizardStep === 1) history.back();
        else goToWizardStep(state.wizardStep - 1);
      });
    }
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
    var stepNames = ['', 'بطل الحكاية', 'القيمة', 'الصورة', 'اللمسة الأخيرة'];
    if (bar) bar.style.width = n * 25 + '%';
    if (label) label.textContent = 'الخطوة ' + arabicDigits[n] + ' من ٤ · ' + stepNames[n];

    // Highlight stepper dots: done (steps before n), active (n), pending (after).
    shell.querySelectorAll('.ws-dot').forEach(function (dot) {
      var s = parseInt(dot.dataset.step, 10);
      dot.classList.toggle('is-active', s === n);
      dot.classList.toggle('is-done', s < n);
    });
    var lines = shell.querySelectorAll('.ws-line');
    lines.forEach(function (line, idx) {
      // line idx (0-based) connects step (idx+1) to (idx+2) — done if both <= n-1.
      line.classList.toggle('is-done', idx + 1 < n);
    });

    setTimeout(initReveals, 60);
    saveWizardData();
  }

  function uploadPhotoAndGenerate() {
    var shell = document.querySelector('[data-page="wizard"] .wizard-shell');
    var generating = shell ? shell.querySelector('#wizardGenerating') : null;
    if (shell) shell.querySelectorAll('.wizard-step').forEach(function (step) { step.hidden = true; });
    if (generating) generating.hidden = false;
    var filesToUpload = state.photoFiles && state.photoFiles.length ? state.photoFiles : (state.photoFile ? [state.photoFile] : []);
    if (!filesToUpload.length || state.photoUrls.length) {
      saveWizardData();
      runGenerator();
      return;
    }
    state.photoUploading = true;
    Promise.all(filesToUpload.map(uploadChildPhoto))
      .then(function (uploads) {
        state.photoUrls = uploads.map(function (upload) { return upload.url; });
        state.photoUrl = state.photoUrls[0];
        state.photoUploading = false;
        saveWizardData();
        runGenerator();
      })
      .catch(function (error) {
        state.photoUploading = false;
        if (generating) generating.hidden = true;
        goToWizardStep(3);
        showToast(error.message || 'تعذر رفع الصورة، حاولي مرة تانية ✦');
      });
  }

  function uploadChildPhoto(file) {
    var formData = new FormData();
    formData.append('file', file);
    return fetch('/api/upload-child-photo', { method: 'POST', body: formData })
      .then(function (response) {
        return response.json().catch(function () { return null; }).then(function (body) {
          if (!response.ok || !body || !body.success || !body.data || !body.data.url) {
            throw new Error(body && body.error ? body.error : 'تعذر رفع الصورة الآن، حاولي مرة تانية');
          }
          return body.data;
        });
      });
  }

  function runGenerator() {
    var bar = document.querySelector('#genBar');
    var text = document.querySelector('#genText');
    var stages = [
      'بنراجع اختياراتك',
      'بنجهز صور بطلنا',
      'بنرتب تفاصيل الحكاية',
      'بنحفظ لمستك الخاصة',
      'الحكاية جاهزة للطلب!',
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
    var wizardSlug = getWizardSlug();
    var existing = false;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].slug === wizardSlug) {
        existing = true;
        break;
      }
    }
    if (!existing && PRODUCTS[wizardSlug]) {
      var p = PRODUCTS[wizardSlug];
      cart.push({
        slug: wizardSlug,
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
    area: '',          // Cairo sub-district filter
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
            ? 'background-image:url(' + cloudinaryUrl(a.coverImage, 600) + ')'
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
        outingsState.area = '';
        outingsState.page = 1;
        // Show/hide area sub-filter for Cairo
        var areaGroup = document.getElementById('areaFilterGroup');
        if (areaGroup) {
          areaGroup.style.display = (outingsState.city === 'Cairo') ? '' : 'none';
          document.querySelectorAll('#areaChips .chip').forEach(function (c, i) {
            c.classList.toggle('is-active', i === 0);
          });
        }
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

    // Area chips (Cairo sub-filter)
    document.querySelectorAll('#areaChips .chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('#areaChips .chip').forEach(function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        outingsState.area = chip.dataset.area || '';
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
    if (outingsState.area) params.set('area', outingsState.area);
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
        var hasFilters = outingsState.city || outingsState.area || outingsState.type || outingsState.category || outingsState.search;
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
    var name = place.name_ar || place.name_en || '';
    var city = place.city || '';
    return 'https://www.google.com/search?q=' + encodeURIComponent(name + ' ' + city + ' مصر');
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
    outingsState.area = '';
    outingsState.type = '';
    outingsState.category = '';
    outingsState.search = '';
    outingsState.page = 1;

    // Reset UI
    ['#cityChips', '#typeChips', '#catChips', '#areaChips'].forEach(function (sel) {
      document.querySelectorAll(sel + ' .chip').forEach(function (c, i) {
        c.classList.toggle('is-active', i === 0);
      });
    });
    var areaGroup = document.getElementById('areaFilterGroup');
    if (areaGroup) areaGroup.style.display = 'none';
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
          container.innerHTML = '<div class="articles-error"><p>المقال غير موجود</p><a href="#/mama-world" class="btn btn-outline" style="margin-top:16px;display:inline-block">← رجوع لعالم ماما وبابا</a></div>';
          return;
        }
        var a = data.data;

        // Dynamic SEO
        document.title = (a.seoTitle || a.title) + ' | سراج';
        var metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', a.metaDescription || a.excerpt || '');

        var sectionColor = getSectionColor(a.section);
        var coverHtml = a.coverImage
          ? '<div class="article-detail-cover" style="background-image:url(' + cloudinaryUrl(a.coverImage, 1200) + ')"></div>'
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
              ? 'background-image:url(' + cloudinaryUrl(r.coverImage, 400) + ')'
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
          '<a href="#/mama-world" class="article-back">← رجوع لعالم ماما وبابا</a>' +
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
        container.innerHTML = '<div class="articles-error"><p>حصلت مشكلة في تحميل المقال</p><a href="#/mama-world" class="btn btn-outline" style="margin-top:16px;display:inline-block">← رجوع لعالم ماما وبابا</a></div>';
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
  function loadZigzagVideo(video) {
    var source = video.dataset.src;
    if (!source) return;
    video.src = source;
    video.removeAttribute('data-src');
    video.load();
  }

  function initZigzagVideos() {
    var wraps = document.querySelectorAll('.zz-video-wrap');
    if (!wraps.length) return;

    if (typeof IntersectionObserver === 'undefined') {
      wraps.forEach(function (wrap) {
        var video = wrap.querySelector('video');
        if (!video) return;
        loadZigzagVideo(video);
        video.play().catch(function () { /* autoplay blocked */ });
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var wrap = entry.target;
          var video = wrap.querySelector('video');
          if (!video) return;
          if (entry.isIntersecting) {
            loadZigzagVideo(video);
            video.play().catch(function () { /* autoplay blocked */ });
            wrap.classList.add('is-playing');
          } else {
            video.pause();
            wrap.classList.remove('is-playing');
          }
        });
      },
      { rootMargin: '200px 0px', threshold: 0.1 }
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

    // If we're on the cart page, refresh it so the new item appears immediately
    // (relevant for the cross-sell strip).
    if (location.hash.indexOf('#/cart') === 0) {
      renderCartPage();
    }
  });

  // ----- Buy Now handler: Add to cart + go to checkout -----
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-buy-now]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    var slug = btn.dataset.buyNow;
    if (!slug) return;

    var product = PRODUCTS[slug];
    if (!product) return;

    // Add to cart if not already there
    var found = false;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].slug === slug) {
        found = true;
        break;
      }
    }
    if (!found) {
      cart.push({
        slug: slug,
        name: product.name,
        price: product.price || 0,
        qty: 1
      });
      saveCart();
      updateCartBadge();
    }

    // Navigate to checkout
    location.hash = '#/checkout';
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
    var section = document.getElementById('customerStories');

    fetch('/api/testimonials')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.success || !data.data || !data.data.length) {
          if (section) section.hidden = true;
          return;
        }
        var html = '';
        data.data.forEach(function (t, i) {
          var testimonialMeta = [t.location, t.childAge].filter(Boolean).map(escapeHtml).join(' · ');
          if (t.screenshotUrl) {
            html += '<figure class="testimonial-media-card reveal" style="--d:.' + ((i % 8) * 5 + 5) + 's">';
            html += '<img src="' + escapeHtml(t.screenshotUrl) + '" alt="' + escapeHtml(t.screenshotAlt || ('رسالة واتساب من ' + t.name)) + '" loading="lazy"/>';
            html += '<figcaption>' + (t.quote ? '<blockquote>“' + escapeHtml(t.quote) + '”</blockquote>' : '');
            html += '<div class="testimonial-author"><span class="avatar" style="background:' + escapeHtml(t.avatarColor || '#6bbf3f') + '">' + escapeHtml(t.avatarInitials) + '</span>';
            html += '<div><strong>' + escapeHtml(t.name) + '</strong>' + (testimonialMeta ? '<small>' + testimonialMeta + '</small>' : '') + '</div></div>';
            html += '</figcaption></figure>';
            return;
          }
          html += '<figure class="t-card reveal" style="--d:.' + ((i % 12) * 5 + 5) + 's">';
          html += '<blockquote>"' + escapeHtml(t.quote) + '"</blockquote>';
          html += '<figcaption>';
          html += '<span class="avatar" style="--c:' + escapeHtml(t.avatarColor || '#6bbf3f') + '">' + escapeHtml(t.avatarInitials) + '</span>';
          html += '<div><strong>' + escapeHtml(t.name) + '</strong>' + (testimonialMeta ? '<small>' + testimonialMeta + '</small>' : '') + '</div>';
          html += '</figcaption></figure>';
        });
        grid.innerHTML = html;
        setTimeout(initReveals, 80);
      })
      .catch(function () { if (section) section.hidden = true; });
  }

  var activePromotion = null;
  var promotionTimer = null;
  var promotionPreviousFocus = null;

  function promotionRouteEligible() {
    var page = parseRoute().page;
    return ['home', 'products', 'product'].indexOf(page) !== -1;
  }

  function promotionWasDismissed() {
    try {
      var dismissedAt = Number(localStorage.getItem(PROMO_DISMISSED_KEY) || 0);
      return dismissedAt > 0 && Date.now() - dismissedAt < PROMO_DISMISS_MS;
    } catch (e) { return false; }
  }

  function promotionCanShow() {
    if (!activePromotion || !promotionRouteEligible()) return false;
    if (appliedCoupon || getPendingPromoCode() || promotionWasDismissed()) return false;
    try { return sessionStorage.getItem('seraj-promo-seen') !== '1'; } catch (e) { return true; }
  }

  function schedulePromotion() {
    if (!promotionCanShow() || promotionTimer) return;
    promotionTimer = setTimeout(function () {
      promotionTimer = null;
      showPromotion();
    }, 12000);
  }

  function promotionScrollThresholdReached() {
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    return scrollable > 0 && window.scrollY / scrollable >= 0.38;
  }

  function fetchActivePromotion() {
    fetch('/api/promotions/active')
      .then(function (response) { return response.json(); })
      .then(function (body) {
        activePromotion = body.success ? body.data : null;
        if (promotionScrollThresholdReached()) showPromotion();
        else schedulePromotion();
      })
      .catch(function () { activePromotion = null; });
  }

  function showPromotion() {
    if (!promotionCanShow()) return;
    var modal = document.getElementById('promoModal');
    if (!modal) return;
    document.getElementById('promoHeadline').textContent = activePromotion.headline;
    document.getElementById('promoOffer').textContent = activePromotion.offerText;
    document.getElementById('promoMessage').textContent = activePromotion.message;
    document.getElementById('promoCode').textContent = activePromotion.code;
    document.getElementById('promoCta').textContent = activePromotion.ctaText;
    var expiry = document.getElementById('promoExpiry');
    if (activePromotion.validTo) {
      expiry.hidden = false;
      expiry.textContent = 'صالح حتى ' + new Date(activePromotion.validTo).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
    } else {
      expiry.hidden = true;
    }
    promotionPreviousFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('promo-open');
    try { sessionStorage.setItem('seraj-promo-seen', '1'); } catch (e) { /* silent */ }
    var closeButton = modal.querySelector('.promo-close');
    if (closeButton) closeButton.focus();
  }

  function closePromotion(rememberDismissal) {
    var modal = document.getElementById('promoModal');
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('promo-open');
    if (rememberDismissal) {
      try { localStorage.setItem(PROMO_DISMISSED_KEY, String(Date.now())); } catch (e) { /* silent */ }
    }
    if (promotionPreviousFocus && promotionPreviousFocus.focus) promotionPreviousFocus.focus();
  }

  function copyPromotionCode() {
    if (!activePromotion) return;
    savePendingPromoCode(activePromotion.code);
    var copyButton = document.getElementById('promoCopy');
    var copied = function () {
      if (copyButton) copyButton.textContent = 'تم النسخ ✓';
      showToast('تم حفظ كود الخصم لطلبك ✦');
    };
    var saved = function () {
      if (copyButton) copyButton.textContent = 'تم الحفظ ✓';
      showToast('تم حفظ كود الخصم وسيُطبّق عند الطلب ✦');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(activePromotion.code).then(copied, saved);
    } else {
      saved();
    }
  }

  document.addEventListener('click', function (event) {
    if (event.target.closest('[data-promo-close]')) closePromotion(true);
    if (event.target.closest('#promoCopy')) copyPromotionCode();
    if (event.target.closest('#promoCta') && activePromotion) {
      savePendingPromoCode(activePromotion.code);
      closePromotion(false);
      location.hash = '#/wizard';
    }
  });

  document.addEventListener('click', function (event) {
    if (!event.target.closest('[data-edit-story]')) return;
    state.wizardStep = 1;
    saveWizardData();
    location.hash = '#/wizard';
  });

  document.addEventListener('keydown', function (event) {
    var modal = document.getElementById('promoModal');
    if (!modal || modal.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closePromotion(true);
      return;
    }
    if (event.key !== 'Tab') return;
    var focusable = Array.prototype.slice.call(modal.querySelectorAll('button:not([disabled])'));
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  window.addEventListener('scroll', function () {
    if (promotionScrollThresholdReached()) showPromotion();
  }, { passive: true });

  // ---------------------------------------------------------
  // CMS CONTENT / DOM INJECTION
  // ---------------------------------------------------------
  var SITE_CONTENT = {};
  var HTML_KEYS = ['hero.title', 'hero.subtitle', 'about.quote', 'showcase.cat1.title', 'showcase.cat1.desc', 'showcase.cat2.title', 'showcase.cat2.desc', 'showcase.cat3.title', 'showcase.cat3.desc', 'showcase.cat4.title', 'showcase.cat4.desc', 'showcase.cat5.title', 'showcase.cat5.desc'];
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
          el.innerHTML = SITE_CONTENT[key].replace(/&quot;/g, '"');
        } else if (MARKDOWN_KEYS.indexOf(key) !== -1) {
          el.innerHTML = simpleMarkdown(SITE_CONTENT[key]);
        } else if (key === 'hero.marquee') {
          // Marquee: convert "text ✦ text ✦" format into <span>text</span><b>✦</b> structure
          var items = SITE_CONTENT[key].split('✦').map(function(s){ return s.trim(); }).filter(Boolean);
          var html = '';
          // Duplicate for seamless marquee loop
          for (var dup = 0; dup < 2; dup++) {
            items.forEach(function(item) {
              html += '<span>' + item + '</span><b>✦</b>';
            });
          }
          el.innerHTML = html;
        } else {
          el.textContent = SITE_CONTENT[key].replace(/&quot;/g, '"');
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
  // QUICK ADD RELATED PRODUCT
  // ---------------------------------------------------------
  window.quickAddRelated = function(slug) {
    var found = false;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].slug === slug) { cart[i].qty++; found = true; break; }
    }
    if (!found) {
      var product = PRODUCTS[slug];
      if (!product) return;
      cart.push({ slug: slug, name: product.name, price: product.price || 0, qty: 1 });
    }
    saveCart();
    updateCartBadge();
    showToast(PRODUCTS[slug].name + ' اتضاف للسلة ✦');
    if (location.hash.indexOf('#/product/') === 0) {
      renderProductDetail(location.hash.substring(10));
    } else if (location.hash.indexOf('#/cart') === 0) {
      renderCartPage();
    }
  };

  // ═══════════════════════════════════════════════════════════
  // PWA INSTALL BANNER
  //   Android / Desktop Chrome / Edge → beforeinstallprompt button
  //   iOS Safari                     → manual Share → Add to Home instructions
  //   Already-installed users        → banner stays hidden
  //   Dismissed users                → hidden for 30 days
  // ═══════════════════════════════════════════════════════════
  var PWA_DISMISS_KEY = 'seraj-pwa-install-dismissed-at';
  var PWA_DISMISS_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
  var PWA_SHOW_DELAY_MS = 5000;

  function isStandaloneMode() {
    try {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
      if (window.navigator && window.navigator.standalone === true) return true; // iOS Safari
    } catch (e) {}
    return false;
  }

  function recentlyDismissed() {
    try {
      var raw = localStorage.getItem(PWA_DISMISS_KEY);
      if (!raw) return false;
      var ts = parseInt(raw, 10);
      if (!isFinite(ts)) return false;
      return (Date.now() - ts) < PWA_DISMISS_MS;
    } catch (e) { return false; }
  }
  // ----- Init -----
  window.addEventListener('DOMContentLoaded', function () {
    loadCart();
    loadAppliedCoupon();
    updateCartBadge();

    var hasCachedProducts = hydrateProductsFromCache();
    fetchProducts();
    fetchConfig();
    fetchSiteContent();
    fetchTestimonials();
    fetchActivePromotion();
    if (!location.hash) location.hash = '#/home';

    var didInitialRender = false;
    function doInitialRender() {
      if (didInitialRender) return;
      didInitialRender = true;
      renderHomeProductsPreview();
      populateCatalog();
      handleRoute();
      initReveals();
      initCounter();
      initZigzagVideos();
    }

    if (hasCachedProducts) {
      doInitialRender();
      updateDOMPrices();
    } else {
      var waitForProducts = setInterval(function () {
        if (productsReady) {
          clearInterval(waitForProducts);
          doInitialRender();
        }
      }, 50);
      setTimeout(function () {
        clearInterval(waitForProducts);
        if (!productsReady) {
          productsReady = true;
        }
        doInitialRender();
      }, 2000);
    }
  });

  if (document.readyState === 'complete') {
    initHeroVideo();
  } else {
    window.addEventListener('load', initHeroVideo, { once: true });
  }

  function isIosSafari() {
    var ua = navigator.userAgent || '';
    var isIos = /iphone|ipad|ipod/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS 13+
    if (!isIos) return false;
    // Exclude in-app browsers (FBAV, Instagram, Line, etc) — they don't support A2HS reliably
    var isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|opios|ya?browser|fbav|fban|instagram|line/i.test(ua);
    return isSafari;
  }

  function initPwaInstallBanner() {
    var banner = document.getElementById('pwaInstallBanner');
    if (!banner) return;
    if (isStandaloneMode()) return;
    if (recentlyDismissed()) return;

    var cta = document.getElementById('pwaInstallCta');
    var closeBtn = document.getElementById('pwaInstallClose');
    var iosHint = document.getElementById('pwaInstallIosHint');
    var deferredPrompt = null;
    var shown = false;

    function show() {
      if (shown) return;
      shown = true;
      banner.hidden = false;
      banner.setAttribute('aria-hidden', 'false');
      // Defer one frame so the browser picks up the transition from transform → translate(0)
      requestAnimationFrame(function () {
        banner.classList.add('is-open');
      });
    }

    function hide(persistDismissal) {
      banner.classList.remove('is-open');
      banner.setAttribute('aria-hidden', 'true');
      setTimeout(function () { banner.hidden = true; }, 400);
      if (persistDismissal) {
        try { localStorage.setItem(PWA_DISMISS_KEY, String(Date.now())); } catch (e) {}
      }
    }

    closeBtn.addEventListener('click', function () { hide(true); });

    cta.addEventListener('click', function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function (choice) {
        deferredPrompt = null;
        // Hide after choice regardless; appinstalled fires on accept
        hide(choice && choice.outcome !== 'accepted');
      }).catch(function () { hide(false); });
    });

    window.addEventListener('appinstalled', function () { hide(false); });

    if (isIosSafari()) {
      // iOS Safari: no prompt API — surface manual instructions after the delay.
      iosHint.hidden = false;
      cta.hidden = true;
      setTimeout(show, PWA_SHOW_DELAY_MS);
      return;
    }

    // Everyone else: wait for beforeinstallprompt (fired only by installable browsers)
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      cta.hidden = false;
      iosHint.hidden = true;
      setTimeout(show, PWA_SHOW_DELAY_MS);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPwaInstallBanner);
  } else {
    initPwaInstallBanner();
  }

  // =========================================================
  // NATIVE SHARE LOGIC
  // =========================================================
  window.removeCheckoutItem = function(index) {
    if (index >= 0 && index < cart.length) {
      cart.splice(index, 1);
      saveCart();
      updateCartBadge();
      renderCheckoutPage();
    }
  };

  window.shareProduct = function(slug, name) {
    var url = window.location.origin + '/product/' + encodeURIComponent(slug);
    var text = 'شوف المنتج ده من سِراج: ' + name;
    if (navigator.share) {
      navigator.share({
        title: name,
        text: text,
        url: url
      }).catch(function(e) { console.log('Share error', e); });
    } else {
      var waUrl = 'https://wa.me/?text=' + encodeURIComponent(text + '\n' + url);
      window.open(waUrl, '_blank');
    }
  };


})();
