// src/pages/mypage/pagination.js
import { escapeHtml } from "./utils/dom.js";

/*
  - page는 1부터 시작
  - totalPages는 최소 1
  - onChange에는 1-based page를 넘긴다
*/
export function renderPagination(container, { page, totalPages, onChange }) {
  if (!container) return;

  const tp = clampInt(totalPages, 1, Number.MAX_SAFE_INTEGER);
  const current = clampInt(page, 1, tp);

  const maxButtons = 7;
  const start = calcStart(current, tp, maxButtons);
  const end = calcEnd(start, tp, maxButtons);

  const btns = [];

  // 이전 화살표: 1페이지면 아예 없음
  if (current > 1) btns.push(btn("arrow", "‹", current - 1));

  for (let p = start; p <= end; p += 1) {
    btns.push(btn(p === current ? "active" : "", String(p), p));
  }

  // 다음 화살표: 마지막 페이지면 아예 없음
  if (current < tp) btns.push(btn("arrow", "›", current + 1));

  container.innerHTML = btns.join("");

  container.onclick = async (e) => {
    const b = e.target.closest(".page-btn");
    if (!b) return;

    const p = b.getAttribute("data-page");
    if (p == null) return;

    const next = Number(p);
    if (!Number.isFinite(next)) return;
    if (next < 1 || next > tp) return;

    await onChange(next);
  };

  function btn(extraClass, label, p) {
    const cls = `page-btn ${extraClass || ""}`.trim();
    return `<button class="${cls}" type="button" data-page="${p}">${escapeHtml(
      label
    )}</button>`;
  }
}

function clampInt(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  const i = Math.trunc(n);
  if (i < min) return min;
  if (i > max) return max;
  return i;
}

function calcStart(current, totalPages, maxButtons) {
  const half = Math.floor(maxButtons / 2);
  let start = current - half;
  if (start < 1) start = 1;

  const end = start + (maxButtons - 1);
  if (end > totalPages) start = Math.max(1, totalPages - (maxButtons - 1));
  return start;
}

function calcEnd(start, totalPages, maxButtons) {
  return Math.min(totalPages, start + (maxButtons - 1));
}
