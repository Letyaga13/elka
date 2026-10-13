import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { v4 as uuid } from "uuid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import QRCode from "qrcode";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client")));

const content = JSON.parse(fs.readFileSync(path.join(__dirname, "data/content.json")));
const playlists = JSON.parse(fs.readFileSync(path.join(__dirname, "data/playlists.json")));

// -------- REST API --------
app.get("/api/content", (req, res) => res.json(content));

app.get("/api/content/:id", (req, res) => {
  const item = content.find(c => c.id === req.params.id);
  item ? res.json(item) : res.status(404).json({ error: "Not found" });
});

app.get("/api/playlists", (req, res) => res.json(playlists));

app.get("/api/playlists/:mood", (req, res) => {
  const pl = playlists[req.params.mood];
  if (!pl) return res.status(404).json({ error: "No such mood" });
  res.json({ ...pl, items: pl.ids.map(id => content.find(c => c.id === id)) });
});

app.post("/api/recommend", (req, res) => {
  const { history = [] } = req.body;
  const seen = new Set(history);
  const moodScore = {};
  history.forEach(id => {
    const item = content.find(c => c.id === id);
    if (!item) return;
    (item.moods || []).forEach(m => (moodScore[m] = (moodScore[m] || 0) + 1));
  });
  const recs = content
    .filter(c => !seen.has(c.id))
    .map(c => ({
      ...c,
      score: (c.moods || []).reduce((s, m) => s + (moodScore[m] || 0), 0)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
  res.json(recs);
});

// -------- Генерация QR-кода --------
app.get("/api/qr", async (req, res) => {
  const text = String(req.query.text || "").slice(0, 500);
  if (!text) return res.status(400).json({ error: "No text" });

  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 300,
      margin: 1,
      color: {
        dark: "#0a0e14",       // тёмный = цвет модулей QR
        light: "#f0ece4",      // светлый = фон
      },
      errorCorrectionLevel: "M",
    });
    res.json({ dataUrl });
  } catch (err) {
    console.error("QR error:", err);
    res.status(500).json({ error: "QR generation failed" });
  }
});

// -------- Комнаты для совместного просмотра --------
const rooms = {};

app.post("/api/rooms", (req, res) => {
  const id = uuid().slice(0, 8);
  rooms[id] = {
    users: new Set(),
    state: { contentId: null, playing: false, t: 0 },
    chat: [],                        // ⬅️ добавили
  };
  res.json({ id });
});

// -------- WebSocket --------
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, "http://x");
  const roomId = url.searchParams.get("room");
  if (!roomId || !rooms[roomId]) return ws.close();

  const room = rooms[roomId];
  room.users.add(ws);

  // Отправляем новому пользователю состояние комнаты + историю чата
  ws.send(JSON.stringify({
    type: "init",
    state: room.state,
    chatHistory: room.chat || [],
    userCount: room.users.size,
  }));

  // Сообщаем ВСЕМ, что кто-то подключился
  broadcast(room, {
    type: "user-joined",
    userCount: room.users.size,
  });

  ws.on("message", raw => {
    let msg; try { msg = JSON.parse(raw); } catch { return; }

    // Sync-команды плеера
    if (["play", "pause", "seek", "change"].includes(msg.type)) {
      room.state = { ...room.state, ...msg.state };
      for (const client of room.users) {
        if (client !== ws && client.readyState === 1)
          client.send(JSON.stringify(msg));
      }
      return;
    }

    // Чат
    if (msg.type === "chat") {
      const message = {
        id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        name: String(msg.name || "Аноним").slice(0, 30),
        text: String(msg.text || "").slice(0, 500),
        time: new Date().toISOString(),
      };
      if (!message.text.trim()) return;

      if (!room.chat) room.chat = [];
      room.chat.push(message);
      if (room.chat.length > 100) room.chat.shift();

      broadcast(room, { type: "chat", message });
      return;
    }
  });

  ws.on("close", () => {
    room.users.delete(ws);

    // Сообщаем всем, что кто-то вышел
    broadcast(room, {
      type: "user-left",
      userCount: room.users.size,
    });

    if (room.users.size === 0) {
      // Удаляем комнату, только если прошло 5 минут пустоты
      setTimeout(() => {
        if (rooms[roomId] && rooms[roomId].users.size === 0) {
          delete rooms[roomId];
        }
      }, 5 * 60 * 1000);
    }
  });
});

// Хелпер — отправить всем в комнате
function broadcast(room, msg) {
  const data = JSON.stringify(msg);
  for (const client of room.users) {
    if (client.readyState === 1) client.send(data);
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🎄 Ёлка запущена: http://localhost:${PORT}`);
});