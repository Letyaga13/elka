// ============================================================
// SERVICE WORKER — оффлайн-кэш и установка как приложение
// ============================================================

const CACHE_NAME = "elka-v1";
const URLS_TO_CACHE = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/app.js",
  "/js/cats.js",
  "/js/nav.js",
  "/js/player.js",
  "/js/share.js",
  "/js/snow.js",
  "/js/tree-photo.js",
  "/assets/elka.png",
  "/assets/лого.png",
];

// Устанавливаем — кэшируем файлы
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("📦 Кэшируем файлы");
      return cache.addAll(URLS_TO_CACHE).catch((err) => {
        console.warn("Не удалось закэшировать всё:", err);
      });
    })
  );
});

// Активируем — удаляем старый кэш, если был
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("🗑 Удаляем старый кэш:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Перехватываем запросы — отдаём из кэша, если есть
self.addEventListener("fetch", (event) => {
  // Пропускаем только GET-запросы
  if (event.request.method !== "GET") return;

  // Пропускаем API — не кэшируем
  if (event.request.url.includes("/api/")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Не кэшируем неудачные ответы
        if (!response || response.status !== 200 || response.type === "error") {
          return response;
        }

        // Кэшируем только свои файлы
        const url = new URL(event.request.url);
        if (url.origin === location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }

        return response;
      }).catch(() => {
        // Если совсем ничего — можно отдать заглушку
        return caches.match("/index.html");
      });
    })
  );
});