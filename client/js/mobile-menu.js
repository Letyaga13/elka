// ============================================================
// МОБИЛЬНОЕ МЕНЮ (три точки → выезжает справа)
// ============================================================

export function initMobileMenu() {
  const btn = document.getElementById("mobileMenuBtn");
  const menu = document.getElementById("mobileMenu");
  if (!btn || !menu) return;

  function open() {
    menu.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function close() {
    menu.hidden = true;
    document.body.style.overflow = "";
  }

  btn.addEventListener("click", open);

  // Закрытие по клику на backdrop или ✕
  menu.querySelectorAll("[data-close-mobile-menu]").forEach((el) => {
    el.addEventListener("click", close);
  });

  // Закрытие по Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) close();
  });

  // Действия меню
  menu.querySelectorAll(".mobile-menu-item").forEach((item) => {
    item.addEventListener("click", () => {
      const action = item.dataset.action;
      close();

      // Делегируем в существующие кнопки
      setTimeout(() => {
        if (action === "profile")    document.getElementById("profileBtn")?.click();
        if (action === "theme")      document.getElementById("themeBtn")?.click();
        if (action === "lang")       document.getElementById("langBtn")?.click();
        if (action === "stats")      document.getElementById("statsBtn")?.click();
        if (action === "achieve")    document.getElementById("achieveBtn")?.click();
        if (action === "random")     document.getElementById("randomBtn")?.click();
        if (action === "share")      document.getElementById("shareBtn")?.click();
      }, 150);
    });
  });
}