/* ============================================================
   ЁЛКА-ФОТО + расстановка PNG-шаров поверх
   ============================================================ */

const BALLS = {
  movie: "/assets/shar_kino.png",
  song:  "/assets/shar_musica.png",
  book:  "/assets/shar_kniga.png",
};

// Позиции в % от контейнера. Распределены по всей высоте ёлки
// (сверху 10% до низа 92%). Больше точек, чем контента — лишние не рисуются.
const POSITIONS = [
  // Ярус 1 — макушка (10-22%)
  { x: 50, y: 10 },
  { x: 40, y: 16 },
  { x: 60, y: 17 },
  { x: 50, y: 22 },

  // Ярус 2 — верхний (24-38%)
  { x: 33, y: 26 },
  { x: 46, y: 28 },
  { x: 60, y: 27 },
  { x: 70, y: 30 },
  { x: 40, y: 34 },
  { x: 55, y: 35 },
  { x: 65, y: 37 },

  // Ярус 3 — средний (40-58%)
  { x: 25, y: 42 },
  { x: 38, y: 41 },
  { x: 50, y: 44 },
  { x: 62, y: 43 },
  { x: 74, y: 45 },
  { x: 30, y: 50 },
  { x: 45, y: 49 },
  { x: 58, y: 52 },
  { x: 70, y: 51 },
  { x: 22, y: 56 },
  { x: 40, y: 57 },
  { x: 55, y: 58 },

  // Ярус 4 — нижний (60-75%)
  { x: 28, y: 63 },
  { x: 42, y: 62 },
  { x: 56, y: 64 },
  { x: 68, y: 63 },
  { x: 78, y: 66 },
  { x: 22, y: 70 },
  { x: 35, y: 69 },
  { x: 50, y: 71 },
  { x: 64, y: 70 },
  { x: 76, y: 73 },

  // Ярус 5 — самый низ (78-92%)
  { x: 30, y: 78 },
  { x: 45, y: 80 },
  { x: 60, y: 79 },
  { x: 72, y: 82 },
  { x: 25, y: 85 },
  { x: 40, y: 86 },
  { x: 55, y: 88 },
  { x: 68, y: 87 },
  { x: 35, y: 91 },
  { x: 50, y: 92 },
  { x: 65, y: 91 },
];

export function renderOrnaments(content, onClick) {
  const layer = document.getElementById("ornamentsLayer");
  if (!layer) return;
  layer.innerHTML = "";

  // Перемешиваем позиции, чтобы игрушки не прилипали к верху
  const shuffled = [...POSITIONS].sort(() => Math.random() - 0.5);

  content.forEach((item, idx) => {
    const pos = shuffled[idx % shuffled.length];
    const jitterX = (Math.random() - 0.5) * 3;
    const jitterY = (Math.random() - 0.5) * 2;
    const sizeVar = 0.9 + Math.random() * 0.3;

    const spot = document.createElement("div");
    spot.className = "ornament-spot";
    spot.style.left = `${pos.x + jitterX}%`;
    spot.style.top = `${pos.y + jitterY}%`;
    spot.style.width = `${13 * sizeVar}%`;
    spot.style.animationDelay = `${idx * 0.05}s`;
    spot.setAttribute("tabindex", "0");
    spot.setAttribute("role", "button");
    spot.setAttribute("aria-label", item.title);
    spot.title = item.title;

    const img = document.createElement("img");
    img.src = BALLS[item.type] || BALLS.movie;
    img.alt = item.title;
    img.draggable = false;
    spot.appendChild(img);

    spot.addEventListener("click", () => onClick(item.id));
    spot.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(item.id);
      }
    });

    layer.appendChild(spot);
  });
}

// ============================================================
// МЕРЦАЮЩИЕ ЛАМПОЧКИ-ГИРЛЯНДА
// ============================================================

// Цвета лампочек
const BULB_COLORS = [
  { name: "red",    color: "#ef476f", glow: "rgba(239, 71, 111, 0.9)" },
  { name: "gold",   color: "#ffd166", glow: "rgba(255, 209, 102, 0.9)" },
  { name: "green",  color: "#06d6a0", glow: "rgba(6, 214, 160, 0.9)" },
  { name: "blue",   color: "#118ab2", glow: "rgba(17, 138, 178, 0.9)" },
  { name: "pink",   color: "#f72585", glow: "rgba(247, 37, 133, 0.9)" },
  { name: "white",  color: "#f0ece4", glow: "rgba(240, 236, 228, 0.9)" },
];

// Позиции гирлянды — зигзагом по ёлке между шарами
// Чем больше позиций, тем плотнее гирлянда
const GARLAND_POSITIONS = [
  // Верх — узкий конус
  { x: 50, y: 14 }, { x: 44, y: 18 }, { x: 56, y: 18 },
  { x: 40, y: 22 }, { x: 50, y: 23 }, { x: 60, y: 22 },

  // Ярус 1-2
  { x: 34, y: 28 }, { x: 46, y: 29 }, { x: 58, y: 28 }, { x: 68, y: 30 },
  { x: 30, y: 34 }, { x: 42, y: 35 }, { x: 54, y: 34 }, { x: 66, y: 35 },

  // Ярус 3
  { x: 26, y: 40 }, { x: 38, y: 41 }, { x: 50, y: 42 }, { x: 62, y: 41 }, { x: 74, y: 42 },
  { x: 22, y: 47 }, { x: 34, y: 48 }, { x: 46, y: 47 }, { x: 58, y: 48 }, { x: 70, y: 49 },

  // Ярус 4
  { x: 24, y: 55 }, { x: 36, y: 56 }, { x: 48, y: 55 }, { x: 60, y: 56 }, { x: 72, y: 57 },
  { x: 26, y: 63 }, { x: 38, y: 62 }, { x: 50, y: 64 }, { x: 62, y: 63 }, { x: 74, y: 64 },

  // Ярус 5 — низ
  { x: 28, y: 70 }, { x: 40, y: 71 }, { x: 52, y: 70 }, { x: 64, y: 72 }, { x: 76, y: 71 },
  { x: 26, y: 78 }, { x: 38, y: 79 }, { x: 50, y: 78 }, { x: 62, y: 80 }, { x: 74, y: 79 },
  { x: 32, y: 86 }, { x: 44, y: 87 }, { x: 56, y: 86 }, { x: 68, y: 88 },
];

export function renderGarland() {
  const layer = document.getElementById("ornamentsLayer");
  if (!layer) return;

  // Удаляем старую гирлянду, если была
  const oldGarland = layer.querySelector(".garland-lights");
  if (oldGarland) oldGarland.remove();

  // Контейнер гирлянды
  const container = document.createElement("div");
  container.className = "garland-lights";

  GARLAND_POSITIONS.forEach((pos, i) => {
    // Случайное смещение
    const jitterX = (Math.random() - 0.5) * 3;
    const jitterY = (Math.random() - 0.5) * 2;

    const bulb = document.createElement("div");
    bulb.className = "garland-bulb";

    // Цвет по кругу из палитры
    const color = BULB_COLORS[i % BULB_COLORS.length];
    bulb.style.setProperty("--bulb-color", color.color);
    bulb.style.setProperty("--bulb-glow", color.glow);

    // Позиция в % от контейнера
    bulb.style.left = `${pos.x + jitterX}%`;
    bulb.style.top = `${pos.y + jitterY}%`;

    // Случайная задержка мерцания (0-3 сек)
    bulb.style.animationDelay = `${(Math.random() * 3).toFixed(2)}s`;

    // Случайный размер (0.7-1.2)
    const sizeScale = 0.7 + Math.random() * 0.5;
    bulb.style.setProperty("--size", sizeScale);

    container.appendChild(bulb);
  });

  // Вставляем гирлянду ПЕРЕД шарами (чтобы точки были ПОД шарами)
  const firstOrnament = layer.querySelector(".ornament-spot");
  if (firstOrnament) {
    layer.insertBefore(container, firstOrnament);
  } else {
    layer.appendChild(container);
  }
}