// src/pages/mypage/utils/dom.js
export function $(id) {
  if (!id) return null;
  return document.getElementById(id);
}

export function setText(id, text) {
  const el = $(id);
  if (!el) return;
  el.textContent = String(text ?? "");
}

export function setValue(id, value) {
  const el = $(id);
  if (!el) return;
  el.value = value == null ? "" : String(value);
}

export function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function escapeAttr(s) {
  return escapeHtml(s);
}
