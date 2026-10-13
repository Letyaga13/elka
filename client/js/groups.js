// ============================================================
// ГРУППЫ
// ============================================================

import { t } from "./i18n.js";
import { getProfile, getFriends } from "./profile.js";

const PROFILE_KEY = "elka_profile";

// ============== ДАННЫЕ ==============

export function getGroups() {
  const p = getProfile();
  return p?.groups || [];
}

export function getGroupById(id) {
  return getGroups().find((g) => g.id === id);
}

export function createGroup(name, members) {
  const p = getProfile();
  if (!p) return { ok: false, error: "not_logged_in" };

  const cleanName = String(name).trim().slice(0, 40);
  if (!cleanName) return { ok: false, error: "empty" };

  // Уникальные участники, включая себя
  const allMembers = [...new Set([p.username, ...members])];

  const group = {
    id: "g_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
    name: cleanName,
    createdAt: new Date().toISOString(),
    createdBy: p.username,
    members: allMembers,
    playlist: [],
  };

  if (!p.groups) p.groups = [];
  p.groups.push(group);
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  return { ok: true, group };
}

export function deleteGroup(groupId) {
  const p = getProfile();
  if (!p || !p.groups) return;
  p.groups = p.groups.filter((g) => g.id !== groupId);
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export function addToGroupPlaylist(groupId, item) {
  const p = getProfile();
  if (!p || !p.groups) return { ok: false };

  const group = p.groups.find((g) => g.id === groupId);
  if (!group) return { ok: false };

  // Проверка дубля
  if (group.playlist.some((x) => x.id === item.id)) {
    return { ok: false, error: "exists" };
  }

  group.playlist.push({
    id: item.id,
    title: item.title,
    type: item.type,
    addedBy: p.username,
    addedAt: new Date().toISOString(),
  });

  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  return { ok: true };
}

export function removeFromGroupPlaylist(groupId, itemId) {
  const p = getProfile();
  if (!p || !p.groups) return;

  const group = p.groups.find((g) => g.id === groupId);
  if (!group) return;

  group.playlist = group.playlist.filter((x) => x.id !== itemId);
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

// ============== UI ==============

let currentGroupId = null; // для модалки

export function initGroupsUI() {
  const createBtn = document.getElementById("createGroupBtn");
  const form = document.getElementById("createGroupForm");
  const nameInput = document.getElementById("groupNameInput");
  const membersPicker = document.getElementById("groupMembersPicker");
  const confirmBtn = document.getElementById("createGroupConfirm");
  const cancelBtn = document.getElementById("createGroupCancel");

  if (!createBtn || !form) return;

  // Открыть форму
  createBtn.addEventListener("click", () => {
    form.hidden = !form.hidden;
    if (!form.hidden) {
      renderMembersPicker();
      setTimeout(() => nameInput.focus(), 50);
    }
  });

  cancelBtn?.addEventListener("click", () => {
    form.hidden = true;
    nameInput.value = "";
  });

  // Создать
  confirmBtn?.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) {
      alert(t("groups.needName"));
      nameInput.focus();
      return;
    }

    const selected = [...membersPicker.querySelectorAll(".group-member-chip.selected")]
      .map((el) => el.dataset.name);

    if (!selected.length) {
      alert(t("groups.needMembers"));
      return;
    }

    const result = createGroup(name, selected);
    if (!result.ok) return;

    nameInput.value = "";
    form.hidden = true;
    renderGroups();
  });

  nameInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      confirmBtn.click();
    }
    if (e.key === "Escape") {
      cancelBtn.click();
    }
  });

  // Модалка группы
  initGroupModal();

  renderGroups();
}

function renderMembersPicker() {
  const picker = document.getElementById("groupMembersPicker");
  if (!picker) return;

  const friends = getFriends();
  if (!friends.length) {
    picker.innerHTML = `<span style="color:var(--white-dim);font-size:0.8rem;font-style:italic;">Сначала добавь друзей</span>`;
    return;
  }

  picker.innerHTML = friends
    .map((f) => `<div class="group-member-chip" data-name="${escapeHtml(f.name)}">${escapeHtml(f.name)}</div>`)
    .join("");

  picker.querySelectorAll(".group-member-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("selected");
    });
  });
}

export function renderGroups() {
  const list = document.getElementById("groupsList");
  const empty = document.getElementById("groupsEmpty");
  if (!list || !empty) return;

  const groups = getGroups();

  if (!groups.length) {
    list.innerHTML = "";
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  list.innerHTML = groups
    .map((g) => `
      <li class="group-item" data-group-id="${g.id}">
        <div class="group-icon">🎁</div>
        <div class="group-info">
          <div class="group-name">${escapeHtml(g.name)}</div>
          <div class="group-count">${g.members.length} ${t("groups.membersCount")} · ${g.playlist.length} ${t("groups.playlistCount")}</div>
        </div>
      </li>
    `)
    .join("");

  list.querySelectorAll(".group-item").forEach((el) => {
    el.addEventListener("click", () => openGroupModal(el.dataset.groupId));
  });
}

function openGroupModal(groupId) {
  const group = getGroupById(groupId);
  if (!group) return;

  currentGroupId = groupId;
  const modal = document.getElementById("groupModal");
  if (!modal) return;

  renderGroupModal(group);
  modal.hidden = false;
}

function renderGroupModal(group) {
  const title = document.getElementById("groupTitle");
  const meta = document.getElementById("groupMeta");
  const membersList = document.getElementById("groupMembersList");
  const playlist = document.getElementById("groupPlaylist");
  const playlistEmpty = document.getElementById("groupPlaylistEmpty");

  title.textContent = `🎁 ${group.name}`;

  const date = new Date(group.createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  meta.textContent = `${t("groups.by")} ${group.createdBy} · ${date}`;

  membersList.innerHTML = group.members
    .map((m) => `<li>${escapeHtml(m)}</li>`)
    .join("");

  if (!group.playlist.length) {
    playlist.innerHTML = "";
    playlistEmpty.hidden = false;
  } else {
    playlistEmpty.hidden = true;
    playlist.innerHTML = group.playlist
      .map((item) => {
        const icon = { movie: "🎬", song: "🎵", book: "📖" }[item.type] || "⭐";
        return `
          <li>
            <span class="group-playlist-icon">${icon}</span>
            <span class="group-playlist-title" data-item-id="${item.id}">${escapeHtml(item.title)}</span>
            <span class="group-playlist-added">${t("groups.addedBy")} ${escapeHtml(item.addedBy)}</span>
            <button class="group-playlist-remove" data-item-id="${item.id}">✕</button>
          </li>
        `;
      })
      .join("");

    // Клик по названию — открыть объект
    playlist.querySelectorAll(".group-playlist-title").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.dataset.itemId;
        document.getElementById("groupModal").hidden = true;
        window.dispatchEvent(new CustomEvent("open-content", { detail: id }));
      });
    });

    // Удалить
    playlist.querySelectorAll(".group-playlist-remove").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeFromGroupPlaylist(currentGroupId, btn.dataset.itemId);
        const updated = getGroupById(currentGroupId);
        if (updated) renderGroupModal(updated);
        renderGroups();
      });
    });
  }
}

function initGroupModal() {
  const modal = document.getElementById("groupModal");
  const close = document.getElementById("closeGroup");
  const backdrop = modal?.querySelector("[data-close-group]");
  const inviteBtn = document.getElementById("groupInviteBtn");
  const deleteBtn = document.getElementById("groupDeleteBtn");
  const addFromTree = document.getElementById("groupAddFromTree");

  if (!modal || !close) return;

  close.addEventListener("click", () => { modal.hidden = true; });
  backdrop?.addEventListener("click", () => { modal.hidden = true; });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) modal.hidden = true;
  });

  // Пригласить
  inviteBtn?.addEventListener("click", async () => {
    if (!currentGroupId) return;
    const link = `${location.origin}/?group=${currentGroupId}`;
    try {
      await navigator.clipboard.writeText(link);
      alert(t("groups.inviteCopied") + "\n\n" + link);
    } catch {
      prompt("Скопируй ссылку:", link);
    }
  });

  // Удалить группу
  deleteBtn?.addEventListener("click", () => {
    if (!currentGroupId) return;
    if (!confirm(t("groups.confirmDelete"))) return;
    deleteGroup(currentGroupId);
    modal.hidden = true;
    renderGroups();
  });

  // Добавить из каталога
  addFromTree?.addEventListener("click", () => {
    modal.hidden = true;
    window.dispatchEvent(new CustomEvent("open-catalog-for-group", {
      detail: currentGroupId
    }));
  });
}

// Открыть группу из URL (?group=xxxx)
export function openGroupFromUrl(groupId) {
  const group = getGroupById(groupId);
  if (!group) {
    alert("Группа не найдена");
    return;
  }
  openGroupModal(groupId);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}