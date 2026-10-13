import { renderOrnaments, renderGarland } from "./tree-photo.js";
import { openPlayer } from "./player.js";
import { initShare } from "./share.js";
import { initLiquidNav } from "./nav.js";
import { initLangSwitch, setLang, getLang, t } from "./i18n.js";
import { initProfile, getProfile } from "./profile.js";
import { shareCard } from "./share-card.js";
import { initMobileMenu } from "./mobile-menu.js";
import {
  initHelperCat,
  helperCatReact,
  showCatLoader,
  hideCatLoader,
  showCatCelebration,
  showCatPopup,
  startAllAmbientCats,
  getCatForSection,
} from "./cats.js";

const ICONS = { movie: "🎬", song: "🎵", book: "📖" };
const HISTORY_KEY = "elka_history";

const state = {
  content: [],
  history: [],
  currentRoom: null,
  ws: null,
  currentSection: "home",
  // Запоминаем состояние до поиска, чтобы вернуться
  beforeSearch: {
    section: "home",
    title: "",
    showBack: false,
  },
};

// ============================================================
// ЗАПУСК
// ============================================================
async function boot() {
  initHelperCat();
  startAllAmbientCats();
  initTheme();
  initCountdown();
  initServiceWorker();
  initLangSwitch();
  initLangButton();
  initSearch();
  initStats();
  initAchievements();
  initProfile();
  initGroupCatalogHandler();
  initMobileMenu();

  try {
    const res = await fetch("/api/content");
    state.content = await res.json();
  } catch (err) {
    alert("Не удалось загрузить контент. Запущен ли сервер? (npm start)");
    return;
  }

  // Рисуем игрушки на ёлке, ПОТОМ гирлянду (гирлянда вставляется перед шарами)
  renderOrnaments(state.content, onOrnamentClick);
  renderGarland();

  // Первая загрузка рекомендаций
  await loadRecommendations();

  // Нижняя навигация
  bindBottomNav();

  // Кнопки в шапке
  document.getElementById("shareBtn").onclick = onShare;
  document.getElementById("randomBtn").onclick = onRandom;

  // Deep-link: ?id=m1
  const id = new URLSearchParams(location.search).get("id");
  if (id) onOrnamentClick(id);

  // Комната: ?room=xxxx
  const room = new URLSearchParams(location.search).get("room");
  if (room) {
    state.currentRoom = room;
    initShare(state, room);
    showCatPopup(`👥 Подключено к комнате ${room}`);
  }

  // Группа: ?group=xxxx
  const group = new URLSearchParams(location.search).get("group");
  if (group) {
    import("./groups.js").then(({ openGroupFromUrl }) => {
      openGroupFromUrl(group);
    });
  }

    // Обновить бейдж достижений
  updateAchieveBadge();

  // Если пользователь уже залогинен — поприветствуем
  const profile = getProfile();
  if (profile) {
    console.log(`👋 Привет, ${profile.username}!`);
  }
}

// ============================================================
// КЛИК ПО ИГРУШКЕ
// ============================================================
function onOrnamentClick(id) {
  const item = state.content.find(c => c.id === id);
  if (!item) return;

  document.getElementById("modalIcon").textContent = ICONS[item.type] || "⭐";

  // История
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  history.unshift(id);
  state.history = [...new Set(history)].slice(0, 20);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history));

  // Плеер
  openPlayer(item, state);

  // Кот машет
  helperCatReact();

  // Обновляем рекомендации только на главной
  if (state.currentSection === "home") {
    loadRecommendations();
  }
    // Обновить бейдж достижений
  if (typeof updateAchieveBadge === "function") {
    updateAchieveBadge();
  }
}

// ============================================================
// РЕКОМЕНДАЦИИ
// ============================================================
async function loadRecommendations() {
  showCatLoader();

  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    const res = await fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history })
    });
    const items = await res.json();
    renderCards(items, false);
  } catch (err) {
    console.error("Рекомендации:", err);
    renderCards([], false);
  } finally {
    hideCatLoader();
  }
}

// ============================================================
// КАРТОЧКИ (с плавной сменой — Вариант C)
// ============================================================
function renderCards(items, showBack, emptyMessage) {
  const grid = document.getElementById("panelGrid");
  const back = document.getElementById("panelBack");

  // Плавное исчезновение
  grid.style.opacity = "0";
  grid.style.transform = "translateY(15px)";

  setTimeout(() => {
    grid.innerHTML = "";

    if (!items.length) {
      const emptyText = emptyMessage || t("panel.empty");      grid.innerHTML = `
        <div class="empty-state">
          <img src="/assets/kot_лежа_на_спине.png" alt="">
          <div>${emptyText} 🐈‍⬛</div>
        </div>
      `;
    } else {
      // Кот для текущей вкладки — показывается над заголовком панели
      const catInfo = getCatForSection(state.currentSection);
      updatePanelCat(catInfo);

      items.forEach((it, i) => {
        if (!it) return;
        const card = document.createElement("div");
        card.className = "card";
        card.style.animationDelay = `${i * 0.06}s`;

        // Шар-иконка по типу
        const ballSrc = {
          movie: "/assets/shar_kino.png",
          song:  "/assets/shar_musica.png",
          book:  "/assets/shar_kniga.png",
        }[it.type] || "/assets/shar_kino.png";

        card.innerHTML = `
          <button class="card-share-btn" title="${t("share.card")}" aria-label="${t("share.card")}">📤</button>
          <img class="card-ball" src="${ballSrc}" alt="">
          <div class="card-body">
            <div class="card-title">${escapeHtml(it.title)}</div>
            <div class="card-meta">${cardMeta(it)}</div>
          </div>
        `;

        // Клик по карточке — открыть объект
        card.onclick = (e) => {
          if (e.target.closest(".card-share-btn")) return;
          onOrnamentClick(it.id);
        };

        // Клик по кнопке — сгенерировать карточку
        const shareBtn = card.querySelector(".card-share-btn");
        shareBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          shareCard(it);
        });

        grid.appendChild(card);
      });
    }

    // Fade-in
    requestAnimationFrame(() => {
      grid.style.opacity = "1";
      grid.style.transform = "translateY(0)";
    });

    back.hidden = !showBack;
  }, 220);
}

function cardMeta(item) {
  const parts = [];
  if (item.artist) parts.push(item.artist);
  if (item.author) parts.push(item.author);
  if (item.year) parts.push(item.year);
  parts.push(t("type." + item.type) || "");
  return parts.filter(Boolean).join(" · ");
}

// ============================================================
// НИЖНЯЯ НАВИГАЦИЯ (liquid tabs)
// ============================================================
let liquidNav = null;

function bindBottomNav() {
  liquidNav = initLiquidNav((nav) => {
    state.currentSection = nav;
    onNavChange(nav);
  });

  document.getElementById("panelBack").onclick = () => {
    state.currentSection = "home";
    document.getElementById("panelTitle").textContent = "✨ Вам может понравиться";
    if (liquidNav) liquidNav.goTo("home");
    loadRecommendations();
  };
}

async function onNavChange(nav) {
  const title = document.getElementById("panelTitle");

  if (nav === "home") {
    title.textContent = "✨ Вам может понравиться";
    document.getElementById("panelBack").hidden = true;
    await loadRecommendations();
    return;
  }

  // Тип контента
  if (["movie", "song", "book"].includes(nav)) {
    const key = { movie: "panel.movies", song: "panel.songs", book: "panel.books" }[nav];
    title.textContent = t(key);
    const items = state.content.filter(c => c.type === nav);
    renderCards(items, true);
    return;
  }

  // Настроение
  try {
    const res = await fetch(`/api/playlists/${nav}`);
    if (!res.ok) {
      renderCards([], true);
      return;
    }
    const pl = await res.json();
    title.textContent = t("mood." + nav) || pl.name;
    renderCards(pl.items || [], true);
  } catch (err) {
    console.error("Плейлист:", err);
    renderCards([], true);
  }
}

// ============================================================
// СЛУЧАЙНАЯ ИГРУШКА
// ============================================================
function onRandom() {
  if (!state.content.length) return;
  const item = state.content[Math.floor(Math.random() * state.content.length)];
  showCatPopup(`🎲 Случайно: ${item.title}`);
  onOrnamentClick(item.id);
}

// ============================================================
// ПОДЕЛИТЬСЯ
// ============================================================
async function onShare() {
  try {
    const res = await fetch("/api/rooms", { method: "POST" });
    const { id } = await res.json();
    state.currentRoom = id;

    const link = `${location.origin}/?room=${id}`;
    try {
      await navigator.clipboard.writeText(link);
      showCatCelebration("Ссылка скопирована!");
    } catch {
      prompt("Скопируй ссылку вручную:", link);
      showCatCelebration("Готово!");
    }

    initShare(state, id);
  } catch (err) {
    console.error("Не удалось создать комнату:", err);
    alert("Ошибка: не удалось создать комнату");
  }
}

// ============================================================
// УТИЛИТЫ
// ============================================================
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================
// КОТ НАД ЗАГОЛОВКОМ ПАНЕЛИ
// ============================================================
function updatePanelCat(catInfo) {
  const panel = document.getElementById("panel");
  if (!panel) return;

  // Удаляем старого кота, если был
  const old = panel.querySelector(".panel-cat-wrap");
  if (old) old.remove();

  // На главной кота не показываем (там рекомендации, не вкладка)
  if (!catInfo || state.currentSection === "home") return;

  const wrap = document.createElement("div");
  wrap.className = `panel-cat-wrap ${catInfo.side}`;
  wrap.innerHTML = `
    <div class="cat-glow ${catInfo.side}"></div>
    <img class="panel-cat ${catInfo.side}" src="${catInfo.src}" alt="">
  `;
  panel.appendChild(wrap);
}

// ============================================================
// ТЕМА (тёмная / светлая)
// ============================================================
const THEME_KEY = "elka_theme";

function initTheme() {
  const btn = document.getElementById("themeBtn");
  if (!btn) return;

  // Применяем сохранённую тему
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light") {
    document.body.classList.add("light");
    btn.textContent = "☀️";
  }

  // Клик
  btn.addEventListener("click", () => {
    const isLight = document.body.classList.toggle("light");
    btn.textContent = isLight ? "☀️" : "🌙";
    localStorage.setItem(THEME_KEY, isLight ? "light" : "dark");
  });
}

// ============================================================
// ОБРАТНЫЙ ОТСЧЁТ ДО НОВОГО ГОДА
// ============================================================
function initCountdown() {
  const el = document.getElementById("countdown");
  const daysEl = document.getElementById("cd-days");
  const hoursEl = document.getElementById("cd-hours");
  const minsEl = document.getElementById("cd-mins");
  const secsEl = document.getElementById("cd-secs");
  if (!el || !daysEl) return;

  function getNewYearDate() {
    const now = new Date();
    const year = now.getFullYear();
    // Если до 1 января осталось < 1 дня, то считаем к следующему году
    // Иначе — к 1 января текущего следующего года
    const nextYear = year + 1;
    return new Date(nextYear, 0, 1, 0, 0, 0);
  }

  function pad(num) {
    return String(Math.max(0, num)).padStart(2, "0");
  }

  function tick() {
    const now = new Date();
    const target = getNewYearDate();

    // Проверяем: если сейчас 1 января, и до конца дня (или в течение 7 дней после НГ) — праздник
    const sinceNY = now.getTime() - new Date(now.getFullYear(), 0, 1).getTime();
    const weekAfterNY = 7 * 24 * 60 * 60 * 1000;

    if (now.getMonth() === 0 && now.getDate() <= 7) {
      el.classList.add("holiday");
      el.classList.remove("almost");
      el.querySelector(".countdown-label").textContent = t("countdown.holiday");
      return;
    }

    const diff = target - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    daysEl.textContent = days;
    hoursEl.textContent = pad(hours);
    minsEl.textContent = pad(mins);
    secsEl.textContent = pad(secs);

    // Если осталось < 1 дня — пульсация
    if (days === 0) {
      el.classList.add("almost");
    } else {
      el.classList.remove("almost");
    }
  }

  tick();
  setInterval(tick, 1000);
}

// ============================================================
// PWA — регистрация Service Worker
// ============================================================
function initServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.log("Service Worker не поддерживается");
    return;
  }

  // На мобильных НЕ регистрируем SW (тормозит)
  const isMobile = window.innerWidth < 900 ||
                   /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    console.log("Service Worker отключён на мобильных");
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((reg) => {
        console.log("✅ Service Worker зарегистрирован:", reg.scope);
      })
      .catch((err) => {
        console.warn("⚠️ Ошибка Service Worker:", err);
      });
  });
}

// ============================================================
// КНОПКА ПЕРЕКЛЮЧЕНИЯ ЯЗЫКА
// ============================================================
function initLangButton() {
  const btn = document.getElementById("langBtn");
  if (!btn) return;

  // Показать текущий язык
  btn.textContent = getLang().toUpperCase();

  btn.addEventListener("click", () => {
    const next = getLang() === "ru" ? "en" : "ru";
    setLang(next);
    btn.textContent = next.toUpperCase();
    // Обновить динамические части (например, заголовок панели, если не главная)
    updateDynamicTexts();
  });
}

// Обновить динамические тексты (которые не в data-i18n)
function updateDynamicTexts() {
  // Заголовок панели
  const title = document.getElementById("panelTitle");
  if (title && state.currentSection === "home") {
    title.textContent = t("panel.recommendations");
  }
  // Если открыт плейлист — перерисуем
  if (state.currentSection && state.currentSection !== "home") {
    onNavChange(state.currentSection);
  }
}

// ============================================================
// УМНЫЙ ПОИСК
// ============================================================
let searchTimer = null;

function initSearch() {
  const input = document.getElementById("searchInput");
  const clear = document.getElementById("searchClear");
  if (!input || !clear) return;

  let lastQuery = "";

  // Ввод — с задержкой 200мс
  input.addEventListener("input", () => {
    const q = input.value.trim();
    clear.hidden = !q;

    // Если поле стало пустым — вернуться к предыдущему состоянию
    if (!q && lastQuery) {
      lastQuery = "";
      restoreBeforeSearch();
      return;
    }

    lastQuery = q;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => performSearch(q), 200);
  });

  // Очистить
  clear.addEventListener("click", () => {
    input.value = "";
    clear.hidden = true;
    lastQuery = "";
    restoreBeforeSearch();
    input.focus();
  });

  // Enter — искать сразу
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      clearTimeout(searchTimer);
      const q = input.value.trim();
      if (q) performSearch(q);
    }
    if (e.key === "Escape") {
      clear.click();
    }
  });
}

// Запомнить состояние перед поиском
function saveBeforeSearch() {
  state.beforeSearch = {
    section: state.currentSection,
    title: document.getElementById("panelTitle").textContent,
    showBack: !document.getElementById("panelBack").hidden,
  };
}

// Вернуть состояние до поиска
function restoreBeforeSearch() {
  const { section, title, showBack } = state.beforeSearch;

  // Возвращаем секцию
  state.currentSection = section;

  // Если была главная — перезагружаем рекомендации
  if (section === "home") {
    document.getElementById("panelTitle").textContent = t("panel.recommendations");
    document.getElementById("panelBack").hidden = true;
    loadRecommendations();
  } else {
    // Иначе — восстанавливаем через onNavChange
    if (title) document.getElementById("panelTitle").textContent = title;
    document.getElementById("panelBack").hidden = !showBack;
    onNavChange(section);
  }

  // Обновляем активную вкладку в навигации
  document.querySelectorAll("#bottomNav .nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === section);
  });
}

function performSearch(query) {
  const q = query.trim().toLowerCase();

  if (!q) return;

  // СОХРАНЯЕМ состояние перед первым поиском
  // (если мы уже в поиске — не перезаписываем)
  const panelTitle = document.getElementById("panelTitle");
  if (panelTitle.textContent !== t("search.results")) {
    saveBeforeSearch();
  }

  // Ищем по всем полям
  const results = state.content.filter((item) => {
    const haystack = [
      item.title,
      item.artist,
      item.author,
      item.year,
      item.type,
      ...(item.moods || []),
      ...(item.tags || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });

  // Меняем заголовок панели
  panelTitle.textContent = t("search.results");
  document.getElementById("panelBack").hidden = false;

  // Снимаем активную вкладку в навигации — мы в поиске
  document.querySelectorAll("#bottomNav .nav-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Рисуем результаты
  if (results.length === 0) {
    renderCards([], true, t("search.no_results"));
  } else {
    renderCards(results, true);
  }
}

// ============================================================
// СТАТИСТИКА
// ============================================================
function initStats() {
  const btn = document.getElementById("statsBtn");
  const modal = document.getElementById("statsModal");
  const close = document.getElementById("closeStats");
  const backdrop = modal?.querySelector("[data-close-stats]");
  if (!btn || !modal || !close) return;

  function open() {
    renderStats();
    modal.hidden = false;
  }

  function closeModal() {
    modal.hidden = true;
  }

  btn.addEventListener("click", open);
  close.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });
}

function renderStats() {
  const body = document.getElementById("statsBody");
  if (!body) return;

  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");

  if (history.length === 0) {
    body.innerHTML = `
      <div class="stats-empty">
        <img src="/assets/кот_полусидя.png" alt="">
        <div>${t("stats.empty")}</div>
      </div>
    `;
    return;
  }

  // Считаем по категориям
  const byType = { movie: 0, song: 0, book: 0 };
  const byMood = {};
  const byItem = {};
  const byAuthor = {};

  history.forEach((id) => {
    const item = state.content.find((c) => c.id === id);
    if (!item) return;

    // Тип
    if (byType[item.type] !== undefined) byType[item.type]++;

    // Настроения
    (item.moods || []).forEach((m) => {
      byMood[m] = (byMood[m] || 0) + 1;
    });

    // Объект
    byItem[id] = (byItem[id] || 0) + 1;

    // Автор
    const author = item.artist || item.author;
    if (author) byAuthor[author] = (byAuthor[author] || 0) + 1;
  });

  // Находим любимое настроение
  const favMood = Object.entries(byMood).sort((a, b) => b[1] - a[1])[0];

  // Топ-3
  const top3 = Object.entries(byItem)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, count]) => ({
      item: state.content.find((c) => c.id === id),
      count,
    }))
    .filter((x) => x.item);

  // Любимый автор
  const favAuthor = Object.entries(byAuthor).sort((a, b) => b[1] - a[1])[0];

  // Даты
  const firstView = history[history.length - 1];
  const lastView = history[0];

  // Максимум для прогресс-баров
  const maxType = Math.max(...Object.values(byType), 1);
  const maxMood = Math.max(...Object.values(byMood), 1);

  // Иконки типов
  const typeIcons = { movie: "🎬", song: "🎵", book: "📖" };

  // Собираем HTML
  body.innerHTML = `
    <div class="stats-summary">
      <div class="stats-cell">
        <div class="stats-cell-num">${byType.movie}</div>
        <div class="stats-cell-label">${typeIcons.movie} ${t("stats.movie")}</div>
      </div>
      <div class="stats-cell">
        <div class="stats-cell-num">${byType.song}</div>
        <div class="stats-cell-label">${typeIcons.song} ${t("stats.song")}</div>
      </div>
      <div class="stats-cell">
        <div class="stats-cell-num">${byType.book}</div>
        <div class="stats-cell-label">${typeIcons.book} ${t("stats.book")}</div>
      </div>
    </div>

    <div class="stats-block">
      <div class="stats-block-title">${t("stats.total")}: ${history.length}</div>
    </div>

    <div class="stats-block">
      <div class="stats-block-title">${t("stats.byType")}</div>
      ${Object.entries(byType).map(([type, count]) => `
        <div class="stats-bar-row">
          <span class="stats-bar-label">${typeIcons[type]} ${t("type." + type)}</span>
          <div class="stats-bar-track">
            <div class="stats-bar-fill" style="width: ${(count / maxType) * 100}%"></div>
          </div>
          <span class="stats-bar-num">${count}</span>
        </div>
      `).join("")}
    </div>

    ${(() => {
      // Показываем ТОЛЬКО официальные 5 настроений
      const OFFICIAL_MOODS = ["cozy", "funny", "nostalgic", "romantic", "family"];
      const filtered = Object.entries(byMood)
        .filter(([mood]) => OFFICIAL_MOODS.includes(mood))
        .sort((a, b) => b[1] - a[1]);

      if (!filtered.length) return "";

      return `
        <div class="stats-block">
          <div class="stats-block-title">${t("stats.byMood")}</div>
          ${filtered.map(([mood, count]) => `
            <div class="stats-bar-row">
              <span class="stats-bar-label">${t("mood." + mood)}</span>
              <div class="stats-bar-track">
                <div class="stats-bar-fill" style="width: ${(count / maxMood) * 100}%"></div>
              </div>
              <span class="stats-bar-num">${count}</span>
            </div>
          `).join("")}
        </div>
      `;
    })()}

    ${favMood ? `
    <div class="stats-block">
      <div class="stats-block-title">${t("stats.favoriteMood")}</div>
      <div style="font-size: 1.1rem; color: var(--gold-300);">${t("mood." + favMood[0]) || favMood[0]}</div>
    </div>
    ` : ""}

    ${top3.length ? `
    <div class="stats-block">
      <div class="stats-block-title">${t("stats.top3")}</div>
      <ul class="stats-top-list">
        ${top3.map(({ item, count }, i) => `
          <li data-id="${item.id}">
            <span class="stats-top-rank">${i + 1}.</span>
            <span class="stats-top-icon">${typeIcons[item.type] || "⭐"}</span>
            <span class="stats-top-title">${escapeHtml(item.title)}</span>
            <span class="stats-top-count">×${count}</span>
          </li>
        `).join("")}
      </ul>
    </div>
    ` : ""}

    ${favAuthor ? `
    <div class="stats-block">
      <div class="stats-block-title">${t("stats.favoriteAuthor")}</div>
      <div style="font-size: 1rem; color: var(--gold-300);">${escapeHtml(favAuthor[0])} (${favAuthor[1]})</div>
    </div>
    ` : ""}
  `;

  // Клик по топ-3 — открыть
  body.querySelectorAll(".stats-top-list li").forEach((li) => {
    li.addEventListener("click", () => {
      const id = li.dataset.id;
      document.getElementById("statsModal").hidden = true;
      onOrnamentClick(id);
    });
  });
}

// ============================================================
// ДОСТИЖЕНИЯ
// ============================================================

// Определения достижений: 5 / 15 / 50 для каждой категории
const ACHIEVEMENTS = {
  movie: [
    { level: "bronze", need: 5,  img: "/assets/trophies/бронза_фильмы.png" },
    { level: "silver", need: 15, img: "/assets/trophies/серебро_фильмы.png" },
    { level: "gold",   need: 50, img: "/assets/trophies/золото_фильмы.png" },
  ],
  song: [
    { level: "bronze", need: 5,  img: "/assets/trophies/бронза_музыка.png" },
    { level: "silver", need: 15, img: "/assets/trophies/серебро_музыка.png" },
    { level: "gold",   need: 50, img: "/assets/trophies/золото_музыка.png" },
  ],
  book: [
    { level: "bronze", need: 5,  img: "/assets/trophies/бронза_книги.png" },
    { level: "silver", need: 15, img: "/assets/trophies/серебро_книги.png" },
    { level: "gold",   need: 50, img: "/assets/trophies/золото_книги.png" },
  ],
};

const ACHIEVE_SEEN_KEY = "elka_achieve_seen";

function initAchievements() {
  const btn = document.getElementById("achieveBtn");
  const modal = document.getElementById("achieveModal");
  const close = document.getElementById("closeAchieve");
  const backdrop = modal?.querySelector("[data-close-achieve]");
  if (!btn || !modal || !close) return;

  function open() {
    renderAchievements();
    modal.hidden = false;
  }

  function closeModal() {
    modal.hidden = true;
  }

  btn.addEventListener("click", open);
  close.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });
}

// Уникальные объекты по типу
function getUniqueCounts() {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  const unique = { movie: new Set(), song: new Set(), book: new Set() };

  history.forEach((id) => {
    const item = state.content.find((c) => c.id === id);
    if (!item) return;
    if (unique[item.type]) unique[item.type].add(id);
  });

  return {
    movie: unique.movie.size,
    song:  unique.song.size,
    book:  unique.book.size,
  };
}

function renderAchievements() {
  const body = document.getElementById("achieveBody");
  if (!body) return;

  const counts = getUniqueCounts();
  const seen = JSON.parse(localStorage.getItem(ACHIEVE_SEEN_KEY) || "{}");
  const catLabels = {
    movie: t("achieve.movies"),
    song:  t("achieve.songs"),
    book:  t("achieve.books"),
  };
  const levelLabels = {
    bronze: t("achieve.bronze"),
    silver: t("achieve.silver"),
    gold:   t("achieve.gold"),
  };

  let html = "";

  Object.keys(ACHIEVEMENTS).forEach((type) => {
    const items = ACHIEVEMENTS[type];
    const count = counts[type] || 0;

    html += `
      <div class="achieve-category">
        <div class="achieve-category-title">${catLabels[type]}</div>
        <div class="achieve-row">
          ${items.map((a) => {
            const unlocked = count >= a.need;
            const progress = Math.min(count / a.need, 1);
            const key = `${type}_${a.level}`;
            const isNew = unlocked && !seen[key];

            return `
              <div class="achieve-item ${unlocked ? "unlocked" : "locked"}">
                ${isNew ? '<div class="achieve-new-badge"></div>' : ""}
                <img class="achieve-cup" src="${a.img}" alt="${levelLabels[a.level]}">
                <div class="achieve-level">${levelLabels[a.level]}</div>
                <div class="achieve-progress">
                  <div class="achieve-progress-bar">
                    <div class="achieve-progress-fill" style="width: ${progress * 100}%"></div>
                  </div>
                  <div class="achieve-progress-text">${Math.min(count, a.need)} / ${a.need}</div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;

    items.forEach((a) => {
      if (count >= a.need) seen[`${type}_${a.level}`] = true;
    });
  });

  body.innerHTML = html;
  localStorage.setItem(ACHIEVE_SEEN_KEY, JSON.stringify(seen));
}

function hasNewAchievements() {
  const counts = getUniqueCounts();
  const seen = JSON.parse(localStorage.getItem(ACHIEVE_SEEN_KEY) || "{}");

  for (const type in ACHIEVEMENTS) {
    const count = counts[type] || 0;
    for (const a of ACHIEVEMENTS[type]) {
      const key = `${type}_${a.level}`;
      if (count >= a.need && !seen[key]) return true;
    }
  }
  return false;
}

function updateAchieveBadge() {
  const btn = document.getElementById("achieveBtn");
  if (!btn) return;

  const old = btn.querySelector(".nav-new-badge");
  if (old) old.remove();

  if (hasNewAchievements()) {
    const badge = document.createElement("span");
    badge.className = "nav-new-badge";
    badge.style.cssText = `
      position: absolute;
      top: 2px;
      right: 4px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ef476f;
      box-shadow: 0 0 10px #ef476f;
      animation: achievePulse 1.5s ease-in-out infinite;
      pointer-events: none;
    `;
    btn.style.position = "relative";
    btn.appendChild(badge);
  }
}

// ============================================================
// КАТАЛОГ ДЛЯ ГРУППЫ — выбор трека
// ============================================================
function initGroupCatalogHandler() {
  // Слушаем событие от groups.js
  window.addEventListener("open-catalog-for-group", (e) => {
    const groupId = e.detail;
    openGroupCatalogPicker(groupId);
  });

  // Слушаем запрос открытия объекта (например, из группы)
  window.addEventListener("open-content", (e) => {
    const id = e.detail;
    if (id) onOrnamentClick(id);
  });
}

function openGroupCatalogPicker(groupId) {
  // Используем существующую панель — показываем всё как "поиск"
  const title = document.getElementById("panelTitle");
  title.textContent = "🎁 Добавить в группу";

  // Специальный рендер — карточки с "плюсом"
  const grid = document.getElementById("panelGrid");
  grid.style.opacity = "0";
  grid.style.transform = "translateY(15px)";

  setTimeout(() => {
    grid.innerHTML = "";
    state.content.forEach((it, i) => {
      const card = document.createElement("div");
      card.className = "card";
      card.style.animationDelay = `${i * 0.04}s`;

      const ballSrc = {
        movie: "/assets/shar_kino.png",
        song:  "/assets/shar_musica.png",
        book:  "/assets/shar_kniga.png",
      }[it.type];

      card.innerHTML = `
        <img class="card-ball" src="${ballSrc}" alt="">
        <div class="card-body">
          <div class="card-title">${escapeHtml(it.title)}</div>
          <div class="card-meta">${cardMeta(it)}</div>
        </div>
      `;
      card.onclick = async () => {
        const { addToGroupPlaylist } = await import("./groups.js");
        const res = addToGroupPlaylist(groupId, it);
        if (res.ok) {
          card.style.borderColor = "var(--gold-400)";
          card.style.background = "rgba(212, 165, 69, 0.15)";
          setTimeout(() => {
            card.style.borderColor = "";
            card.style.background = "";
          }, 800);
        } else if (res.error === "exists") {
          alert("Уже в плейлисте");
        }
      };
      grid.appendChild(card);
    });

    requestAnimationFrame(() => {
      grid.style.opacity = "1";
      grid.style.transform = "translateY(0)";
    });

    document.getElementById("panelBack").hidden = false;
  }, 220);
}

boot();