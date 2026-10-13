/* ============================================================
   LIQUID NAVIGATION v2 — пузырь ездит по пилюле (без SVG-маски)
   ============================================================ */

export function initLiquidNav(onChange) {
  const pill = document.getElementById("navPill");
  const bubble = document.getElementById("navBubble");
  const bubbleIcon = document.getElementById("navBubbleIcon");
  if (!pill || !bubble || !bubbleIcon) return;

  const buttons = [...pill.querySelectorAll(".nav-btn")];
  let activeBtn = pill.querySelector(".nav-btn.active") || buttons[0];

  function moveTo(btn, animate = true) {
    if (!btn) return;
    const pillRect = pill.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();

    // Центр кнопки относительно левого края пилюли
    const btnCenterX = btnRect.left - pillRect.left + btnRect.width / 2;

    // Половина ширины пузыря (для центрирования)
    const bubbleSize = bubble.offsetWidth || 60;
    const offsetX = btnCenterX - bubbleSize / 2;

    if (!animate) bubble.style.transition = "none";
    bubble.style.transform = `translateY(-50%) translateX(${offsetX}px)`;
    if (!animate) {
      void bubble.offsetWidth; // force reflow
      bubble.style.transition = "";
    }

    // Иконка пузыря = иконка кнопки
    const iconEl = btn.querySelector(".nav-icon");
    if (iconEl) bubbleIcon.textContent = iconEl.textContent.trim();

    // Подсветка
    buttons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeBtn = btn;
  }

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      bubble.classList.add("moving");
      setTimeout(() => bubble.classList.remove("moving"), 300);
      moveTo(btn);
      if (typeof onChange === "function") onChange(btn.dataset.nav);
    });
  });

  // Первичная установка без анимации
  requestAnimationFrame(() => {
    moveTo(activeBtn, false);
  });

  // Пересчёт при ресайзе
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => moveTo(activeBtn, false), 120);
  });

  return {
    goTo: (nav) => {
      const btn = buttons.find(b => b.dataset.nav === nav);
      if (btn) {
        bubble.classList.add("moving");
        setTimeout(() => bubble.classList.remove("moving"), 300);
        moveTo(btn);
      }
    }
  };
}