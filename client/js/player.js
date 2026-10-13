export function openPlayer(item, state) {
  const modal = document.getElementById("modal");
  document.getElementById("modalTitle").textContent = item.title;
  document.getElementById("modalMeta").textContent =
    [item.artist, item.author, item.year].filter(Boolean).join(" • ");

  // Обновляем QR и кнопки «Поделиться»
  updateModalShare(item);

  const area = document.getElementById("playerArea");
  area.innerHTML = "";

  const isYouTube = item.url && (
    item.url.includes("youtube.com") || item.url.includes("youtu.be")
  );

  if (isYouTube) {
    const id = extractYouTubeId(item.url);
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1`;
    iframe.allow = "autoplay; encrypted-media; picture-in-picture";
    iframe.allowFullscreen = true;
    area.appendChild(iframe);
  } else if (item.type === "movie") {
    const v = document.createElement("video");
    v.src = item.url;
    v.controls = true;
    v.autoplay = true;
    v.playsInline = true;
    area.appendChild(v);
    v.addEventListener("play", () => broadcast(state, { type: "play", state: { contentId: item.id, t: v.currentTime } }));
    v.addEventListener("pause", () => broadcast(state, { type: "pause", state: { contentId: item.id, t: v.currentTime } }));
    v.addEventListener("seeked", () => broadcast(state, { type: "seek", state: { contentId: item.id, t: v.currentTime } }));
  } else if (item.type === "song") {
    const a = document.createElement("audio");
    a.src = item.url;
    a.controls = true;
    a.autoplay = true;
    area.appendChild(a);
  } else if (item.type === "book") {
    const iframe = document.createElement("iframe");
    iframe.src = item.url;
    area.appendChild(iframe);
  }

  modal.hidden = false;
  document.getElementById("closeModal").onclick = () => {
    modal.hidden = true;
    area.innerHTML = "";
  };
}

function broadcast(state, msg) {
  if (state.ws && state.ws.readyState === 1) {
    state.ws.send(JSON.stringify(msg));
  }
}

function extractYouTubeId(url) {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : "";
}

// ============================================================
// QR И ПОДЕЛИТЬСЯ В МОДАЛКЕ
// ============================================================
async function updateModalShare(item) {
  const shareBlock = document.getElementById("modalShare");
  const qrBox = document.getElementById("modalQR");
  const copyBtn = document.getElementById("modalCopyBtn");
  const downloadBtn = document.getElementById("modalDownloadBtn");

  if (!shareBlock || !qrBox || !copyBtn || !downloadBtn) return;

  // Показываем блок
  shareBlock.hidden = false;
  qrBox.innerHTML = "";

  const itemUrl = `${location.origin}/?id=${item.id}`;

  // === QR-код ===
  try {
    const res = await fetch(`/api/qr?text=${encodeURIComponent(itemUrl)}`);
    if (res.ok) {
      const { dataUrl } = await res.json();
      const img = document.createElement("img");
      img.src = dataUrl;
      img.alt = "QR";
      qrBox.appendChild(img);
    }
  } catch (err) {
    console.warn("QR не загрузился:", err);
    qrBox.innerHTML = `<span style="color:#666;font-size:0.8rem">QR</span>`;
  }

  // === Кнопка «Скопировать ссылку» ===
  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(itemUrl);
      copyBtn.textContent = "✅ " + copyBtn.textContent.replace(/^[📋✅]\s*/, "");
      setTimeout(() => {
        copyBtn.textContent = copyBtn.textContent.replace(/^[📋✅]\s*/, "📋 ");
      }, 2000);
    } catch {
      prompt("Скопируй ссылку:", itemUrl);
    }
  };

  // === Кнопка «Скачать карточку» ===
  downloadBtn.onclick = async () => {
    const { shareCard } = await import("./share-card.js");
    shareCard(item);
  };
}