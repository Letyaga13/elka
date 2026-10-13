/* ============================================================
   КОТЫ — 6 сценариев появления
   ============================================================ */

const CATS = {
  lying:      "/assets/кот_лежа_на_спине.png",
  onBelly:    "/assets/кот_на_животе.png",
  halfSit:    "/assets/кот_полусидя.png",
  profile:    "/assets/кот_сидя_профиль.png",
  threeQ:     "/assets/кот_сидя_три_четверти.png",
  standing:   "/assets/кот_стоя_боком.png",
  stretching: "/assets/кот_подтягивается.png",
};

// ---------- 1. Кот-помощник в углу (всегда виден, кликабельный) ----------
export function initHelperCat() {
  const el = document.getElementById("helperCat");
  if (!el) return;

  el.addEventListener("click", () => {
    el.classList.add("wave");
    setTimeout(() => el.classList.remove("wave"), 600);
    showCatPopup("Мяу! Кликай на игрушки 🎄");
  });
}

export function helperCatReact() {
  const el = document.getElementById("helperCat");
  if (!el) return;
  el.classList.add("wave");
  setTimeout(() => el.classList.remove("wave"), 600);
}

// ---------- 2. Кот-загрузчик (вместо спиннера) ----------
export function showCatLoader() {
  if (document.getElementById("catLoader")) return;
  const img = document.createElement("img");
  img.id = "catLoader";
  img.className = "cat-loader";
  img.src = CATS.lying;
  img.alt = "";
  document.body.appendChild(img);
}

export function hideCatLoader() {
  const el = document.getElementById("catLoader");
  if (el) el.remove();
}

// ---------- 3. Кот-поздравлятор (при share) ----------
export function showCatCelebration(message = "Готово!") {
  const img = document.createElement("img");
  img.className = "cat-celebrate";
  img.src = CATS.standing;
  img.alt = "";
  document.body.appendChild(img);

  const label = document.createElement("div");
  label.textContent = message;
  label.style.cssText = `
    position: fixed;
    top: calc(50% - 110px);
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #d4a545, #f0cd7a);
    color: #0a0e14;
    padding: 0.55rem 1.2rem;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.9rem;
    white-space: nowrap;
    box-shadow: 0 10px 30px rgba(212, 165, 69, 0.5);
    font-family: 'Montserrat', sans-serif;
    z-index: 3001;
    animation: popupIn 0.3s ease-out;
    pointer-events: none;
  `;
  document.body.appendChild(label);

  setTimeout(() => {
    img.remove();
    label.remove();
  }, 2000);
}

// ---------- 4. Кот-прыгун (раз в 45 сек в случайном месте) ----------
export function startStrayCats() {
  setInterval(() => {
    if (Math.random() > 0.55) return;
    spawnStrayCat();
  }, 45000);
}

function spawnStrayCat() {
  const variants = [CATS.lying, CATS.profile, CATS.onBelly];
  const src = variants[Math.floor(Math.random() * variants.length)];
  const side = Math.random() > 0.5 ? "left" : "right";
  const top = 25 + Math.random() * 45;

  const img = document.createElement("img");
  img.className = "stray-cat";
  img.src = src;
  img.alt = "";
  img.style.top = `${top}%`;
  img.style[side] = "-140px";
  img.style.width = "110px";
  img.style.height = "auto";
  document.body.appendChild(img);

  requestAnimationFrame(() => {
    img.style[side] = "8%";
  });

  setTimeout(() => {
    img.style.opacity = "0";
    img.style[side] = side === "left" ? "-60px" : "-60px";
    setTimeout(() => img.remove(), 500);
  }, 3200);
}

// ---------- 5. Кот идёт по нижней навигации (раз в 60 сек) ----------
export function startNavCat() {
  setInterval(() => {
    if (Math.random() > 0.5) return;
    walkNavCat();
  }, 60000);
}

function walkNavCat() {
  const nav = document.getElementById("bottomNav");
  if (!nav) return;
  const rect = nav.getBoundingClientRect();

  const img = document.createElement("img");
  img.className = "stray-cat";
  img.src = CATS.standing;
  img.alt = "";
  img.style.position = "fixed";
  img.style.bottom = `${window.innerHeight - rect.top + 8}px`;
  img.style.left = "-120px";
  img.style.width = "70px";
  img.style.height = "auto";
  img.style.transform = "scaleX(-1)";
  img.style.transition = "left 5s linear, opacity 0.5s";
  document.body.appendChild(img);

  requestAnimationFrame(() => {
    img.style.left = `${window.innerWidth + 20}px`;
  });

  setTimeout(() => {
    img.style.opacity = "0";
    setTimeout(() => img.remove(), 600);
  }, 5200);
}

// ---------- 6. Кот-ползун по низу экрана (раз в 90 сек) ----------
export function startCrawlCat() {
  setInterval(() => {
    if (Math.random() > 0.4) return;
    crawlCat();
  }, 90000);
}

function crawlCat() {
  const img = document.createElement("img");
  img.className = "stray-cat";
  img.src = CATS.onBelly;
  img.alt = "";
  img.style.position = "fixed";
  img.style.bottom = "10px";
  img.style.left = "-160px";
  img.style.width = "140px";
  img.style.height = "auto";
  img.style.transform = "scaleX(1)";
  img.style.transition = "left 8s linear, opacity 0.6s";
  img.style.opacity = "0.85";
  document.body.appendChild(img);

  requestAnimationFrame(() => {
    img.style.left = `${window.innerWidth + 40}px`;
  });

  setTimeout(() => {
    img.style.opacity = "0";
    setTimeout(() => img.remove(), 700);
  }, 8200);
}

// ---------- Кот-пузырь (реплики помощника) ----------
export function showCatPopup(text) {
  const popup = document.createElement("div");
  popup.className = "cat-popup";
  popup.textContent = text;
  document.body.appendChild(popup);

  setTimeout(() => {
    popup.style.transition = "opacity 0.4s, transform 0.4s";
    popup.style.opacity = "0";
    popup.style.transform = "translateY(10px)";
    setTimeout(() => popup.remove(), 400);
  }, 2200);
}

// ---------- Кот для секции: одна картинка + сторона (чередуется между вкладками) ----------

// Порядок вкладок для чередования стороны
const SECTION_ORDER = [
  "home",
  "cozy",
  "movie",
  "song",
  "book",
  "funny",
  "nostalgic",
  "romantic",
  "family",
  "soviet",
];

const SECTION_CATS = {
  home:      CATS.onBelly,      // лежит на животе
  cozy:      CATS.profile,      // сидит в профиль
  movie:     CATS.halfSit,      // полусидя (батон)
  song:      CATS.standing,     // стоит боком
  book:      CATS.stretching,   // ← подтягивается (НОВОЕ)
  funny:     CATS.lying,        // лежит на спине
  nostalgic: CATS.onBelly,      // ← на животе (поменяли с threeQ)
  romantic:  CATS.profile,      // сидит профиль
  family:    CATS.halfSit,      // полусидя
  soviet:    CATS.standing,     // стоит боком
};

export function getCatForSection(section) {
  const src = SECTION_CATS[section] || CATS.onBelly;
  const idx = SECTION_ORDER.indexOf(section);
  // Чётные вкладки — справа, нечётные — слева
  const side = idx % 2 === 0 ? "right" : "left";
  return { src, side };
}

// ---------- Инициализация всех фоновых котов ----------
export function startAllAmbientCats() {
}