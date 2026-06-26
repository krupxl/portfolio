(function () {
  'use strict';

  // ── Knowledge base (real portfolio) — powers chips + offline fallback ──
  var qaArr = [
    { id:'role', q:'What does Krupal do?', keys:['do','role','who','about','job','work as'],
      a:"He's an IT Manager in London and the sole IT owner across two operating entities at Hydro Cleansing. He runs identity, endpoints, security, networking, vendors and support for around 80 users and 100+ devices — and took full ownership of the function in June 2024." },
    { id:'ring', q:'The RingCentral migration?', keys:['ringcentral','ring central','phone','telephony','voip','call'],
      a:"He moved the business off an unreliable phone system onto RingCentral with zero downtime — not a single minute of service lost — giving operations a platform they can finally count on.",
      eyebrow:'FEATURED · TELEPHONY · 2026', title:'Migrated telephony to RingCentral · 99.999% uptime', cardHref:'#work' },
    { id:'security', q:'Cyber Essentials Plus?', keys:['cyber essentials','security','certif','ce+','hardening','mfa','conditional access','compliance'],
      a:"He delivered Cyber Essentials Plus — the audited tier — solo, passing the hands-on assessment across the estate. Underneath it: Conditional Access, enforced MFA, exception handling and break-glass accounts, all hardened, documented and audit-ready.",
      eyebrow:'SECURITY · 2026', title:'Delivered Cyber Essentials Plus, solo', cardHref:'#work' },
    { id:'identity', q:'Intune & identity work?', keys:['intune','identity','iam','azure','entra','sso','sign-on','autopilot','endpoint','active directory'],
      a:"He retired on-prem Active Directory and moved 100% of the Windows estate plus ~30 mobile devices onto Microsoft Intune with Autopilot, then unified sign-on across Microsoft 365, Google Workspace and Apple work accounts — one identity, one set of controls.",
      eyebrow:'IDENTITY & ENDPOINTS · 2022', title:'Modernised identity & unified sign-on', cardHref:'#work' },
    { id:'certs', q:'Which certifications?', keys:['certif','qualif','credential','isc2','sc-300','cissp','cism','exam'],
      a:"ISC2 Certified in Cybersecurity (CC) and Cyber Essentials Plus, with Microsoft SC-300 in progress (booked August). From there he's mapping a route through SC-100, CISSP and toward CISM as he moves into security architecture." },
    { id:'direction', q:"Where's he heading?", keys:['heading','future','next','goal','aspir','architecture','governance','grc','career'],
      a:"Into security architecture and governance — moving from operating a cloud-native Microsoft estate to designing and governing it, building toward owning a security function end to end." },
    { id:'contact', q:'How do I reach him?', keys:['contact','reach','email','hire','touch','linkedin','available','get in'],
      a:"The quickest routes are email or LinkedIn. Krupal is open to IT leadership roles and conversations about security, infrastructure and governance.",
      contact:true },
  ];

  function cipherTurn(o) {
    return Object.assign({
      isUser:false, isCipher:true, loading:false,
      text:'', note:'', eyebrow:'', title:'', cardHref:'#', contact:false,
    }, o);
  }

  function introTurn() {
    return cipherTurn({
      text: "I'm Cipher — Krupal's portfolio assistant. Ask me anything about his work, security and identity experience, certifications, or how to reach him.",
      note: "Answers are drawn from Krupal's portfolio.",
    });
  }

  var state = {
    cipherOpen: false,
    scrolled: false,
    nearAskFirst: false,
    busy: false,
    msgs: [introTurn()],
    asked: [],
    dragging: false,
  };
  var apiHistory = [];

  // ── DOM refs ──
  var dockEl = document.getElementById('cipherDock');
  var wrapEl = document.getElementById('cipherWrap');
  var cardEl = document.getElementById('cipherCard');
  var headerEl = document.getElementById('cipherHeader');
  var messagesEl = document.getElementById('cipherMessages');
  var chipsWrapEl = document.getElementById('cipherChips');
  var chipsListEl = document.getElementById('cipherChipsList');
  var inputEl = document.getElementById('cipherInput');
  var sendBtnEl = document.getElementById('cipherSend');
  var resetBtnEl = document.getElementById('cipherReset');
  var minimizeBtnEl = document.getElementById('cipherMinimize');
  var heroAskBarEl = document.getElementById('heroAskBar');
  var heroAskAnchorEl = document.getElementById('heroAskAnchor');
  var askCipherFirstEl = document.getElementById('askCipherFirst');

  // ── Rendering ──
  function buildUserBubble(text) {
    var wrap = document.createElement('div');
    wrap.className = 'cipher-turn';
    var bubble = document.createElement('div');
    bubble.className = 'cipher-bubble-user';
    bubble.textContent = text;
    wrap.appendChild(bubble);
    return wrap;
  }

  function contactRow(label, value) {
    var row = document.createElement('div');
    row.className = 'cipher-contact-block__row';
    var l = document.createElement('span');
    l.className = 'cipher-contact-block__label';
    l.textContent = label;
    var v = document.createElement('span');
    v.className = 'cipher-contact-block__value';
    v.textContent = value;
    row.appendChild(l);
    row.appendChild(v);
    return row;
  }

  function buildCipherTurn(turn) {
    var wrap = document.createElement('div');
    wrap.className = 'cipher-turn';

    var row = document.createElement('div');
    row.className = 'cipher-turn-cipher';

    var avatar = document.createElement('div');
    avatar.className = 'cipher-turn-cipher__avatar';
    avatar.innerHTML = '<svg width="15" height="15" viewBox="0 0 100 100" fill="none" style="overflow:visible"><use href="#cgSimple"></use></svg>';
    row.appendChild(avatar);

    var body = document.createElement('div');
    body.className = 'cipher-turn-cipher__body';

    if (turn.loading) {
      var dots = document.createElement('div');
      dots.className = 'cipher-loading-dots';
      dots.innerHTML = '<span></span><span></span><span></span>';
      body.appendChild(dots);
    }
    if (turn.text && !turn.loading) {
      var t = document.createElement('div');
      t.className = 'cipher-text';
      t.textContent = turn.text;
      body.appendChild(t);
    }
    if (turn.note) {
      var n = document.createElement('div');
      n.className = 'cipher-note';
      n.textContent = turn.note;
      body.appendChild(n);
    }
    if (turn.title) {
      var a = document.createElement('a');
      a.className = 'cipher-card-link';
      a.href = turn.cardHref || '#';
      var eyebrow = document.createElement('div');
      eyebrow.className = 'cipher-card-link__eyebrow';
      eyebrow.textContent = turn.eyebrow || '';
      var rowDiv = document.createElement('div');
      rowDiv.className = 'cipher-card-link__row';
      var titleDiv = document.createElement('div');
      titleDiv.className = 'cipher-card-link__title';
      titleDiv.textContent = turn.title;
      var arrow = document.createElement('span');
      arrow.className = 'cipher-card-link__arrow';
      arrow.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"></path><path d="M8 7h9v9"></path></svg>';
      rowDiv.appendChild(titleDiv);
      rowDiv.appendChild(arrow);
      a.appendChild(eyebrow);
      a.appendChild(rowDiv);
      body.appendChild(a);
    }
    if (turn.contact) {
      var block = document.createElement('div');
      block.className = 'cipher-contact-block';
      block.appendChild(contactRow('EMAIL', 'k@tandel.uk'));
      block.appendChild(contactRow('LINKEDIN', 'in/krupaltandel'));
      var actions = document.createElement('div');
      actions.className = 'cipher-contact-block__actions';
      var emailBtn = document.createElement('a');
      emailBtn.href = 'mailto:k@tandel.uk';
      emailBtn.className = 'cipher-contact-block__email';
      emailBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-10 5L2 7"></path></svg>Email Krupal';
      var liBtn = document.createElement('a');
      liBtn.href = 'https://linkedin.com/in/krupaltandel';
      liBtn.target = '_blank';
      liBtn.rel = 'noopener';
      liBtn.className = 'cipher-contact-block__linkedin';
      liBtn.textContent = 'LinkedIn';
      actions.appendChild(emailBtn);
      actions.appendChild(liBtn);
      block.appendChild(actions);
      body.appendChild(block);
    }

    row.appendChild(body);
    wrap.appendChild(row);
    return wrap;
  }

  function renderMessages() {
    messagesEl.innerHTML = '';
    state.msgs.forEach(function (turn) {
      messagesEl.appendChild(turn.isUser ? buildUserBubble(turn.text) : buildCipherTurn(turn));
    });
  }

  function renderChips() {
    chipsListEl.innerHTML = '';
    var items = qaArr.filter(function (x) { return state.asked.indexOf(x.id) === -1; }).slice(0, 5);
    chipsWrapEl.hidden = items.length === 0;
    items.forEach(function (item) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cipher-chip';
      btn.textContent = item.q;
      btn.addEventListener('click', function () {
        state.asked.push(item.id);
        send(item.q);
      });
      chipsListEl.appendChild(btn);
    });
  }

  function render() {
    renderMessages();
    renderChips();
  }

  function scrollDown() {
    requestAnimationFrame(function () {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  // ── Open / close ──
  function updateDockVisibility() {
    dockEl.hidden = !(state.scrolled && !state.cipherOpen && !state.nearAskFirst);
  }
  function openCipher() {
    state.cipherOpen = true;
    wrapEl.hidden = false;
    updateDockVisibility();
    setTimeout(function () { if (inputEl) inputEl.focus(); }, 80);
  }
  function openWith(q) {
    openCipher();
    if (q) setTimeout(function () { send(q); }, 120);
  }
  function closeCipher() {
    state.cipherOpen = false;
    wrapEl.hidden = true;
    updateDockVisibility();
  }
  function resetCipher() {
    apiHistory = [];
    state.msgs = [introTurn()];
    state.asked = [];
    state.busy = false;
    render();
    setTimeout(function () { if (inputEl) inputEl.focus(); }, 60);
  }

  // ── Drag (move the floating panel anywhere) ──
  var dragOffX = 0, dragOffY = 0;
  function startDrag(e) {
    if (e.target.closest && e.target.closest('button, a, input')) return;
    var rect = cardEl.getBoundingClientRect();
    dragOffX = e.clientX - rect.left;
    dragOffY = e.clientY - rect.top;
    wrapEl.style.left = rect.left + 'px';
    wrapEl.style.top = rect.top + 'px';
    wrapEl.style.right = 'auto';
    wrapEl.style.bottom = 'auto';
    state.dragging = true;
    headerEl.classList.add('is-dragging');
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragEnd, { once: true });
    e.preventDefault();
  }
  function onDragMove(e) {
    var w = cardEl.offsetWidth;
    var h = cardEl.offsetHeight;
    var m = 8;
    var x = Math.max(m, Math.min(e.clientX - dragOffX, window.innerWidth - w - m));
    var y = Math.max(m, Math.min(e.clientY - dragOffY, window.innerHeight - h - m));
    wrapEl.style.left = x + 'px';
    wrapEl.style.top = y + 'px';
  }
  function onDragEnd() {
    state.dragging = false;
    headerEl.classList.remove('is-dragging');
    window.removeEventListener('pointermove', onDragMove);
  }

  // ── Composer ──
  async function send(raw) {
    var text = (raw || '').trim();
    if (!text || state.busy) return;
    if (inputEl) inputEl.value = '';

    state.msgs.push({ isUser: true, isCipher: false, text: text });
    state.msgs.push(cipherTurn({ loading: true }));
    state.busy = true;
    render();
    scrollDown();

    var reply;
    try {
      reply = await ask(text);
    } catch (err) {
      reply = fallback(text, true);
    }
    for (var i = state.msgs.length - 1; i >= 0; i--) {
      if (state.msgs[i].isCipher && state.msgs[i].loading) { state.msgs[i] = reply; break; }
    }
    state.busy = false;
    render();
    scrollDown();
  }

  async function ask(text) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 15000);
    var res;
    try {
      res = await fetch('/.netlify/functions/cipher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: apiHistory }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) throw new Error('Cipher function error: ' + res.status);
    var data = await res.json();
    var answer = ((data && data.reply) || '').trim();
    if (!answer) return fallback(text, true);

    apiHistory.push({ role: 'user', content: text });
    apiHistory.push({ role: 'assistant', content: answer });

    var wantsContact = /contact|reach|email|hire|hiring|touch|linkedin|available|connect/i.test(text);
    return cipherTurn({ text: answer, contact: wantsContact });
  }

  // Offline / error fallback over the local knowledge base
  function fallback(text, errored) {
    var t = text.toLowerCase();
    var best = null, score = 0;
    qaArr.forEach(function (item) {
      var s = 0;
      item.keys.forEach(function (k) { if (t.indexOf(k) !== -1) s += k.length; });
      if (s > score) { score = s; best = item; }
    });
    if (best && score > 0) {
      return cipherTurn({
        text: best.a, eyebrow: best.eyebrow || '', title: best.title || '',
        cardHref: best.cardHref || '#', contact: !!best.contact,
      });
    }
    return cipherTurn({
      text: errored
        ? "I couldn't reach my live brain just now. Here's the short version: Krupal is a London-based IT Manager and sole IT owner who's delivered Cyber Essentials Plus and a zero-downtime RingCentral migration. For anything specific, email k@tandel.uk."
        : "That's a good question — but it's not something I can answer from the portfolio. Try asking about his security work, identity & Intune projects, certifications, or how to reach him.",
      contact: true,
    });
  }

  // ── Scroll-triggered footer dock ──
  function setScrolled(p) {
    if (p !== state.scrolled) {
      state.scrolled = p;
      updateDockVisibility();
    }
  }
  function initScrollWatch() {
    if (!heroAskAnchorEl) return;
    if (typeof IntersectionObserver !== 'undefined') {
      var io = new IntersectionObserver(function (entries) {
        var e = entries[0];
        setScrolled(!e.isIntersecting && e.boundingClientRect.top < 0);
      }, { threshold: 0 });
      io.observe(heroAskAnchorEl);
    }
    window.addEventListener('scroll', function () {
      setScrolled(heroAskAnchorEl.getBoundingClientRect().bottom < 8);
    }, { passive: true });
  }

  // ── Hide the footer dock once the inline "Ask Cipher first" CTA is in view ──
  function setNearAskFirst(p) {
    if (p !== state.nearAskFirst) {
      state.nearAskFirst = p;
      updateDockVisibility();
    }
  }
  function initAskFirstWatch() {
    if (!askCipherFirstEl) return;
    if (typeof IntersectionObserver !== 'undefined') {
      var io = new IntersectionObserver(function (entries) {
        setNearAskFirst(entries[0].isIntersecting);
      }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
      io.observe(askCipherFirstEl);
    }
  }

  // ── Wiring ──
  function bindActivate(el, fn) {
    if (!el) return;
    el.addEventListener('click', fn);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
    });
  }

  bindActivate(heroAskBarEl, function () { openCipher(); });
  bindActivate(dockEl, function () { openCipher(); });
  bindActivate(askCipherFirstEl, function () { openCipher(); });

  document.querySelectorAll('.ask-bar__suggest').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openWith(btn.getAttribute('data-q'));
    });
  });

  headerEl.addEventListener('pointerdown', startDrag);
  resetBtnEl.addEventListener('click', resetCipher);
  minimizeBtnEl.addEventListener('click', closeCipher);

  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(inputEl.value);
    }
  });
  sendBtnEl.addEventListener('click', function () { send(inputEl.value); });

  render();
  initScrollWatch();
  initAskFirstWatch();
})();
