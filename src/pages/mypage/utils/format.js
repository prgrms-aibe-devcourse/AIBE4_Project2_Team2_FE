// src/pages/mypage/utils/format.js
import { escapeHtml } from "./dom.js";

export function formatDateTime(v) {
  if (!v) return "";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${hh}:${mm}`;
  } catch {
    return String(v);
  }
}

export function renderStars(rating) {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  const full = Math.round(r); // 정수 점수면 그대로, 소수면 반올림
  let html = "";
  for (let i = 1; i <= 5; i += 1) {
    html += `<span class="star ${i <= full ? "on" : ""}">★</span>`;
  }
  return html;
}
