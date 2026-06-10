/* ═══════════════════════════════════════════
   STREAM TVFAST – main.js
═══════════════════════════════════════════ */

'use strict';

// ── Utilidades ──────────────────────────────
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

/* ═══════════════════════════════════════════
   1. CANVAS HERO – partículas + red tecnológica
═══════════════════════════════════════════ */
function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles, animId;

  // Detecta preferencia de movimiento reducido
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    canvas.style.opacity = '0.3';
  }

  const CONFIG = {
    count: window.innerWidth < 600 ? 55 : 110,
    maxDist: 140,
    speed: 0.45,
    dotRadius: 1.8,
    colors: {
      particle: 'rgba(9, 167, 240, 0.75)',
      line: 'rgba(9, 167, 240, ',
      glow: 'rgba(238, 21, 108, 0.5)',
    },
  };

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function createParticle() {
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 0.6 + 0.2) * CONFIG.speed;
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: Math.random() * CONFIG.dotRadius + 0.8,
      pulse: Math.random() * Math.PI * 2, // fase para pulso
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: CONFIG.count }, createParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Líneas entre partículas cercanas
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.maxDist) {
          const alpha = (1 - dist / CONFIG.maxDist) * 0.4;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = CONFIG.colors.line + alpha + ')';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Partículas
    particles.forEach((p) => {
      p.pulse += 0.02;
      const pulseFactor = 0.85 + Math.sin(p.pulse) * 0.15;

      // Glow suave en algunas partículas
      if (p.r > 1.8) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4 * pulseFactor, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        grad.addColorStop(0, 'rgba(9,167,240,0.18)');
        grad.addColorStop(1, 'rgba(9,167,240,0)');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * pulseFactor, 0, Math.PI * 2);
      ctx.fillStyle = CONFIG.colors.particle;
      ctx.fill();

      // Mover
      p.x += p.vx;
      p.y += p.vy;

      // Rebotar en bordes
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    });
  }

  function loop() {
    if (prefersReduced) return;
    draw();
    animId = requestAnimationFrame(loop);
  }

  // Resize debounced
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      cancelAnimationFrame(animId);
      init();
      loop();
    }, 200);
  });

  init();
  if (prefersReduced) {
    draw(); // Un solo frame estático
  } else {
    loop();
  }
}

/* ═══════════════════════════════════════════
   2. CONTADOR ANIMADO DE ESTADÍSTICAS
═══════════════════════════════════════════ */
function initCounters() {
  const statNums = $$('.hero__stat-num[data-target]');
  if (!statNums.length) return;

  const duration = 1800;

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const start = performance.now();

    function step(now) {
      const elapsed = Math.min((now - start) / duration, 1);
      // Easing ease-out cubic
      const progress = 1 - Math.pow(1 - elapsed, 3);
      el.textContent = Math.floor(progress * target).toLocaleString('es-CL');
      if (elapsed < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString('es-CL');
    }

    requestAnimationFrame(step);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  statNums.forEach((el) => observer.observe(el));
}

/* ═══════════════════════════════════════════
   3. HEADER – scroll + menú móvil
═══════════════════════════════════════════ */
function initHeader() {
  const header  = $('.header');
  const menuBtn = $('.menu-icon');
  const navLinks = $('.nav-links');
  if (!header || !menuBtn || !navLinks) return;

  // Scroll → clase scrolled
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', window.scrollY > 60);
        ticking = false;
      });
      ticking = true;
    }
  });
  header.classList.toggle('scrolled', window.scrollY > 60);

  // Toggle menú
  menuBtn.addEventListener('click', () => {
    const open = navLinks.classList.toggle('active');
    menuBtn.setAttribute('aria-expanded', open);
  });

  // Cerrar al hacer click en un link
  navLinks.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      navLinks.classList.remove('active');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Cerrar al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
      navLinks.classList.remove('active');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ═══════════════════════════════════════════
   4. SWIPER – galería de películas
═══════════════════════════════════════════ */
function initSwipers() {
  if (!window.Swiper) return;

  if ($('.mySwiper')) {
    new Swiper('.mySwiper', {
      effect: 'coverflow',
      grabCursor: true,
      centeredSlides: true,
      slidesPerView: 'auto',
      loop: true,
      autoplay: {
        delay: 2500,
        disableOnInteraction: false,
      },
      coverflowEffect: {
        rotate: 20,
        stretch: 0,
        depth: 250,
        modifier: 1,
        slideShadows: true,
      },
    });
  }
}

/* ═══════════════════════════════════════════
   5. SCROLL REVEAL – fade-in suave
═══════════════════════════════════════════ */
function initScrollReveal() {
  const targets = $$(
    '.plan-card, .rev-card, .feature, .section-header, .catalogo__text, .catalogo__swiper-wrap, .contacto__info, .contacto__form'
  );

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          entry.target.style.animationDelay = `${i * 0.05}s`;
          entry.target.classList.add('revealed');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 }
  );

  targets.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    obs.observe(el);
  });

  // Agregar clase revealed = visible
  document.head.insertAdjacentHTML('beforeend', `
    <style>
      .revealed { opacity: 1 !important; transform: translateY(0) !important; }
    </style>
  `);
}

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initHeroCanvas();
  initCounters();
  initHeader();
  initSwipers();
  initScrollReveal();
});
