const KEY = "elka_history";

export function recordView(state, id) {
  const history = JSON.parse(localStorage.getItem(KEY) || "[]");
  history.unshift(id);
  const trimmed = [...new Set(history)].slice(0, 20);
  localStorage.setItem(KEY, JSON.stringify(trimmed));
  state.history = trimmed;
}

export async function loadRecommendations(state, render) {
  const history = JSON.parse(localStorage.getItem(KEY) || "[]");
  state.history = history;

  try {
    const res = await fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history })
    });
    const items = await res.json();
    render(items);
  } catch (err) {
    console.error("Рекомендации не загрузились:", err);
  }
}