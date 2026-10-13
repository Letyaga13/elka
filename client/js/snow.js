// ============================================================
// Анимированный снег на canvas
// ============================================================

const canvas = document.getElementById("snow");

if (canvas) {
  // На мобильных и планшетах снег НЕ запускаем
  const isMobile =
    window.innerWidth < 600 ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile) {
    console.log("❄️ Снег отключён на мобильных");
    canvas.style.display = "none";
  } else {
    // ========================================
    // ВЕСЬ КОД СНЕГА — ТОЛЬКО НА ДЕСКТОПЕ
    // ========================================
    const ctx = canvas.getContext("2d");
    const flakes = [];
    const FLAKE_COUNT = 120;

    let W, H;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    class Flake {
      constructor() {
        this.reset(true);
      }
      reset(initial = false) {
        this.x = Math.random() * W;
        this.y = initial ? Math.random() * H : -10;
        this.r = Math.random() * 2.5 + 0.5;
        this.speedY = Math.random() * 1.2 + 0.4;
        this.speedX = Math.random() * 0.6 - 0.3;
        this.opacity = Math.random() * 0.6 + 0.3;
        this.swing = Math.random() * Math.PI * 2;
        this.swingSpeed = Math.random() * 0.02 + 0.005;
      }
      update() {
        this.swing += this.swingSpeed;
        this.y += this.speedY;
        this.x += this.speedX + Math.sin(this.swing) * 0.5;
        if (this.y > H + 10) this.reset();
        if (this.x < -10) this.x = W + 10;
        if (this.x > W + 10) this.x = -10;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 248, 255, ${this.opacity})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(240, 248, 255, 0.8)";
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    for (let i = 0; i < FLAKE_COUNT; i++) flakes.push(new Flake());

    function loop() {
      ctx.clearRect(0, 0, W, H);
      for (const f of flakes) {
        f.update();
        f.draw();
      }
      requestAnimationFrame(loop);
    }
    loop();

    console.log("❄️ Снег запущен:", FLAKE_COUNT, "снежинок");
  }
}