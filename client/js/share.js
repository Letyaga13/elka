import { getProfile, saveProfile } from "./profile.js";

// ============================================================
// СОТРУДНИЧЕСТВО — WebSocket + ЧАТ
// ============================================================

const NAME_KEY = "elka_username";

// Получить или спросить имя пользователя
function getUsername() {
  // Сначала — профиль
  const profile = getProfile();
  if (profile && profile.username) {
    return profile.username;
  }

  // Если нет профиля — спросим через prompt (пока)
  let name = localStorage.getItem(NAME_KEY);
  if (!name) {
    name = prompt("Как тебя зовут? / What's your name?", "Гость") || "Гость";
    name = name.trim().slice(0, 30) || "Гость";
    localStorage.setItem(NAME_KEY, name);
  }
  return name;
}

export function initShare(state, roomId) {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  const ws = new WebSocket(`${proto}://${location.host}/?room=${roomId}`);
  state.ws = ws;
  state.username = getUsername();

  // Показываем чат
  const chatBox = document.getElementById("chatBox");
  if (chatBox) chatBox.hidden = false;

  // Кнопка сворачивания чата
  const toggle = document.getElementById("chatToggle");
  if (toggle && !toggle.dataset.bound) {
    toggle.dataset.bound = "1";
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      chatBox.classList.toggle("collapsed");
      toggle.textContent = chatBox.classList.contains("collapsed") ? "+" : "−";
    });

    // Клик по шапке — тоже сворачивает
    chatBox.querySelector(".chat-header").addEventListener("click", () => {
      chatBox.classList.toggle("collapsed");
      toggle.textContent = chatBox.classList.contains("collapsed") ? "+" : "−";
    });
  }

  // Форма отправки
    // Форма отправки — ПРИВЯЗЫВАЕМ ВСЕГДА, чтобы не пропустить
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");

  // Удаляем старый обработчик если был (через replace)
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  const inputNew = document.getElementById("chatInput");

  newForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = inputNew.value.trim();
    if (!text) return;
    if (!state.ws || state.ws.readyState !== 1) {
      console.warn("WS не готов, состояние:", state.ws?.readyState);
      return;
    }

    console.log("📤 Отправка:", text);
    state.ws.send(JSON.stringify({
      type: "chat",
      name: state.username,
      text: text,
    }));
    inputNew.value = "";
  });

  ws.onopen = () => {
    console.log("🔗 Подключено к комнате", roomId);
    addSystemMessage(`Ты в комнате ${roomId} как «${state.username}»`);
  };

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);

    if (msg.type === "init") {
      // Восстанавливаем историю чата
      if (msg.chatHistory?.length) {
        msg.chatHistory.forEach((m) => renderChatMessage(m));
      }
      if (msg.userCount) updateUserCount(msg.userCount);
      if (msg.state?.contentId) {
        const item = state.content?.find((c) => c.id === msg.state.contentId);
        if (item) addSystemMessage(`▶ Сейчас смотрят: ${item.title}`);
      }
      return;
    }

    if (msg.type === "chat") {
      renderChatMessage(msg.message);
      return;
    }

    if (msg.type === "user-joined") {
      updateUserCount(msg.userCount);
      addSystemMessage("👤 Кто-то присоединился");
      return;
    }

    if (msg.type === "user-left") {
      updateUserCount(msg.userCount);
      addSystemMessage("👋 Кто-то вышел");
      return;
    }

    // Sync-команды плеера
    if (msg.type === "play")  console.log("Remote play",  msg.state);
    if (msg.type === "pause") console.log("Remote pause", msg.state);
    if (msg.type === "seek")  console.log("Remote seek",  msg.state);
  };

  ws.onclose = () => console.log("🔌 Комната закрыта");
  ws.onerror = (err) => console.error("Ошибка WebSocket:", err);
}

// ==== UI чата ====

function renderChatMessage(m) {
  const body = document.getElementById("chatBody");
  if (!body) return;

  const isSelf = m.name === localStorage.getItem(NAME_KEY);
  const div = document.createElement("div");
  div.className = `chat-msg ${isSelf ? "self" : ""}`;

  const time = new Date(m.time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  div.innerHTML = `
    <span class="chat-msg-name">${escapeHtml(m.name)}</span>
    <span class="chat-msg-text">${escapeHtml(m.text)}</span>
    <span class="chat-msg-time">${time}</span>
  `;
  body.appendChild(div);

  // Прокрутка вниз
  body.scrollTop = body.scrollHeight;
}

function addSystemMessage(text) {
  const body = document.getElementById("chatBody");
  if (!body) return;

  const div = document.createElement("div");
  div.className = "chat-system";
  div.textContent = text;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

function updateUserCount(count) {
  const el = document.getElementById("chatCount");
  if (el) el.textContent = `👥 ${count}`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}