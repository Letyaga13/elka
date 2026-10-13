// ============================================================
// ГЕНЕРАЦИЯ PNG-КАРТОЧКИ
// ============================================================

import { t } from "./i18n.js";

// Размеры карточки
const CARD_W = 800;
const CARD_H = 1100;

// Иконки
const TYPE_ICONS = { movie: "🎬", song: "🎵", book: "📖" };
const TYPE_LABELS = { movie: "фильм", song: "песня", book: "книга" };

// Загрузить картинку из URL (для шара)
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Рисуем фон с градиентом
function drawBackground(ctx) {
  // Основной градиент
  const grad = ctx.createLinearGradient(0, 0, 0, CARD_H);
  grad.addColorStop(0, "#0a1628");
  grad.addColorStop(0.5, "#142b4a");
  grad.addColorStop(1, "#0a0e14");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Золотистое свечение снизу
  const glow = ctx.createRadialGradient(
    CARD_W / 2, CARD_H, 0,
    CARD_W / 2, CARD_H, CARD_W * 0.9
  );
  glow.addColorStop(0, "rgba(212, 165, 69, 0.25)");
  glow.addColorStop(1, "rgba(212, 165, 69, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Звёзды/снежинки
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * CARD_W;
    const y = Math.random() * CARD_H;
    const r = Math.random() * 2 + 0.3;
    const opacity = Math.random() * 0.7 + 0.2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(240, 248, 255, ${opacity})`;
    ctx.fill();
  }

  // Верхняя золотая линия
  ctx.strokeStyle = "rgba(212, 165, 69, 0.6)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(60, 80);
  ctx.lineTo(CARD_W - 60, 80);
  ctx.stroke();
}

// Рисуем логотип
function drawLogo(ctx) {
  ctx.font = "bold 42px 'Marmelad', 'Georgia', serif";
  ctx.fillStyle = "#f0cd7a";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("🎄 ЁЛКА", 60, 110);

  ctx.font = "16px 'Montserrat', sans-serif";
  ctx.fillStyle = "rgba(240, 236, 228, 0.55)";
  ctx.letterSpacing = "3px";
  ctx.fillText(t("app.subtitle").toUpperCase(), 60, 165);
}

// Рисуем шар-иконку по центру
function drawBall(ctx, item, ballImage) {
  const cx = CARD_W / 2;
  const cy = 400;
  const size = 220;

  if (ballImage) {
    // Свечение позади
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size);
    glow.addColorStop(0, "rgba(212, 165, 69, 0.5)");
    glow.addColorStop(1, "rgba(212, 165, 69, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(cx - size, cy - size, size * 2, size * 2);

    // Сам шар
    ctx.drawImage(ballImage, cx - size / 2, cy - size / 2, size, size);
  } else {
    // Если картинки нет — рисуем круг с эмодзи
    const grd = ctx.createRadialGradient(
      cx - 30, cy - 30, 10,
      cx, cy, size / 2
    );
    grd.addColorStop(0, "#f7e3b0");
    grd.addColorStop(0.5, "#d4a545");
    grd.addColorStop(1, "#8a6522");

    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = `${size * 0.5}px 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(TYPE_ICONS[item.type] || "⭐", cx, cy);
  }
}

// Рисуем название и метаданные
function drawTitle(ctx, item) {
  const cx = CARD_W / 2;

  // Тип
  ctx.font = "18px 'Montserrat', sans-serif";
  ctx.fillStyle = "rgba(212, 165, 69, 0.9)";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(TYPE_LABELS[item.type]?.toUpperCase() || "", cx, 590);

  // Название
  ctx.font = "bold 48px 'Marmelad', 'Georgia', serif";
  ctx.fillStyle = "#f0ece4";

  // Переносим длинные названия
  const maxWidth = CARD_W - 120;
  const words = item.title.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const lineHeight = 58;
  const startY = 640;
  lines.slice(0, 3).forEach((line, i) => {
    ctx.fillText(line, cx, startY + i * lineHeight);
  });

  const titleEndY = startY + Math.min(lines.length, 3) * lineHeight;

  // Автор / год
  const parts = [];
  if (item.artist) parts.push(item.artist);
  if (item.author) parts.push(item.author);
  if (item.year) parts.push(item.year);

  if (parts.length) {
    ctx.font = "22px 'Montserrat', sans-serif";
    ctx.fillStyle = "rgba(240, 236, 228, 0.65)";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(parts.join(" · "), cx, titleEndY + 20);
  }
}

// Рисуем подвал
function drawFooter(ctx) {
  ctx.font = "16px 'Marmelad', 'Georgia', serif";
  ctx.fillStyle = "rgba(212, 165, 69, 0.6)";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(t("share.cardFooter"), CARD_W / 2, CARD_H - 30);
}

// Рисуем QR-код и подпись
function drawQRBlock(ctx, qrImage, url) {
  const qrSize = 180;
  const padding = 30;

  const qrX = CARD_W - qrSize - padding - 40;
  const qrY = CARD_H - qrSize - padding - 90;

  // Подложка под QR (белый квадрат со скруглением)
  ctx.save();
  roundRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 16);
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.fill();
  ctx.restore();

  // Сам QR
  if (qrImage) {
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
  } else {
    // Если QR не загрузился — заглушка
    ctx.fillStyle = "rgba(10, 14, 20, 0.5)";
    ctx.fillRect(qrX, qrY, qrSize, qrSize);
    ctx.font = "14px 'Montserrat', sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("QR", qrX + qrSize / 2, qrY + qrSize / 2);
  }

  // Подпись слева от QR
  const textX = 60;
  const textY = qrY + qrSize / 2 - 20;

  ctx.font = "bold 20px 'Montserrat', sans-serif";
  ctx.fillStyle = "#f0cd7a";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("📱 Открой на телефоне", textX, textY);

  ctx.font = "15px 'Montserrat', sans-serif";
  ctx.fillStyle = "rgba(240, 236, 228, 0.6)";
  ctx.fillText("Наведи камеру на QR-код", textX, textY + 34);
  ctx.fillText("или открой ссылку:", textX, textY + 60);

  // Сама ссылка (короткая)
  ctx.font = "13px 'Montserrat', monospace";
  ctx.fillStyle = "rgba(212, 165, 69, 0.9)";
  const shortUrl = url.replace(/^https?:\/\//, "").slice(0, 34);
  ctx.fillText(shortUrl, textX, textY + 84);
}

// Скруглённый прямоугольник
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ============================================================
// ОСНОВНАЯ ФУНКЦИЯ
// ============================================================
export async function generateCard(item) {
  // Создаём Canvas
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");

  // Ссылка на объект
  const itemUrl = `${location.origin}/?id=${item.id}`;

  // Загружаем картинку шара и QR-код ПАРАЛЛЕЛЬНО
  const ballSrc = {
    movie: "/assets/shar_kino.png",
    song:  "/assets/shar_musica.png",
    book:  "/assets/shar_kniga.png",
  }[item.type];

  const [ballImage, qrImage] = await Promise.all([
    loadImage(ballSrc),
    loadQR(itemUrl),
  ]);

  // Рисуем
  drawBackground(ctx);
  drawLogo(ctx);
  drawBall(ctx, item, ballImage);
  drawTitle(ctx, item);
  drawQRBlock(ctx, qrImage, itemUrl);
  drawFooter(ctx);

  // Возвращаем Data URL
  return canvas.toDataURL("image/png");
}

// Скачать картинку
export function downloadCard(dataUrl, item) {
  const link = document.createElement("a");
  const safeName = item.title
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  link.download = `elka-${safeName || "card"}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Показать уведомление
export function showShareToast(text) {
  const toast = document.createElement("div");
  toast.className = "share-toast";
  toast.textContent = text;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 2200);
}

// Загрузить QR-код с сервера
async function loadQR(text) {
  try {
    const res = await fetch(`/api/qr?text=${encodeURIComponent(text)}`);
    if (!res.ok) return null;
    const { dataUrl } = await res.json();
    return await loadImage(dataUrl);
  } catch (err) {
    console.warn("QR load failed:", err);
    return null;
  }
}

// Обработчик кнопки на карточке
export async function shareCard(item) {
  try {
    showShareToast(t("share.generating"));
    const dataUrl = await generateCard(item);
    downloadCard(dataUrl, item);
    setTimeout(() => {
      showShareToast(t("share.downloaded"));
    }, 300);
  } catch (err) {
    console.error("Ошибка генерации карточки:", err);
    showShareToast(t("share.error"));
  }
}