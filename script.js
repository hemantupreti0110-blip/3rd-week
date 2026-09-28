/* ==========================================================================
   Mira Voss portfolio — interactivity
   Plain JavaScript, no dependencies. Every feature is its own init function
   that first checks its elements exist, so removing markup never throws.
   Features: mobile nav, active-section link, gallery filter, lightbox,
   scroll reveal, stat counters, form validation, back-to-top.
   ========================================================================== */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hasObserver = 'IntersectionObserver' in window;

  /* ------------------------------------------------------------------------
     1. Mobile navigation
     A real <button> with aria-expanded replaces the earlier checkbox trick, so
     assistive tech is told the menu's state, and the menu can close itself on
     link click, Escape, outside click, or when the viewport grows.
     ------------------------------------------------------------------------ */
  function initNav() {
    const toggle = $('.nav-toggle');
    const nav = $('#primary-nav');
    if (!toggle || !nav) return;

    const setOpen = (open, { returnFocus = false } = {}) => {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      if (!open && returnFocus) toggle.focus();
    };
    const isOpen = () => nav.classList.contains('is-open');

    toggle.addEventListener('click', () => setOpen(!isOpen()));

    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen()) setOpen(false, { returnFocus: true });
    });

    document.addEventListener('click', (event) => {
      if (isOpen() && !event.target.closest('.header-inner')) setOpen(false);
    });

    window.matchMedia('(max-width: 600px)').addEventListener('change', () => setOpen(false));
  }

  /* ------------------------------------------------------------------------
     2. Active-section highlighting
     IntersectionObserver watches a thin band across the middle of the
     viewport; whichever section crosses it gets aria-current="true".
     Cheaper than a scroll listener, and it reads correctly to screen readers.
     ------------------------------------------------------------------------ */
  function initActiveLink() {
    if (!hasObserver) return;

    const links = new Map(
      $$('.main-nav a[href^="#"]').map((a) => [a.getAttribute('href').slice(1), a])
    );
    const targets = ['top', ...links.keys()].map((id) => document.getElementById(id)).filter(Boolean);
    if (!links.size) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((a) => a.removeAttribute('aria-current'));
          const link = links.get(entry.target.id);
          if (link) link.setAttribute('aria-current', 'true');
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    targets.forEach((section) => observer.observe(section));
  }

  /* ------------------------------------------------------------------------
     3. Gallery filter
     Filter buttons ship `hidden` in the HTML and are revealed here, so
     visitors without JavaScript never see controls that do nothing.
     ------------------------------------------------------------------------ */
  function initFilter() {
    const group = $('.filters');
    const items = $$('.gallery-item');
    const status = $('#filter-status');
    if (!group || !items.length) return;

    const buttons = $$('.filter-btn', group);
    const countFor = (key) => (key === 'all' ? items.length : items.filter((i) => i.dataset.tone === key).length);

    buttons.forEach((button) => {
      const badge = $('.count', button);
      if (badge) badge.textContent = countFor(button.dataset.filter);
    });
    group.hidden = false;

    // Replays the entrance animation on items that were already revealed.
    const replay = (item, order) => {
      if (reduceMotion.matches || !item.classList.contains('is-visible')) return;
      item.classList.remove('is-visible');
      item.style.setProperty('--reveal-delay', `${order * 70}ms`);
      void item.offsetWidth; // force reflow so the transition restarts
      item.classList.add('is-visible');
    };

    const apply = (activeButton) => {
      const filter = activeButton.dataset.filter;
      let shown = 0;

      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === activeButton)));
      items.forEach((item) => {
        const match = filter === 'all' || item.dataset.tone === filter;
        item.hidden = !match;
        if (match) replay(item, shown++);
      });

      status.textContent =
        filter === 'all'
          ? `Showing all ${items.length} studies.`
          : `Showing ${shown} of ${items.length} studies: ${filter} tones.`;
    };

    group.addEventListener('click', (event) => {
      const button = event.target.closest('.filter-btn');
      if (button) apply(button);
    });
  }

  /* ------------------------------------------------------------------------
     4. Lightbox
     Uses the native <dialog> element: showModal() traps focus, makes the page
     behind inert, and closes on Escape for free. Gallery images are ordinary
     links to the large file, so without JavaScript they still open the image.
     ------------------------------------------------------------------------ */
  function initLightbox() {
    const dialog = $('#lightbox');
    const gallery = $('.gallery');
    if (!dialog || !gallery || typeof dialog.showModal !== 'function') return;

    const image = $('.lightbox-img', dialog);
    const caption = $('.lightbox-caption', dialog);
    const counter = $('.lightbox-count', dialog);
    const prev = $('.lightbox-prev', dialog);
    const next = $('.lightbox-next', dialog);
    const closeButton = $('.lightbox-close', dialog);
    const figure = $('.lightbox-figure', dialog);

    let items = [];
    let index = 0;
    let trigger = null;

    const show = (position) => {
      index = (position + items.length) % items.length; // wraps at both ends
      const item = items[index];
      const link = $('.gallery-link', item);
      const thumb = $('img', link);

      image.classList.add('is-loading');
      image.onload = image.onerror = () => image.classList.remove('is-loading');
      image.alt = thumb.alt;
      image.src = link.href;

      caption.textContent = `${$('.cap-title', item).textContent} — ${$('.cap-meta', item).textContent}`;
      counter.textContent = `${index + 1} / ${items.length}`;

      // Warm the cache for the neighbour we are most likely to view next.
      if (items.length > 1) new Image().src = $('.gallery-link', items[(index + 1) % items.length]).href;
    };

    const open = (item, opener) => {
      items = $$('.gallery-item').filter((el) => !el.hidden); // respects the active filter
      trigger = opener;
      const single = items.length < 2;
      prev.hidden = next.hidden = single;
      show(items.indexOf(item));
      dialog.showModal();
      document.documentElement.classList.add('lightbox-open');
    };

    gallery.addEventListener('click', (event) => {
      const link = event.target.closest('.gallery-link');
      if (!link) return;
      event.preventDefault();
      open(link.closest('.gallery-item'), link);
    });

    prev.addEventListener('click', () => show(index - 1));
    next.addEventListener('click', () => show(index + 1));
    closeButton.addEventListener('click', () => dialog.close());

    dialog.addEventListener('keydown', (event) => {
      if (items.length < 2) return;
      if (event.key === 'ArrowLeft') show(index - 1);
      if (event.key === 'ArrowRight') show(index + 1);
    });

    // A click on the backdrop lands on the <dialog> element itself.
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });

    // Swipe left / right on touch screens.
    let startX = null;
    figure.addEventListener('touchstart', (event) => { startX = event.changedTouches[0].clientX; }, { passive: true });
    figure.addEventListener('touchend', (event) => {
      if (startX === null || items.length < 2) return;
      const deltaX = event.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(deltaX) > 50) show(index + (deltaX < 0 ? 1 : -1));
    }, { passive: true });

    // 'close' fires for the button, Escape and backdrop alike.
    dialog.addEventListener('close', () => {
      document.documentElement.classList.remove('lightbox-open');
      image.removeAttribute('src');
      if (trigger) trigger.focus();
    });
  }

  /* ------------------------------------------------------------------------
     5. Scroll reveal
     Elements with data-reveal fade up once as they enter the viewport. The
     hiding CSS only applies under html.js, and reduced-motion users skip
     the animation entirely.
     ------------------------------------------------------------------------ */
  function initReveal() {
    const elements = $$('[data-reveal]');
    if (!elements.length) return;

    if (!hasObserver || reduceMotion.matches) {
      elements.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    // Stagger neighbours within each row of the gallery.
    $$('.gallery-item').forEach((el, i) => el.style.setProperty('--reveal-delay', `${(i % 3) * 80}ms`));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // animate once, then stop watching
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    elements.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------------
     6. Stat counters
     Numbers count up when scrolled into view. The final value is already in
     the HTML, so it is correct without JavaScript and for reduced motion.
     ------------------------------------------------------------------------ */
  function initCounters() {
    const numbers = $$('[data-count]');
    if (!numbers.length || !hasObserver || reduceMotion.matches) return;

    const animate = (el) => {
      const target = Number(el.dataset.count);
      const duration = 900;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))); // ease-out cubic
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    numbers.forEach((el) => { el.textContent = '0'; });
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          animate(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    numbers.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------------
     7. Contact form validation
     Custom messages, shown on blur and then live as the user corrects them.
     Errors are tied to inputs with aria-describedby / aria-invalid, and focus
     jumps to the first invalid field on submit. There is no backend here, so
     a successful submit is simulated and says so.
     ------------------------------------------------------------------------ */
  function initForm() {
    const form = $('#contact-form');
    if (!form) return;

    const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const MAX = 500;

    const rules = {
      name: (v) => (v.trim().length >= 2 ? '' : 'Please enter your name (at least 2 characters).'),
      email: (v) => {
        const value = v.trim();
        if (!value) return 'Please enter your email address.';
        return EMAIL.test(value) ? '' : 'That doesn\u2019t look like a valid email address.';
      },
      message: (v) => (v.trim().length >= 10 ? '' : 'Please write at least 10 characters so I know how to help.'),
    };

    const inputs = Object.fromEntries(Object.keys(rules).map((key) => [key, $(`#${key}`, form)]));
    const status = $('#form-status');
    const submit = $('button[type="submit"]', form);
    const topic = $('#topic', form);
    const counter = $('#message-count');
    const touched = new Set();

    const placeholders = {
      print: 'Which study are you interested in, and what size?',
      commission: 'Tell me about the place, the timeline and how the work will be used.',
      press: 'Which publication is this for, and what is your deadline?',
    };

    const validate = (key) => {
      const input = inputs[key];
      const message = rules[key](input.value);
      const error = $(`#${key}-error`);
      error.textContent = message;
      error.hidden = !message;
      input.setAttribute('aria-invalid', String(Boolean(message)));
      input.closest('.field').classList.toggle('has-error', Boolean(message));
      return !message;
    };

    const setStatus = (text, kind = '') => {
      status.textContent = text;
      status.className = `form-status${kind ? ` is-${kind}` : ''}`;
    };

    const updateCounter = () => {
      const length = inputs.message.value.length;
      counter.textContent = `${length} / ${MAX}`;
      counter.classList.toggle('is-near', length >= MAX - 50);
    };

    Object.keys(rules).forEach((key) => {
      inputs[key].addEventListener('blur', () => { touched.add(key); validate(key); });
      inputs[key].addEventListener('input', () => {
        if (touched.has(key)) validate(key); // live feedback only after the first visit
        if (status.classList.contains('is-success')) setStatus('');
      });
    });

    inputs.message.addEventListener('input', updateCounter);
    topic.addEventListener('change', () => { inputs.message.placeholder = placeholders[topic.value]; });

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      let firstInvalid = null;
      Object.keys(rules).forEach((key) => {
        touched.add(key);
        if (!validate(key) && !firstInvalid) firstInvalid = inputs[key];
      });

      if (firstInvalid) {
        setStatus('Please fix the highlighted fields.', 'error');
        firstInvalid.focus();
        return;
      }

      const firstName = inputs.name.value.trim().split(/\s+/)[0];
      submit.disabled = true;
      submit.textContent = 'Sending\u2026';
      setStatus('');

      setTimeout(() => { // stands in for a network request
        form.reset();
        touched.clear();
        Object.keys(rules).forEach((key) => {
          inputs[key].removeAttribute('aria-invalid');
          $(`#${key}-error`).hidden = true;
          inputs[key].closest('.field').classList.remove('has-error');
        });
        inputs.message.placeholder = placeholders[topic.value];
        updateCounter();
        submit.disabled = false;
        submit.textContent = 'Send message';
        setStatus(`Thanks, ${firstName}. Your message is ready to send. (Demo form: nothing was transmitted.)`, 'success');
      }, 700);
    });
  }

  /* ------------------------------------------------------------------------
     8. Back-to-top button
     Appears once the hero has scrolled out of view.
     ------------------------------------------------------------------------ */
  function initBackToTop() {
    const button = $('.back-to-top');
    const hero = $('#top');
    if (!button || !hero || !hasObserver) return;

    new IntersectionObserver(([entry]) => {
      button.classList.toggle('is-visible', !entry.isIntersecting);
    }).observe(hero);

    button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });
  }

  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */
  [initNav, initActiveLink, initFilter, initLightbox, initReveal, initCounters, initForm, initBackToTop]
    .forEach((init) => init());
})();
