/* ============================================================
   سِراج — Client-side router + interactions
   ============================================================ */

(function () {
  'use strict';

  // ----- Wizard state (ephemeral) -----
  const state = {
    heroName: '',
    age: null,
    challenge: null,
    wizardStep: 1,
  };

  // ----- Product Data -----
  const PRODUCTS = {
    'story-khaled': {
      name: 'قصة خالد بن الوليد',
      badge: 'الأكثر طلباً',
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

  // ----- Cart State -----
  const cart = [];

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
    if (product.originalPriceText) {
      h += '<div class="price-group"><span class="price old-price">' + product.originalPriceText + '</span><span class="price big">' + product.priceText + '</span></div>';
    } else {
      h += '<span class="price big">' + product.priceText + '</span>';
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
        h += '<a href="' + href + '" data-link class="product-card"><div class="product-media ' + rp.media.bg + '">' + renderMedia(rp.media, false) + '</div><div class="product-body"><h3>' + rp.name + '</h3><div class="product-foot"><span class="price">' + rp.priceText + '</span><span class="cta-mini">شوفيها →</span></div></div></a>';
      }
      h += '</div></section>';
    }
    container.innerHTML = h;
    setTimeout(initReveals, 100);
  }

  function renderMedia(media, big) {
    var size = big ? ' big' : '';
    if (media.type === 'book3d') return '<div class="book3d' + size + '"><div class="book3d-cover"><span class="book3d-title">' + media.title + '</span><img src="' + media.image + '" class="book3d-mascot" alt=""/></div></div>';
    if (media.type === 'cards-fan') { var c = ['#e85d4c','#c9974e','#36a39a','#6bbf3f','#8b5e2a'], f = '<div class="cards-fan">'; for (var i=0;i<c.length;i++) f += '<i style="--i:'+i+';--c:'+c[i]+'"></i>'; return f + '</div>'; }
    if (media.type === 'bundle-stack') return '<div class="bundle-stack"><div class="bundle-i"></div><div class="bundle-i"></div><div class="bundle-i"></div></div>';
    return '';
  }

  // ----- Cart helpers -----
  function updateCartBadge() {
    var badge = document.getElementById('cartCount');
    if (!badge) return;
    if (cart.length > 0) { badge.textContent = cart.length; badge.hidden = false; }
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
    requestAnimationFrame(function() { t.classList.add('show'); });
    setTimeout(function() { t.classList.remove('show'); setTimeout(function() { t.remove(); }, 300); }, 2200);
  }

  // ----- Router -----
  const pages = document.querySelectorAll('.page');
  const bottomTabs = document.querySelectorAll('.bottom-nav a[data-tab]');

  function parseRoute() {
    const hash = location.hash.replace(/^#\//, '') || 'home';
    const [page, sub] = hash.split('/');
    // Guard: bare "#" or empty resolves to home
    if (!page || page === '#') return { page: 'home', sub: undefined };
    return { page, sub };
  }

  function showPage(name, sub) {
    let target = name;
    // Map special routes
    if (name === 'product') target = 'product';

    pages.forEach((p) => {
      const isActive = p.dataset.page === target;
      p.classList.toggle('is-active', isActive);
    });

    // Update bottom nav
    bottomTabs.forEach((a) => {
      a.classList.toggle('is-active', a.dataset.tab === name);
    });

    // Scroll to top of new page
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Replay reveal observer for newly-visible content
    setTimeout(initReveals, 80);

    // Special page setups
    if (name === 'product') renderProductDetail(sub);
    if (name === 'wizard') setupWizard();
    if (name === 'success') burstConfetti();
    if (name === 'mama-world') initMamaWorld();
    if (name === 'preview') {
      const heroName = state.heroName || 'بطلنا';
      document.querySelectorAll('#previewName, #previewName2, #previewName3, #previewName4')
        .forEach((el) => (el.textContent = heroName));
    }
  }

  function handleRoute() {
    const { page, sub } = parseRoute();
    showPage(page, sub);
  }

  // Intercept data-link clicks
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-link]');
    if (!link) {
      // Prevent bare "#" links from blanking the SPA
      const bareLink = e.target.closest('a[href="#"]');
      if (bareLink) e.preventDefault();
      return;
    }
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#/')) return;
    // Let the hashchange event do the work
  });

  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('DOMContentLoaded', () => {
    if (!location.hash) location.hash = '#/home';
    handleRoute();
    initReveals();
    initCounter();
    initZigzagVideos();
  });

  // ----- Reveal on scroll -----
  let revealObserver;
  function initReveals() {
    const els = document.querySelectorAll('.page.is-active .reveal:not(.is-visible), .page.is-active .how-section');
    if (revealObserver) revealObserver.disconnect();
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach((el) => revealObserver.observe(el));
  }

  // ----- Counter -----
  function initCounter() {
    const counters = document.querySelectorAll('.counter');
    const arabicDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
    const toArabic = (n) => String(n).replace(/[0-9]/g, (d) => arabicDigits[+d]);

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const to = parseInt(el.dataset.to, 10) || 0;
          const duration = 1800;
          const start = performance.now();
          function step(t) {
            const p = Math.min((t - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = toArabic(Math.round(to * eased));
            if (p < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
          obs.unobserve(el);
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach((c) => obs.observe(c));
  }

  // ----- Wizard -----
  let wizardInited = false;
  function setupWizard() {
    const wizardShell = document.querySelector('[data-page="wizard"] .wizard-shell');
    if (!wizardShell) return;

    // Reset wizard state when entering the wizard page
    state.wizardStep = 1;
    state.heroName = '';
    state.age = null;
    state.challenge = null;

    // Clear UI selections
    const nameInput = wizardShell.querySelector('#heroName');
    if (nameInput) nameInput.value = '';
    wizardShell.querySelectorAll('.age-chip').forEach((c) => c.classList.remove('is-active'));
    wizardShell.querySelectorAll('.challenge-card').forEach((c) => c.classList.remove('is-active'));

    // Reset generator bar
    const genBar = wizardShell.querySelector('#genBar');
    if (genBar) genBar.style.width = '0%';

    goToWizardStep(1);

    if (wizardInited) return;
    wizardInited = true;

    // Age chips
    wizardShell.querySelectorAll('.age-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        wizardShell.querySelectorAll('.age-chip').forEach((c) => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        state.age = chip.textContent.trim();
      });
    });

    // Name input — reuse the nameInput variable from reset above
    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        state.heroName = e.target.value.trim();
      });
    }

    // Challenge cards
    wizardShell.querySelectorAll('.challenge-card').forEach((card) => {
      card.addEventListener('click', () => {
        wizardShell.querySelectorAll('.challenge-card').forEach((c) => c.classList.remove('is-active'));
        card.classList.add('is-active');
        state.challenge = card.querySelector('h4')?.textContent;
      });
    });

    // Next buttons
    wizardShell.querySelectorAll('[data-next]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = state.wizardStep + 1;
        if (next > 4) {
          location.hash = '#/preview';
          return;
        }
        if (state.wizardStep === 1 && !state.heroName) {
          nameInput?.focus();
          nameInput?.classList.add('shake');
          setTimeout(() => nameInput?.classList.remove('shake'), 500);
          return;
        }
        goToWizardStep(next);
      });
    });

    // Back button
    wizardShell.querySelector('[data-back]')?.addEventListener('click', () => {
      if (state.wizardStep === 1) {
        history.back();
      } else {
        goToWizardStep(state.wizardStep - 1);
      }
    });
  }

  function goToWizardStep(n) {
    state.wizardStep = n;
    const shell = document.querySelector('[data-page="wizard"] .wizard-shell');
    if (!shell) return;

    shell.querySelectorAll('.wizard-step').forEach((s) => {
      s.hidden = parseInt(s.dataset.step, 10) !== n;
    });

    const bar = shell.querySelector('#wizBar');
    const label = shell.querySelector('#wizStepLabel');
    const arabicDigits = ['٠','١','٢','٣','٤'];
    if (bar) bar.style.width = n * 25 + '%';
    if (label) label.textContent = `الخطوة ${arabicDigits[n]} من ٤`;

    // Trigger reveals for newly-shown step content
    setTimeout(initReveals, 60);

    // If step 4 (generating), simulate loading
    if (n === 4) runGenerator();
  }

  function runGenerator() {
    const bar = document.querySelector('#genBar');
    const text = document.querySelector('#genText');
    const stages = [
      'بيخترع شخصيات القصة',
      'بيرسم الغلاف',
      'بيكتب أول فصل',
      'بيلون الصفحات',
      'خلصت المغامرة!',
    ];
    let pct = 0;
    let stageIdx = 0;
    if (text) text.textContent = stages[0];
    const int = setInterval(() => {
      pct += Math.random() * 8 + 4;
      if (pct > 100) pct = 100;
      if (bar) bar.style.width = pct + '%';
      const newStage = Math.min(Math.floor(pct / 22), stages.length - 1);
      if (newStage !== stageIdx && text) {
        stageIdx = newStage;
        text.textContent = stages[stageIdx];
      }
      if (pct >= 100) {
        clearInterval(int);
        setTimeout(() => {
          location.hash = '#/preview';
        }, 700);
      }
    }, 180);
  }

  // ----- Confetti -----
  function burstConfetti() {
    const host = document.getElementById('confetti');
    if (!host) return;
    host.innerHTML = '';
    const colors = ['#6bbf3f', '#c9974e', '#e85d4c', '#36a39a', '#ffffff'];
    for (let i = 0; i < 60; i++) {
      const s = document.createElement('span');
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
  let mamaInited = false;
  function initMamaWorld() {
    if (!mamaInited) {
      // Set up tab click listeners once
      document.querySelectorAll('.mama-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
          const target = tab.dataset.mamaTab;
          // Toggle tabs
          document.querySelectorAll('.mama-tab').forEach((t) => t.classList.remove('is-active'));
          tab.classList.add('is-active');
          // Toggle panels
          document.querySelectorAll('.mama-panel').forEach((p) => p.classList.remove('is-active'));
          const panel = document.querySelector(`[data-mama-panel="${target}"]`);
          if (panel) panel.classList.add('is-active');
          // Re-trigger reveals
          setTimeout(initReveals, 80);
        });
      });
      mamaInited = true;
    }
    // Reset to articles tab on entry
    document.querySelectorAll('.mama-tab').forEach((t) => t.classList.remove('is-active'));
    document.querySelectorAll('.mama-panel').forEach((p) => p.classList.remove('is-active'));
    const articlesTab = document.querySelector('[data-mama-tab="articles"]');
    const articlesPanel = document.querySelector('[data-mama-panel="articles"]');
    if (articlesTab) articlesTab.classList.add('is-active');
    if (articlesPanel) articlesPanel.classList.add('is-active');
  }

  // ----- Shake animation hook -----
  const styleShake = document.createElement('style');
  styleShake.textContent = `
    @keyframes shakeX { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
    .shake { animation: shakeX .35s ease; border-color: #e85d4c !important; }
  `;
  document.head.appendChild(styleShake);

  // ----- Value cards pre-select on landing (visual) -----
  document.addEventListener('click', (e) => {
    const vc = e.target.closest('.value-card');
    if (!vc) return;
    document.querySelectorAll('.value-card').forEach((c) => c.classList.remove('is-active'));
    vc.classList.add('is-active');
    // After visual feedback, route to wizard
    setTimeout(() => { location.hash = '#/wizard'; }, 220);
  });

  // ----- Filter Chips -----
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const container = chip.closest('.filter-chips');
    if (!container) return;
    container.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-active'));
    chip.classList.add('is-active');
  });

  // ----- Hero Video: Lazy-load + Intersection Observer -----
  // Best practice: load video only when visible, pause when off-screen
  function initHeroVideo() {
    const wrap = document.querySelector('[data-video-hero]');
    if (!wrap) return;
    const video = wrap.querySelector('video');
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Load & play only when visible
            if (video.readyState === 0) {
              video.load();
            }
            video.play().catch(() => {/* autoplay blocked — user must interact first */});
            wrap.classList.add('is-playing');
          } else {
            // Pause when off-screen to save bandwidth
            video.pause();
            wrap.classList.remove('is-playing');
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(wrap);

    // Fallback: if autoplay fails, show poster image naturally
    video.addEventListener('error', () => {
      wrap.classList.remove('is-playing');
    });
  }

  // ----- Zig-Zag Section Videos: Lazy-load -----
  function initZigzagVideos() {
    const wraps = document.querySelectorAll('.zz-video-wrap');
    if (!wraps.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const wrap = entry.target;
          const video = wrap.querySelector('video');
          if (!video) return;

          if (entry.isIntersecting) {
            if (video.readyState === 0) {
              video.load();
            }
            video.play().catch(() => {});
            wrap.classList.add('is-playing');
          } else {
            video.pause();
            wrap.classList.remove('is-playing');
          }
        });
      },
      { threshold: 0.25 }
    );

    wraps.forEach((w) => observer.observe(w));
  }

  // Init hero video on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroVideo);
  } else {
    initHeroVideo();
  }

  // ----- Add to Cart handler -----
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-add-cart]');
    if (!btn) return;
    var slug = btn.dataset.addCart;
    if (!slug) return;
    cart.push(slug);
    updateCartBadge();
    var product = PRODUCTS[slug];
    var name = product ? product.name : 'المنتج';
    showToast(name + ' اتضاف للسلة ✦');
    // Brief button feedback
    btn.style.transform = 'scale(.95)';
    setTimeout(function() { btn.style.transform = ''; }, 200);
  });
})();
