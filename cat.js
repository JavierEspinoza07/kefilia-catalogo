/* cat.js — Kefilia enhancement layer */

const hero          = document.querySelector(".catalog-head");
const heroCopy      = document.querySelector(".hero-copy");
const productGrid   = document.querySelector(".products-grid");
const cartListEl    = document.getElementById("cartList");
const cartBlock     = document.querySelector(".cart-static");
const cartWhatsapp  = document.getElementById("cartWA");
const floatingCta   = document.getElementById("floatingCta");
const floatingCount = document.getElementById("floatingCartCount");
const toastStack    = document.getElementById("toastStack");

let lastCount = 0;
const defaultHref = floatingCta?.getAttribute("href") || "#";

/* ── CART EFFECTS ── */
function readCartCount() {
  return Array.from(document.querySelectorAll("#cartList .pill.soft"))
    .reduce((sum, pill) => {
      const m = pill.textContent.match(/×(\d+)/i);
      return sum + (m ? Number(m[1]) : 0);
    }, 0);
}

function updateCartEffects() {
  const count = readCartCount();
  if (floatingCount) floatingCount.textContent = String(count);
  if (cartBlock) cartBlock.classList.toggle("is-hot", count > 0);
  if (floatingCta) {
    const href = count > 0 && cartWhatsapp
      ? cartWhatsapp.getAttribute("href") || "#"
      : defaultHref;
    floatingCta.setAttribute("href", href);
  }
  if (floatingCta && count !== lastCount) {
    floatingCta.classList.remove("bump");
    void floatingCta.offsetWidth;
    floatingCta.classList.add("bump");
  }
  lastCount = count;
}

/* ── TOAST ── */
function showToast(msg) {
  if (!toastStack) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  toastStack.appendChild(el);
  setTimeout(() => el.remove(), 2700);
}

/* ── CONFETTI ── */
function burstConfetti(x, y) {
  const colors = ["#ff8a5b","#ffd166","#8edcc8","#ff5d8f","#b38cdc","#5ee8a0"];
  for (let i = 0; i < 20; i++) {
    const p = document.createElement("span");
    p.className = "confetti-piece";
    p.style.cssText = `left:${x}px;top:${y}px;background:${colors[i % colors.length]}`;
    p.style.setProperty("--dx", `${(Math.random()*2-1)*150}px`);
    p.style.setProperty("--dy", `${90 + Math.random()*130}px`);
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 950);
  }
}

/* ── SCROLL REVEAL ── */
function setupReveal() {
  document.documentElement.classList.add("js-motion");
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));
}

/* ── HERO PARALLAX ── */
function setupHeroMotion() {
  if (!hero || !heroCopy) return;
  hero.addEventListener("pointermove", ev => {
    const r = hero.getBoundingClientRect();
    const x = ((ev.clientX - r.left) / r.width) * 100;
    const y = ((ev.clientY - r.top) / r.height) * 100;
    hero.style.setProperty("--hero-x", `${x}%`);
    hero.style.setProperty("--hero-y", `${y}%`);
    heroCopy.style.transform = `translate(${((x-50)/50)*10}px, ${((y-50)/50)*8}px)`;
  });
  hero.addEventListener("pointerleave", () => {
    hero.style.setProperty("--hero-x", "50%");
    hero.style.setProperty("--hero-y", "50%");
    heroCopy.style.transform = "";
  });
}

/* ── HERO AUTOHIDE ── */
function setupHeroAutohide() {
  if (!hero || !heroCopy) return;
  let timer;
  const schedule = (ms = 4200) => { clearTimeout(timer); timer = setTimeout(() => heroCopy.classList.add("is-hidden"), ms); };
  const reveal   = () => { heroCopy.classList.remove("is-hidden"); schedule(2400); };
  schedule();
  hero.addEventListener("pointerenter",  reveal);
  hero.addEventListener("pointermove",   reveal);
  hero.addEventListener("click",         reveal);
  hero.addEventListener("touchstart",    reveal, { passive: true });
}

/* ── CARD 3D TILT ── */
function setupCardTilt() {
  document.querySelectorAll(".product-card").forEach(card => {
    card.addEventListener("pointermove", ev => {
      const r  = card.getBoundingClientRect();
      const rx = ((ev.clientY - r.top)  / r.height - 0.5) * -10;
      const ry = ((ev.clientX - r.left) / r.width  - 0.5) *  10;
      card.style.transform = `translateY(-8px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });
}

/* ── VIDEO AUTOPLAY ── */
function ensureVideo() {
  const v = document.querySelector(".hero-video");
  if (!v) return;
  const play = () => {
    v.muted = true; v.defaultMuted = true;
    v.setAttribute("muted",""); v.setAttribute("playsinline","");
    const p = v.play();
    if (p?.catch) p.catch(() => {});
  };
  v.muted = true; v.setAttribute("muted","");
  const iv = setInterval(play, 900);
  setTimeout(() => clearInterval(iv), 8000);
  v.addEventListener("loadedmetadata", play, { once: true });
  v.addEventListener("canplay", play, { once: true });
  v.addEventListener("playing", () => clearInterval(iv), { once: true });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) play(); });
  ["touchstart","pointerdown","click"].forEach(e => window.addEventListener(e, play, { passive:true, once:true }));
  setTimeout(play, 120);
}

/* ── GRID CLICK (confetti + toast) ── */
function setupGridEffects() {
  if (!productGrid) return;
  productGrid.addEventListener("click", ev => {
    const btn = ev.target.closest(".add-jar, .add-refill");
    if (!btn) return;
    const card = btn.closest(".product-card");
    const title = card?.querySelector(".product-title")?.textContent || "Producto";
    const mode  = btn.classList.contains("add-jar") ? "con frasco" : "como refill";
    setTimeout(() => {
      updateCartEffects();
      showToast(`${title} agregado ${mode}`);
      burstConfetti(ev.clientX || innerWidth / 2, ev.clientY || innerHeight / 2);
    }, 40);
  });
}

/* ── CART OBSERVER ── */
function setupCartObserver() {
  if (!cartListEl) return;
  const mo = new MutationObserver(() => updateCartEffects());
  mo.observe(cartListEl, { childList: true, subtree: true, characterData: true });
  cartListEl.addEventListener("click", ev => {
    if (ev.target.closest("[data-remove]")) {
      setTimeout(() => { updateCartEffects(); showToast("Producto quitado"); }, 30);
    }
  });
}

/* ── INIT ── */
function init() {
  setupReveal();
  setupHeroMotion();
  setupHeroAutohide();
  setupCardTilt();
  ensureVideo();
  setupGridEffects();
  setupCartObserver();
  updateCartEffects();
}

init();
