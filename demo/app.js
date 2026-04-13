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
})();
