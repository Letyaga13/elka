// ============================================================
// ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ
// ============================================================

import { t } from "./i18n.js";
import { initGroupsUI, renderGroups } from "./groups.js";

const PROFILE_KEY = "elka_profile";

// ==== ДАННЫЕ ====

export function getProfile() {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveProfile(name) {
  const profile = {
    username: String(name).trim().slice(0, 30),
    joinedAt: new Date().toISOString(),
    friends: [],
    groups: [],
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function clearProfile() {
  localStorage.removeItem(PROFILE_KEY);
}

export function isLoggedIn() {
  return !!getProfile();
}

// ==== ДРУЗЬЯ ====

export function getFriends() {
  const profile = getProfile();
  return profile?.friends || [];
}

export function addFriend(name) {
  const profile = getProfile();
  if (!profile) return { ok: false, error: "not_logged_in" };

  const cleanName = String(name).trim().slice(0, 30);
  if (!cleanName) return { ok: false, error: "empty" };
  if (cleanName.toLowerCase() === profile.username.toLowerCase()) {
    return { ok: false, error: "self" };
  }

  if (!profile.friends) profile.friends = [];

  const exists = profile.friends.some(
    (f) => f.name.toLowerCase() === cleanName.toLowerCase()
  );
  if (exists) return { ok: false, error: "exists" };

  const friend = {
    id: "f_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
    name: cleanName,
    addedAt: new Date().toISOString(),
  };
  profile.friends.push(friend);
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return { ok: true, friend };
}

export function removeFriend(friendId) {
  const profile = getProfile();
  if (!profile || !profile.friends) return;

  profile.friends = profile.friends.filter((f) => f.id !== friendId);
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

// ==== UI ПРОФИЛЯ ====

export function initProfile() {
  const btn = document.getElementById("profileBtn");
  const modal = document.getElementById("profileModal");
  const close = document.getElementById("closeProfile");
  const backdrop = modal?.querySelector("[data-close-profile]");

  const loginBox = document.getElementById("profileLogin");
  const infoBox = document.getElementById("profileInfo");
  const nameInput = document.getElementById("profileNameInput");
  const loginBtn = document.getElementById("profileLoginBtn");
  const logoutBtn = document.getElementById("profileLogoutBtn");
  const nameDisplay = document.getElementById("profileName");
  const sinceDisplay = document.getElementById("profileSince");

  if (!btn || !modal || !close) return;

  function open() {
    renderProfile();
    modal.hidden = false;
    if (!isLoggedIn() && nameInput) {
      setTimeout(() => nameInput.focus(), 100);
    }
  }

  function closeModal() {
    modal.hidden = true;
  }

  function renderProfile() {
    const profile = getProfile();
    const friendsSection = document.getElementById("friendsSection");
    const groupsSection = document.getElementById("groupsSection");

    if (profile) {
      // Залогинен
      loginBox.hidden = true;
      infoBox.hidden = false;
      if (friendsSection) friendsSection.hidden = false;
      if (groupsSection) groupsSection.hidden = false;
      if (logoutBtn) logoutBtn.hidden = false;

      nameDisplay.textContent = profile.username;

      const date = new Date(profile.joinedAt);
      const formatted = date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      sinceDisplay.textContent = `${t("profile.since")} ${formatted}`;

      renderFriends();
      renderGroups();
    } else {
      // Не залогинен
      loginBox.hidden = false;
      infoBox.hidden = true;
      if (friendsSection) friendsSection.hidden = true;
      if (groupsSection) groupsSection.hidden = true;
      if (logoutBtn) logoutBtn.hidden = true;
      nameInput.value = "";
    }
  }

  // Открыть
  btn.addEventListener("click", open);

  // Закрыть
  close.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  // Вход
  loginBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      nameInput.style.borderColor = "#ef476f";
      setTimeout(() => { nameInput.style.borderColor = ""; }, 1000);
      return;
    }
    saveProfile(name);
    renderProfile();
    updateProfileBtn();
    window.dispatchEvent(new CustomEvent("profile-changed", { detail: getProfile() }));
  });

  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      loginBtn.click();
    }
  });

  // Выход
  logoutBtn.addEventListener("click", () => {
    if (!confirm("Выйти из профиля?")) return;
    clearProfile();
    renderProfile();
    updateProfileBtn();
    window.dispatchEvent(new CustomEvent("profile-changed", { detail: null }));
  });

  updateProfileBtn();
  initFriendsUI();
  initGroupsUI();
}

// ==== UI ДРУЗЕЙ ====

function initFriendsUI() {
  const addBtn = document.getElementById("addFriendBtn");
  const form = document.getElementById("addFriendForm");
  const input = document.getElementById("friendNameInput");
  const confirmBtn = document.getElementById("addFriendConfirm");
  const cancelBtn = document.getElementById("addFriendCancel");

  if (!addBtn || !form) return;

  addBtn.addEventListener("click", () => {
    form.hidden = !form.hidden;
    if (!form.hidden) setTimeout(() => input.focus(), 50);
  });

  cancelBtn?.addEventListener("click", () => {
    form.hidden = true;
    input.value = "";
  });

  confirmBtn?.addEventListener("click", () => {
    const name = input.value.trim();
    if (!name) { input.focus(); return; }

    const result = addFriend(name);

    if (!result.ok) {
      if (result.error === "exists") alert(t("friends.exists"));
      else if (result.error === "self") alert(t("friends.self"));
      return;
    }

    input.value = "";
    form.hidden = true;
    renderFriends();
  });

  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); confirmBtn.click(); }
    if (e.key === "Escape") cancelBtn.click();
  });
}

export function renderFriends() {
  const list = document.getElementById("friendsList");
  const empty = document.getElementById("friendsEmpty");
  if (!list || !empty) return;

  const friends = getFriends();

  if (!friends.length) {
    list.innerHTML = "";
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  list.innerHTML = friends
    .map((f) => {
      const initial = f.name.charAt(0).toUpperCase();
      const date = new Date(f.addedAt).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
      });

      return `
        <li class="friend-item">
          <div class="friend-avatar">${initial}</div>
          <div class="friend-info">
            <div class="friend-name">${escapeHtml(f.name)}</div>
            <div class="friend-date">${t("friends.since")} ${date}</div>
          </div>
          <button class="friend-delete" data-friend-id="${f.id}" title="${t("friends.delete")}">✕</button>
        </li>
      `;
    })
    .join("");

  list.querySelectorAll(".friend-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.friendId;
      if (confirm(t("friends.confirmDelete"))) {
        removeFriend(id);
        renderFriends();
      }
    });
  });
}

// ==== ОБНОВИТЬ КНОПКУ ПРОФИЛЯ ====

export function updateProfileBtn() {
  const btn = document.getElementById("profileBtn");
  if (!btn) return;

  const profile = getProfile();
  if (profile) {
    btn.textContent = profile.username.charAt(0).toUpperCase();
    btn.style.background = "rgba(212, 165, 69, 0.25)";
    btn.style.borderColor = "var(--gold-400)";
    btn.style.fontWeight = "bold";
    btn.title = `${t("profile.welcome")} ${profile.username}`;
  } else {
    btn.textContent = "👤";
    btn.style.background = "";
    btn.style.borderColor = "";
    btn.title = t("btn.profile.tooltip");
  }
}

// ==== УТИЛИТЫ ====

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}