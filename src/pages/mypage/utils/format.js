// src/pages/mypage/utils/format.js
/*
  포맷 유틸 모음
  - 날짜/시간 문자열 포맷 처리
  - 별점 HTML 렌더링 처리
*/

import { escapeHtml } from "./dom.js";

/*
  날짜/시간 포맷(YYYY-MM-DD HH:mm)
  - 파싱 실패 시 원본 값을 문자열로 반환
*/
export function formatDateTime(v) {
  if (!v) return "";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return escapeHtml(String(v));

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");

    return `${y}-${m}-${day} ${hh}:${mm}`;
  } catch {
    return escapeHtml(String(v));
  }
}

/*
  별점 렌더링
  - 0~5 범위로 보정
  - 소수점 점수는 반올림 처리
*/
export function renderStars(rating) {
  const r = Number(rating);
  const safe = Number.isFinite(r) ? r : 0;

  const clamped = Math.max(0, Math.min(5, safe));
  const full = Math.round(clamped);

  let html = "";
  for (let i = 1; i <= 5; i += 1) {
    html += `<span class="star ${i <= full ? "on" : ""}">★</span>`;
  }
  return html;
}
