document.body.classList.add('js');

const chapters = document.querySelectorAll('.chapter');
const progressBar = document.querySelector('[data-progress]');
const seal = document.querySelector('[data-seal]');
const secret = document.querySelector('[data-secret]');
const heartSvg = document.querySelector('.heart-nebula');
const heartImage = document.getElementById('heart-image');
const heartShape = document.getElementById('heart-shape');
const heartOutline = document.getElementById('heart-outline');
const year = document.querySelector('.year');
let spawnEmbersAt = null;
const sceneModal = document.querySelector('[data-scene-modal]');
const sceneModalTitle = document.querySelector('[data-scene-modal-title]');
const sceneModalDescription = document.querySelector('[data-scene-modal-description]');
const sceneModalLabel = document.querySelector('[data-scene-modal-label]');
const sceneClose = document.querySelector('[data-scene-close]');
const sceneCards = document.querySelectorAll('.chapter-card');

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.35 }
);

chapters.forEach((chapter) => revealObserver.observe(chapter));

let ticking = false;
const updateProgress = () => {
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollTop = window.scrollY;
  const raw = docHeight > 0 ? scrollTop / docHeight : 0;
  const percent = Math.min(Math.max(raw, 0), 1);
  if (progressBar) {
    progressBar.style.transform = `scaleX(${percent})`;
  }
};

const onScroll = () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      updateProgress();
      ticking = false;
    });
    ticking = true;
  }
};

window.addEventListener('scroll', onScroll, { passive: true });
updateProgress();

if (year) {
  const updateYearSpot = (event) => {
    const rect = year.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    year.style.setProperty('--spot-x', `${Math.max(0, Math.min(100, x))}%`);
    year.style.setProperty('--spot-y', `${Math.max(0, Math.min(100, y))}%`);
    year.style.setProperty('--spot-opacity', '1');
  };

  const clearYearSpot = () => {
    year.style.setProperty('--spot-opacity', '0');
  };

  year.addEventListener('pointerenter', updateYearSpot);
  year.addEventListener('pointermove', updateYearSpot);
  year.addEventListener('pointerleave', clearYearSpot);
}

const triggerSealEmbers = () => {
  if (!seal || !spawnEmbersAt) {
    return;
  }
  const rect = seal.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height * 0.45;
  spawnEmbersAt(x, y);
  spawnEmbersAt(x + 12, y + 6);
};

const particleCanvas = document.getElementById('particle-field');
const burstCanvas = document.getElementById('burst-field');

const initParticles = () => {
  if (!particleCanvas || !burstCanvas) {
    return;
  }

  const fieldCtx = particleCanvas.getContext('2d');
  const burstCtx = burstCanvas.getContext('2d');
  if (!fieldCtx || !burstCtx) {
    return;
  }
  burstCtx.globalCompositeOperation = 'lighter';

  const colors = [
    'rgba(255, 92, 122, 0.7)',
    'rgba(108, 168, 255, 0.7)',
    'rgba(168, 123, 255, 0.6)',
  ];
  const burstColors = ['#ff5c7a', '#6ca8ff', '#a87bff', '#ffd1df'];
  const bursts = [];
  const embers = [];

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let particles = [];
  let width = 0;
  let height = 0;
  let animationId = 0;

  const createParticles = () => {
    const count = Math.max(40, Math.min(140, Math.floor((width * height) / 15000)));
    return Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.6 + Math.random() * 1.8,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      alpha: 0.4 + Math.random() * 0.6,
      twinkle: 0.6 + Math.random() * 1.2,
      offset: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    [particleCanvas, burstCanvas].forEach((canvas) => {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    });
    fieldCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    burstCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles = createParticles();
  };

  const drawHeart = (context, x, y, size, rotation, color, alpha) => {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.scale(size, size);
    context.globalAlpha = alpha;
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(0, -0.3);
    context.bezierCurveTo(0, -0.85, -0.85, -0.85, -0.85, 0);
    context.bezierCurveTo(-0.85, 0.6, -0.1, 0.95, 0, 1.3);
    context.bezierCurveTo(0.1, 0.95, 0.85, 0.6, 0.85, 0);
    context.bezierCurveTo(0.85, -0.85, 0, -0.85, 0, -0.3);
    context.closePath();
    context.fill();
    context.restore();
  };

  const drawEmber = (ember) => {
    const gradient = burstCtx.createRadialGradient(
      ember.x,
      ember.y,
      0,
      ember.x,
      ember.y,
      ember.size * 2.4
    );
    gradient.addColorStop(0, `rgba(255, 255, 255, ${ember.alpha})`);
    gradient.addColorStop(0.35, `rgba(255, 190, 120, ${ember.alpha})`);
    gradient.addColorStop(0.7, `rgba(255, 110, 90, ${ember.alpha * 0.7})`);
    gradient.addColorStop(1, 'rgba(255, 90, 60, 0)');
    burstCtx.fillStyle = gradient;
    burstCtx.beginPath();
    burstCtx.arc(ember.x, ember.y, ember.size * 2.4, 0, Math.PI * 2);
    burstCtx.fill();
  };

  const draw = (timestamp = 0) => {
    const time = timestamp * 0.001;
    fieldCtx.clearRect(0, 0, width, height);

    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < -10) particle.x = width + 10;
      if (particle.x > width + 10) particle.x = -10;
      if (particle.y < -10) particle.y = height + 10;
      if (particle.y > height + 10) particle.y = -10;

      const flicker = 0.6 + 0.4 * Math.sin(time * particle.twinkle + particle.offset);
      fieldCtx.globalAlpha = particle.alpha * flicker;
      fieldCtx.fillStyle = particle.color;
      fieldCtx.beginPath();
      fieldCtx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      fieldCtx.fill();
    });

    fieldCtx.globalAlpha = 1;
    burstCtx.clearRect(0, 0, width, height);

    for (let i = bursts.length - 1; i >= 0; i -= 1) {
      const burst = bursts[i];
      burst.x += burst.vx;
      burst.y += burst.vy;
      burst.vy += 0.015;
      burst.alpha -= 0.02;
      burst.rotation += burst.spin;
      if (burst.alpha <= 0) {
        bursts.splice(i, 1);
        continue;
      }
      drawHeart(burstCtx, burst.x, burst.y, burst.size, burst.rotation, burst.color, burst.alpha);
    }

    for (let i = embers.length - 1; i >= 0; i -= 1) {
      const ember = embers[i];
      ember.x += ember.vx + Math.sin(time * 3 + ember.offset) * ember.sway;
      ember.y += ember.vy;
      ember.vy += 0.02;
      ember.alpha -= ember.decay;
      if (ember.alpha <= 0) {
        embers.splice(i, 1);
        continue;
      }
      drawEmber(ember);
    }

    if (!prefersReducedMotion.matches) {
      animationId = window.requestAnimationFrame(draw);
    }
  };

  const start = () => {
    if (animationId) {
      window.cancelAnimationFrame(animationId);
    }
    if (prefersReducedMotion.matches) {
      draw(0);
    } else {
      animationId = window.requestAnimationFrame(draw);
    }
  };

  resize();
  start();

  const spawnBurst = (x, y) => {
    if (prefersReducedMotion.matches) {
      return;
    }
    const count = 14;
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.6 + Math.random() * 1.4;
      bursts.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        alpha: 0.9,
        size: 4 + Math.random() * 4,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.08,
        color: burstColors[Math.floor(Math.random() * burstColors.length)],
      });
    }
  };

  const spawnEmbers = (x, y) => {
    if (prefersReducedMotion.matches) {
      return;
    }
    const count = 22;
    for (let i = 0; i < count; i += 1) {
      embers.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.6 - Math.random() * 1.6,
        alpha: 0.95,
        size: 1.2 + Math.random() * 2.2,
        decay: 0.02 + Math.random() * 0.015,
        sway: 0.15 + Math.random() * 0.35,
        offset: Math.random() * Math.PI * 2,
      });
    }
  };

  spawnEmbersAt = spawnEmbers;

  document.addEventListener('pointerdown', (event) => {
    const sealTarget = event.target.closest ? event.target.closest('.seal') : null;
    if (sealTarget) {
      return;
    }
    spawnBurst(event.clientX, event.clientY);
  });

  window.addEventListener('resize', resize);
  if (prefersReducedMotion.addEventListener) {
    prefersReducedMotion.addEventListener('change', start);
  } else if (prefersReducedMotion.addListener) {
    prefersReducedMotion.addListener(start);
  }
};

initParticles();

const heartShapes = [
  'M100 168c-3 0-6-1-9-3-18-12-38-28-57-48-15-16-24-33-24-50 0-24 17-41 39-41 16 0 31 9 41 24 10-15 25-24 41-24 22 0 39 17 39 41 0 17-9 34-24 50-19 20-39 36-57 48-3 2-6 3-9 3z',
  'M100 170c-4 0-7-2-10-4-19-12-40-28-58-47-15-16-23-33-23-50 0-23 16-40 38-40 17 0 32 9 43 25 11-16 26-25 43-25 22 0 38 17 38 40 0 17-8 34-23 50-18 19-39 35-58 47-3 2-6 4-10 4z',
  'M100 166c-5 0-10-2-13-5-20-14-39-29-55-47-13-15-21-31-21-47 0-22 15-38 36-38 17 0 33 11 43 28 10-17 26-28 43-28 21 0 36 16 36 38 0 16-8 32-21 47-16 18-35 33-55 47-3 3-8 5-13 5z',
];

const baseHeartImages = [
  'img/galaxy-heart.jpg',
  'img/constellation.jpg',
  'img/stars.jpg',
  'img/flowers.jpg',
  'img/moon.jpg',
  'img/secret.jpg',
  'img/neon.jpg',
  'img/summer.jpg',
];

const heartStyles = [
  { scale: 1, rotate: '0deg', filter: 'drop-shadow(0 10px 30px rgba(255, 92, 122, 0.6))' },
  { scale: 1.05, rotate: '-2deg', filter: 'drop-shadow(0 12px 36px rgba(108, 168, 255, 0.6))' },
  { scale: 0.98, rotate: '2deg', filter: 'drop-shadow(0 8px 26px rgba(168, 123, 255, 0.6))' },
];

const shufflePick = (count, lastIndex) => {
  if (count <= 1) {
    return 0;
  }
  let next = Math.floor(Math.random() * count);
  while (next === lastIndex) {
    next = Math.floor(Math.random() * count);
  }
  return next;
};

const rotateHeart = () => {
  if (!heartImage || !heartShape || !heartOutline || !heartSvg) {
    return;
  }

  let imageIndex = -1;
  let shapeIndex = -1;
  let styleIndex = -1;

  const update = () => {
    imageIndex = shufflePick(baseHeartImages.length, imageIndex);
    shapeIndex = shufflePick(heartShapes.length, shapeIndex);
    styleIndex = shufflePick(heartStyles.length, styleIndex);

    const image = baseHeartImages[imageIndex];
    const shape = heartShapes[shapeIndex];
    const style = heartStyles[styleIndex];

    heartImage.setAttribute('href', image);
    heartShape.setAttribute('d', shape);
    heartOutline.setAttribute('d', shape);
    heartSvg.style.setProperty('--heart-scale', style.scale);
    heartSvg.style.setProperty('--heart-rotate', style.rotate);
    heartSvg.style.filter = style.filter;
  };

  update();
  window.setInterval(update, 6500);
};

rotateHeart();

let lastActiveElement = null;
const closeScene = () => {
  if (!sceneModal) {
    return;
  }
  document.body.classList.remove('scene-open');
  sceneModal.setAttribute('aria-hidden', 'true');
  if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
    lastActiveElement.focus();
  }
};

const openScene = (chapter) => {
  if (!sceneModal || !chapter) {
    return;
  }
  const title = chapter.dataset.sceneTitle || chapter.querySelector('h3')?.textContent || 'Scene';
  const description = chapter.dataset.sceneDescription || '';
  const number = chapter.querySelector('.chapter-number')?.textContent || '';
  const month = chapter.querySelector('.month')?.textContent || '';
  const label = [number, month].filter(Boolean).join(' · ');

  if (sceneModalTitle) {
    sceneModalTitle.textContent = title;
  }
  if (sceneModalDescription) {
    sceneModalDescription.textContent = description;
  }
  if (sceneModalLabel) {
    sceneModalLabel.textContent = label || 'Scene';
  }

  lastActiveElement = document.activeElement;
  sceneModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('scene-open');
  if (sceneClose) {
    sceneClose.focus();
  }
};

if (sceneModal && sceneCards.length) {
  sceneCards.forEach((card) => {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Open scene details');
    const chapter = card.closest('.chapter');
    const handleOpen = () => openScene(chapter);
    card.addEventListener('click', handleOpen);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleOpen();
      }
    });
  });
}

if (sceneClose) {
  sceneClose.addEventListener('click', closeScene);
}

if (sceneModal) {
  sceneModal.addEventListener('click', (event) => {
    if (event.target === sceneModal) {
      closeScene();
    }
  });
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.body.classList.contains('scene-open')) {
    closeScene();
  }
});

const openSecret = () => {
  document.body.classList.add('secret-open');
  if (secret) {
    secret.setAttribute('aria-hidden', 'false');
  }
  if (seal) {
    seal.setAttribute('aria-expanded', 'true');
    seal.classList.add('is-burning');
  }
  triggerSealEmbers();
};

if (seal && secret) {
  let pressTimer;
  const startPress = () => {
    clearTimeout(pressTimer);
    pressTimer = setTimeout(openSecret, 900);
  };
  const stopPress = () => {
    clearTimeout(pressTimer);
  };

  seal.addEventListener('pointerdown', startPress);
  seal.addEventListener('pointerup', stopPress);
  seal.addEventListener('pointerleave', stopPress);
  seal.addEventListener('pointercancel', stopPress);
  seal.addEventListener('click', () => {
    seal.classList.add('is-burning');
    triggerSealEmbers();
    if (!document.body.classList.contains('secret-open')) {
      openSecret();
    }
  });
  seal.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      seal.classList.add('is-burning');
      triggerSealEmbers();
      openSecret();
    }
  });
}
