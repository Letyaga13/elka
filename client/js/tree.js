const ICONS = { movie: "🎬", song: "🎵", book: "📖" };

const COLORS = [
  { main: "#ef476f", dark: "#a11740", light: "#ff8fa8" }, // красный
  { main: "#ffd166", dark: "#c1920a", light: "#ffe9a3" }, // золотой
  { main: "#06d6a0", dark: "#058a68", light: "#6ff2cb" }, // изумруд
  { main: "#118ab2", dark: "#0a5a75", light: "#5cc4e3" }, // синий
  { main: "#c77dff", dark: "#7d39b8", light: "#e0b8ff" }, // сиреневый
  { main: "#f77f00", dark: "#a35400", light: "#ffb35e" }, // оранжевый
];

export function renderTree(svg, content, onClick) {
  const W = 600, H = 750;
  svg.innerHTML = "";

  // === Определения градиентов ===
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <radialGradient id="treeGrad1" cx="50%" cy="0%" r="100%">
      <stop offset="0%" stop-color="#3fb8a6"/>
      <stop offset="100%" stop-color="#0e4a41"/>
    </radialGradient>
    <radialGradient id="treeGrad2" cx="50%" cy="0%" r="100%">
      <stop offset="0%" stop-color="#2a9d8f"/>
      <stop offset="100%" stop-color="#0a3d35"/>
    </radialGradient>
    <radialGradient id="treeGrad3" cx="50%" cy="0%" r="100%">
      <stop offset="0%" stop-color="#1f7d70"/>
      <stop offset="100%" stop-color="#062a24"/>
    </radialGradient>
    <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3d2419"/>
      <stop offset="50%" stop-color="#6b4429"/>
      <stop offset="100%" stop-color="#3d2419"/>
    </linearGradient>
    <linearGradient id="garlandGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffd166"/>
      <stop offset="50%" stop-color="#fff5cc"/>
      <stop offset="100%" stop-color="#ffd166"/>
    </linearGradient>
    <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff5cc" stop-opacity="1"/>
      <stop offset="50%" stop-color="#ffd166" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#ffd166" stop-opacity="0"/>
    </radialGradient>
    <filter id="ornamentShadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.5"/>
    </filter>
    <filter id="starFilter" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  `;
  svg.appendChild(defs);

  // === Свечение под ёлкой ===
  const floorGlow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
  floorGlow.setAttribute("cx", W / 2);
  floorGlow.setAttribute("cy", H - 40);
  floorGlow.setAttribute("rx", 220);
  floorGlow.setAttribute("ry", 35);
  floorGlow.setAttribute("fill", "url(#starGlow)");
  floorGlow.setAttribute("opacity", "0.4");
  svg.appendChild(floorGlow);

  // === Ствол ===
  const trunk = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  trunk.setAttribute("x", W / 2 - 22);
  trunk.setAttribute("y", H - 130);
  trunk.setAttribute("width", 44);
  trunk.setAttribute("height", 100);
  trunk.setAttribute("fill", "url(#trunkGrad)");
  trunk.setAttribute("rx", 6);
  svg.appendChild(trunk);

  // === Ярусы ёлки (с волнистыми краями) ===
  const layers = [
    { y: 130, w: 220, h: 200, grad: "url(#treeGrad1)" },
    { y: 270, w: 300, h: 220, grad: "url(#treeGrad2)" },
    { y: 430, w: 400, h: 260, grad: "url(#treeGrad3)" }
  ];

  layers.forEach((l, i) => {
    // Основной треугольник
    const tri = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const apex = `${W / 2},${l.y}`;
    const bl = `${W / 2 - l.w / 2},${l.y + l.h}`;
    const br = `${W / 2 + l.w / 2},${l.y + l.h}`;
    // Волнистый низ
    const wave = `M ${apex} L ${bl}`;
    const steps = 8;
    for (let s = 1; s <= steps; s++) {
      const x = W / 2 - l.w / 2 + (l.w / steps) * s;
      const y = l.y + l.h + (s % 2 === 0 ? -8 : 0);
      svg.appendChild(dummy()); // noop placeholder
    }
    tri.setAttribute("d", `M ${apex} L ${bl} L ${br} Z`);
    tri.setAttribute("fill", l.grad);
    tri.setAttribute("stroke", "rgba(255, 209, 102, 0.15)");
    tri.setAttribute("stroke-width", 1.5);
    svg.appendChild(tri);

    // Световая подсветка слева
    const highlight = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    highlight.setAttribute("points",
      `${W / 2},${l.y} ${W / 2 - l.w / 2},${l.y + l.h} ${W / 2},${l.y + l.h}`);
    highlight.setAttribute("fill", "rgba(255, 255, 255, 0.06)");
    svg.appendChild(highlight);

    // Гирлянда-нить по низу яруса
    const garlandPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    let d = `M ${W / 2 - l.w / 2 + 10},${l.y + l.h - 8}`;
    const segments = 10;
    for (let s = 1; s <= segments; s++) {
      const x1 = W / 2 - l.w / 2 + 10 + ((l.w - 20) / segments) * (s - 0.5);
      const x2 = W / 2 - l.w / 2 + 10 + ((l.w - 20) / segments) * s;
      const cx = (x1 + x2) / 2;
      const cy = l.y + l.h + (s % 2 === 0 ? -3 : 5);
      d += ` Q ${cx},${cy} ${x2},${l.y + l.h - 8}`;
    }
    garlandPath.setAttribute("d", d);
    garlandPath.setAttribute("class", "garland");
    svg.appendChild(garlandPath);

    // Лампочки на гирлянде
    for (let s = 0; s < segments; s++) {
      const cx = W / 2 - l.w / 2 + 10 + ((l.w - 20) / segments) * (s + 0.5);
      const cy = l.y + l.h + (s % 2 === 0 ? 1 : -1);
      const bulb = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      bulb.setAttribute("cx", cx);
      bulb.setAttribute("cy", cy);
      bulb.setAttribute("r", 3.5);
      const bulbColors = ["#ef476f", "#ffd166", "#06d6a0", "#118ab2", "#c77dff"];
      bulb.setAttribute("fill", bulbColors[s % bulbColors.length]);
      bulb.setAttribute("class", "bulb");
      bulb.style.animationDelay = `${(i * segments + s) * 0.15}s`;
      bulb.style.filter = `drop-shadow(0 0 4px ${bulbColors[s % bulbColors.length]})`;
      svg.appendChild(bulb);
    }
  });

  // === Звезда на макушке ===
  const starGlowEl = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  starGlowEl.setAttribute("cx", W / 2);
  starGlowEl.setAttribute("cy", 105);
  starGlowEl.setAttribute("r", 45);
  starGlowEl.setAttribute("fill", "url(#starGlow)");
  starGlowEl.setAttribute("opacity", "0.8");
  svg.appendChild(starGlowEl);

  const star = document.createElementNS("http://www.w3.org/2000/svg", "path");
  // Пятиконечная звезда
  const cxS = W / 2, cyS = 100, rOut = 28, rIn = 12;
  let starD = "";
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? rOut : rIn;
    const x = cxS + Math.cos(angle) * r;
    const y = cyS + Math.sin(angle) * r;
    starD += (i === 0 ? "M" : "L") + `${x},${y}`;
  }
  starD += "Z";
  star.setAttribute("d", starD);
  star.setAttribute("fill", "url(#garlandGradient)");
  star.setAttribute("filter", "url(#starFilter)");
  star.style.animation = "treeSway 3s ease-in-out infinite";
  star.style.transformOrigin = `${cxS}px ${cyS}px`;
  svg.appendChild(star);

  // === Игрушки ===
  const n = content.length;
  if (n === 0) return;

  content.forEach((item, idx) => {
    const t = idx / Math.max(1, n - 1);
    const layerIdx = Math.min(layers.length - 1, Math.floor(t * layers.length));
    const layer = layers[layerIdx];
    const inLayer = Math.ceil(n / layers.length);
    const localT = (idx % inLayer) / Math.max(1, inLayer - 1);
    const y = layer.y + 40 + localT * (layer.h - 80);
    const maxDx = (layer.w / 2) * ((y - layer.y) / layer.h) * 0.75;
    const x = W / 2 + Math.cos(idx * 2.4) * maxDx;

    const color = COLORS[hash(item.id) % COLORS.length];
    const size = 17 + (idx % 3);

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "ornament");
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", item.title);
    g.style.animationDelay = `${idx * 0.08}s`;

    // Тень-подложка (объём)
    const shadowCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    shadowCircle.setAttribute("cx", x);
    shadowCircle.setAttribute("cy", y + 3);
    shadowCircle.setAttribute("r", size);
    shadowCircle.setAttribute("fill", "rgba(0,0,0,0.4)");
    shadowCircle.setAttribute("filter", "url(#ornamentShadow)");
    g.appendChild(shadowCircle);

    // Основной шар с радиальным градиентом
    const gradId = `ornGrad_${idx}`;
    const grad = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
    grad.setAttribute("id", gradId);
    grad.setAttribute("cx", "35%");
    grad.setAttribute("cy", "30%");
    grad.setAttribute("r", "75%");
    grad.innerHTML = `
      <stop offset="0%" stop-color="${color.light}"/>
      <stop offset="45%" stop-color="${color.main}"/>
      <stop offset="100%" stop-color="${color.dark}"/>
    `;
    defs.appendChild(grad);

    const ball = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    ball.setAttribute("cx", x);
    ball.setAttribute("cy", y);
    ball.setAttribute("r", size);
    ball.setAttribute("fill", `url(#${gradId})`);
    ball.setAttribute("stroke", "rgba(255,255,255,0.4)");
    ball.setAttribute("stroke-width", 1.2);
    ball.setAttribute("class", "ornament-glass");
    ball.style.color = color.main;
    g.appendChild(ball);

    // Блик (отражение сверху)
    const shine = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    shine.setAttribute("cx", x - size * 0.3);
    shine.setAttribute("cy", y - size * 0.4);
    shine.setAttribute("rx", size * 0.35);
    shine.setAttribute("ry", size * 0.22);
    shine.setAttribute("fill", "rgba(255,255,255,0.65)");
    shine.style.transform = `rotate(-30deg)`;
    shine.style.transformOrigin = `${x}px ${y}px`;
    g.appendChild(shine);

    // Пимпочка-держатель сверху
    const cap = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    cap.setAttribute("x", x - 3);
    cap.setAttribute("y", y - size - 5);
    cap.setAttribute("width", 6);
    cap.setAttribute("height", 5);
    cap.setAttribute("fill", "#ffd166");
    cap.setAttribute("rx", 1);
    g.appendChild(cap);

    // Эмодзи-иконка внутри
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "text");
    icon.setAttribute("x", x);
    icon.setAttribute("y", y + size * 0.25);
    icon.setAttribute("text-anchor", "middle");
    icon.setAttribute("font-size", size * 0.9);
    icon.setAttribute("pointer-events", "none");
    icon.setAttribute("opacity", "0.95");
    icon.textContent = ICONS[item.type] || "⭐";
    g.appendChild(icon);

    g.addEventListener("click", () => onClick(item.id));
    g.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(item.id);
      }
    });

    svg.appendChild(g);
  });
}

function dummy() { return document.createComment(""); }

function hash(s) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}