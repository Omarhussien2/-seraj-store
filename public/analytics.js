(function () {
  'use strict';
  if (window.SerajAnalytics) return;
  var MEASUREMENT_ID = 'G-FZW3R2J7Y9';
  var CONSENT_KEY = 'seraj-analytics-consent-v1';
  var TOKEN_KEY = 'seraj-analytics-token-v1';
  var WITHDRAWALS_KEY = 'seraj-analytics-withdrawals-v1';
  var WITHDRAWAL_STATUS_KEY = 'seraj-analytics-withdrawal-status-v1';
  var SUBMISSIONS_KEY = 'seraj-analytics-submitted-v1';
  var MAX_PENDING_WITHDRAWALS = 20;
  var loaded = false;
  var granted = false;
  var serverAttributionBlocked = false;
  var withdrawalInFlight = false;
  var lastPage = '';
  var submitted = [];
  var publicRoutes = ['home', 'products', 'cart', 'checkout', 'success', 'wizard',
    'preview', 'about', 'contact', 'mama-world', 'shipping', 'returns', 'faq', 'product',
    'category', 'article', 'articles', 'how-personalized-stories-work',
    'personalized-gifts-for-children'];

  function routeGroup() {
    var path = location.pathname;
    var route = path === '/' || path === '/index.html'
      ? location.hash.replace(/^#\/?/, '') || 'home' : path.slice(1);
    var group = route.split(/[/?#]/)[0];
    return publicRoutes.indexOf(group) >= 0 ? group : null;
  }

  function safeReferrer() {
    var allowed = ['www.google.com', 'www.google.com.eg', 'www.bing.com',
      'duckduckgo.com', 'search.yahoo.com', 'chatgpt.com', 'www.perplexity.ai', 'perplexity.ai'];
    try {
      var source = new URL(document.referrer);
      return source.protocol === 'https:' && allowed.indexOf(source.hostname) >= 0
        ? source.origin + '/' : '';
    } catch { return ''; }
  }

  function pageFields() {
    var group = routeGroup();
    if (!group) return null;
    var clickId = new URLSearchParams(location.search).get('srsltid');
    var query = clickId && /^[A-Za-z0-9_-]{8,256}$/.test(clickId)
      ? '?srsltid=' + encodeURIComponent(clickId) : '';
    return { page_location: location.origin + '/' + group + query,
      page_title: 'Seraj | ' + group, page_referrer: safeReferrer() };
  }

  function consentSettings(accepted) {
    return { analytics_storage: accepted ? 'granted' : 'denied', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied' };
  }

  function validToken(token) {
    return typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token);
  }

  function pendingWithdrawals() {
    try {
      var stored = JSON.parse(localStorage.getItem(WITHDRAWALS_KEY) || '[]');
      if (!Array.isArray(stored)) return null;
      var unique = [];
      for (var index = 0; index < stored.length; index += 1) {
        if (!validToken(stored[index])) return null;
        if (unique.indexOf(stored[index]) < 0) unique.push(stored[index]);
      }
      return unique;
    } catch { return null; }
  }

  function saveWithdrawals(tokens) {
    try {
      localStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(tokens));
      return JSON.stringify(pendingWithdrawals()) === JSON.stringify(tokens);
    } catch { return false; }
  }

  function storedToken() {
    try {
      var token = localStorage.getItem(TOKEN_KEY);
      return validToken(token) ? token : null;
    } catch { return null; }
  }

  function retireCurrentToken() {
    var token = storedToken();
    if (!token) return true;
    var pending = pendingWithdrawals();
    if (!pending) return false;
    if (pending.indexOf(token) < 0) {
      if (pending.length >= MAX_PENDING_WITHDRAWALS) return false;
      pending.push(token);
    }
    if (!saveWithdrawals(pending)) return false;
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.setItem(WITHDRAWAL_STATUS_KEY, 'pending');
    } catch { return false; }
    return true;
  }

  function createConsentToken() {
    if (!window.crypto || typeof window.crypto.getRandomValues !== 'function') return null;
    var bytes = new Uint8Array(32);
    window.crypto.getRandomValues(bytes);
    var binary = '';
    for (var index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function ensureConsentToken() {
    var pending = pendingWithdrawals();
    if (!pending || pending.length >= MAX_PENDING_WITHDRAWALS) return null;
    var token = storedToken();
    if (token) return pending.indexOf(token) < 0 ? token : null;
    token = createConsentToken();
    if (!token) return null;
    try {
      localStorage.setItem(TOKEN_KEY, token);
      return storedToken() === token ? token : null;
    } catch { return null; }
  }

  function outstandingWithdrawals() {
    var pending = pendingWithdrawals();
    if (!pending) return null;
    var retainedToken = granted && !serverAttributionBlocked ? null : storedToken();
    if (retainedToken && pending.indexOf(retainedToken) < 0) {
      return [retainedToken].concat(pending);
    }
    return pending;
  }

  function flushWithdrawals() {
    if (withdrawalInFlight || !routeGroup()) return;
    var outstanding = outstandingWithdrawals();
    if (!outstanding || outstanding.length === 0) return;
    var sentTokens = outstanding.slice(0, MAX_PENDING_WITHDRAWALS);
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 5000);
    withdrawalInFlight = true;
    try { localStorage.setItem(WITHDRAWAL_STATUS_KEY, 'pending'); } catch { /* Status is advisory; the token remains durable. */ }
    fetch('/api/analytics/consent', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tokens: sentTokens }), signal: controller.signal })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (responseBody) {
        if (!responseBody || responseBody.success !== true) return;
        var latest = pendingWithdrawals();
        if (!latest) return;
        var remaining = latest.filter(function (token) { return sentTokens.indexOf(token) < 0; });
        if (remaining.length !== latest.length && !saveWithdrawals(remaining)) return;
        var retainedToken = storedToken();
        if (!granted && retainedToken && sentTokens.indexOf(retainedToken) >= 0) {
          localStorage.removeItem(TOKEN_KEY);
        }
        var stillOutstanding = outstandingWithdrawals();
        localStorage.setItem(WITHDRAWAL_STATUS_KEY,
          stillOutstanding && stillOutstanding.length ? 'pending' : 'acknowledged');
      })
      .catch(function () { /* The durable receipt is retried on the next public load or online event. */ })
      .finally(function () { clearTimeout(timeout); withdrawalInFlight = false; });
  }

  function retryWithdrawals() {
    if (!granted || serverAttributionBlocked) retireCurrentToken();
    flushWithdrawals();
  }

  function load() {
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', consentSettings(false));
    window.gtag('consent', 'update', consentSettings(true));
    window.gtag('set', pageFields());
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, { send_page_view: false,
      allow_google_signals: false, allow_ad_personalization_signals: false });
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
    document.head.appendChild(script);
  }

  function track(eventName, parameters) {
    var fields = pageFields();
    if (!granted || !fields || typeof window.gtag !== 'function') return;
    window.gtag('set', fields);
    window.gtag('event', eventName, Object.assign({}, parameters, fields));
  }

  function trackPage() {
    var fields = pageFields();
    if (!granted || !fields || lastPage === fields.page_location) return;
    lastPage = fields.page_location;
    track('page_view', {});
  }

  function closeBanner() {
    var banner = document.querySelector('[data-consent-banner]');
    if (banner) banner.remove();
    var manage = document.querySelector('[data-consent-manage]');
    if (manage && !manage.hidden) manage.focus({ preventScroll: true });
  }

  function chooseConsent(accepted) {
    var wasGranted = granted;
    granted = accepted;
    lastPage = '';
    window['ga-disable-' + MEASUREMENT_ID] = !accepted;
    if (accepted) {
      serverAttributionBlocked = !wasGranted && !retireCurrentToken();
      if (!serverAttributionBlocked) ensureConsentToken();
    } else {
      serverAttributionBlocked = true;
    }
    var storedChoice = accepted && !serverAttributionBlocked ? 'granted' : 'denied';
    try { localStorage.setItem(CONSENT_KEY, storedChoice); } catch { /* Choice still applies to this page. */ }
    if (loaded) window.gtag('consent', 'update', consentSettings(accepted));
    if (!accepted) {
      retryWithdrawals();
    }
    closeBanner();
    if (accepted && routeGroup()) { load(); trackPage(); }
  }

  function showBanner() {
    if (!routeGroup() || document.querySelector('[data-consent-banner]')) return;
    var banner = document.createElement('aside');
    banner.setAttribute('data-consent-banner', '');
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'إعدادات الخصوصية');
    banner.innerHTML = '<button type="button" data-consent-close aria-label="إغلاق إعدادات الخصوصية">×</button>' +
      '<p>تسمح لنا نقيس الزيارات والطلبات باستخدام Google Analytics عشان نحسّن تجربة سِراج؟ ' +
      'عند الموافقة نرسل معرّفات عميل وجلسة مستعارة، ومعرّفات المنتجات العامة، ورقم الطلب والمبالغ إلى Google لمعالجتها. ' +
      'لا نرسل بيانات التواصل أو صور الطفل أو تفاصيل قصته ضمن أحداث التحليلات.</p>' +
      '<p>تقدر تسحب موافقتك في أي وقت. السحب يمسح الربط من الطلبات المحفوظة، لكنه لا يمكن استرجاع بيانات أُرسلت بالفعل. ' +
      'إذا مسحت بيانات المتصفح أو استخدمت جهازًا آخر، تواصل معنا من صفحة <a href="/#/contact">اتصل بنا</a>.</p>' +
      '<p data-consent-withdrawal-status></p>' +
      '<div class="consent-actions"><button type="button" data-consent-accept>أوافق</button>' +
      '<button type="button" data-consent-reject>لا أوافق</button>' +
      '<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">خصوصية Google</a></div>';
    document.body.appendChild(banner);
    var status = banner.querySelector('[data-consent-withdrawal-status]');
    try {
      var outstanding = outstandingWithdrawals();
      if (!outstanding) {
        status.textContent = 'تعذّر حفظ حالة السحب في هذا المتصفح. تواصل معنا لإكمال الطلب.';
      } else if (outstanding.length) {
        status.textContent = 'طلب سحب الموافقة محفوظ وسيُعاد إرساله حتى تأكيده.';
      } else if (localStorage.getItem(WITHDRAWAL_STATUS_KEY) === 'acknowledged') {
        status.textContent = 'تم تأكيد سحب الموافقة من الطلبات المرتبطة بهذا المتصفح.';
      }
    } catch { status.textContent = 'تعذّر حفظ حالة السحب في هذا المتصفح.'; }
    banner.addEventListener('click', function (event) {
      var button = event.target.closest('button');
      if (!button) return;
      if (button.hasAttribute('data-consent-close')) closeBanner();
      else chooseConsent(button.hasAttribute('data-consent-accept'));
    });
  }

  function navigationChanged() {
    var publicPage = Boolean(routeGroup());
    window['ga-disable-' + MEASUREMENT_ID] = !granted || !publicPage;
    var manage = document.querySelector('[data-consent-manage]');
    if (manage) manage.hidden = !publicPage;
    if (!publicPage) { closeBanner(); lastPage = ''; return; }
    if (isOrderJourney()) {
      var banner = document.querySelector('[data-consent-banner]');
      if (banner) banner.remove();
    }
    if (granted) { load(); trackPage(); }
  }

  function isOrderJourney() {
    return ['cart', 'checkout', 'wizard', 'preview', 'success'].indexOf(routeGroup()) >= 0;
  }

  function observeNavigation() {
    ['pushState', 'replaceState'].forEach(function (method) {
      var original = history[method];
      history[method] = function () {
        var result = original.apply(this, arguments);
        navigationChanged();
        return result;
      };
    });
    window.addEventListener('popstate', navigationChanged);
    window.addEventListener('hashchange', navigationChanged);
  }

  function trackOrderSubmitted(summary) {
    if (!granted || !routeGroup() || !summary || !summary.transactionId) return;
    if (submitted.indexOf(summary.transactionId) >= 0) return;
    var items = Array.isArray(summary.items) ? summary.items.map(function (item) {
      return { item_id: item.itemId, price: item.price, quantity: item.quantity };
    }) : [];
    track('order_submitted', { transaction_id: summary.transactionId, value: summary.value,
      currency: 'EGP', shipping: summary.shipping, items: items });
    submitted.push(summary.transactionId);
    submitted = submitted.slice(-50);
    try { sessionStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submitted)); } catch { /* In-memory deduplication remains. */ }
  }

  function getAttribution() {
    return new Promise(function (resolve) {
      if (serverAttributionBlocked || !granted || !routeGroup() || typeof window.gtag !== 'function') return resolve(undefined);
      var consentToken = ensureConsentToken();
      if (!consentToken) return resolve(undefined);
      var identifiers = {};
      var finished = false;
      var timer = setTimeout(function () { finish(undefined); }, 1500);
      function finish(attribution) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        resolve(granted && routeGroup() && ensureConsentToken() === consentToken ? attribution : undefined);
      }
      function received(field, identifier) {
        identifiers[field] = String(identifier);
        if (/^\d{1,20}\.\d{1,20}$/.test(identifiers.clientId) && /^[1-9]\d{0,14}$/.test(identifiers.sessionId)) {
          finish({ consent: true, clientId: identifiers.clientId, sessionId: identifiers.sessionId,
            consentToken: consentToken });
        }
      }
      try {
        window.gtag('get', MEASUREMENT_ID, 'client_id', function (id) { received('clientId', id); });
        window.gtag('get', MEASUREMENT_ID, 'session_id', function (id) { received('sessionId', id); });
      } catch { finish(undefined); }
    });
  }

  function init() {
    if (!routeGroup()) return;
    var choice;
    try {
      choice = localStorage.getItem(CONSENT_KEY);
      var stored = JSON.parse(sessionStorage.getItem(SUBMISSIONS_KEY) || '[]');
      if (Array.isArray(stored)) submitted = stored.filter(function (id) { return typeof id === 'string'; }).slice(-50);
    } catch { /* Storage restrictions must never block shopping. */ }
    granted = choice === 'granted';
    serverAttributionBlocked = !granted;
    window['ga-disable-' + MEASUREMENT_ID] = !granted;
    var manage = document.createElement('button');
    manage.type = 'button';
    manage.textContent = 'الخصوصية';
    manage.setAttribute('data-consent-manage', '');
    document.body.appendChild(manage);
    manage.addEventListener('click', showBanner);
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeBanner(); });
    observeNavigation();
    window.addEventListener('storage', function (event) {
      if (event.key === CONSENT_KEY || event.key === null) {
        granted = event.key === CONSENT_KEY && event.newValue === 'granted';
        serverAttributionBlocked = !granted;
        window['ga-disable-' + MEASUREMENT_ID] = !granted || !routeGroup();
        if (loaded) window.gtag('consent', 'update', consentSettings(granted));
        if (granted) { ensureConsentToken(); load(); trackPage(); }
        else { closeBanner(); retryWithdrawals(); }
      } else if (event.key === WITHDRAWALS_KEY && event.newValue) {
        flushWithdrawals();
      }
    });
    window.addEventListener('online', retryWithdrawals);
    retryWithdrawals();
    if (granted) { ensureConsentToken(); load(); trackPage(); }
    // Never cover order controls with an unsolicited prompt. The privacy
    // button remains available, and tracking remains off without acceptance.
    else if (choice !== 'denied' && !isOrderJourney()) showBanner();
  }

  window.SerajAnalytics = { trackCheckout: function () { track('begin_checkout', { currency: 'EGP' }); },
    trackOrderSubmitted: trackOrderSubmitted, getAttribution: getAttribution };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
