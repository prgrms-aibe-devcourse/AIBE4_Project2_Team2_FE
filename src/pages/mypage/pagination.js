// src/pages/mypage/pagination.js
/*
  페이지네이션 렌더러
  - page는 1-based(1부터 시작)
  - totalPages는 최소 1
  - onChange에는 1-based page를 넘긴다
  - 기존 코드는 renderPagination 호출 때마다 container.onclick을 새로 할당한다
    이벤트 누수는 아니지만, 패턴을 명확히 하기 위해 addEventListener + 1회 바인딩으로 정리한다
*/

import { escapeHtml } from "./utils/dom.js";

const MAX_BUTTONS = 7;

export function renderPagination(container, { page, totalPages, onChange }) {
  if (!container) return;

  const tp = clampInt(totalPages, 1, Number.MAX_SAFE_INTEGER);
  const current = clampInt(page, 1, tp);

  const start = calcStart(current, tp, MAX_BUTTONS);
  const end = calcEnd(start, tp, MAX_BUTTONS);

  const html = [];

  // 이전 버튼: 1페이지면 숨김
  if (current > 1)
    html.push(renderBtn({ kind: "arrow", label: "‹", page: current - 1 }));

  // 숫자 버튼
  for (let p = start; p <= end; p += 1) {
    html.push(
      renderBtn({
        kind: p === current ? "active" : "",
        label: String(p),
        page: p,
      })
    );
  }

  // 다음 버튼: 마지막 페이지면 숨김
  if (current < tp)
    html.push(renderBtn({ kind: "arrow", label: "›", page: current + 1 }));

  container.innerHTML = html.join("");

  // 클릭 핸들러는 1회만 바인딩하고, 최신 onChange를 container에 저장해 참조한다
  container.__mmPager = container.__mmPager || {};
  container.__mmPager.onChange = onChange;
  container.__mmPager.totalPages = tp;

  bindPagerOnce(container);
}

/*
  버튼 HTML 생성
*/
function renderBtn({ kind, label, page }) {
  const cls = `page-btn ${kind || ""}`.trim();
  return `<button class="${cls}" type="button" data-page="${page}">${escapeHtml(
    label
  )}</button>`;
}

/*
  페이지네이션 클릭 이벤트 1회 바인딩
  - renderPagination이 여러 번 호출되어도 이벤트는 한 번만 등록된다
*/
function bindPagerOnce(container) {
  if (container.__mmPager?.bound) return;
  container.__mmPager.bound = true;

  container.addEventListener("click", async (e) => {
    const b = e.target.closest(".page-btn");
    if (!b) return;

    const p = b.getAttribute("data-page");
    if (p == null) return;

    const next = Number(p);
    if (!Number.isFinite(next)) return;

    const tp = container.__mmPager?.totalPages ?? 1;
    if (next < 1 || next > tp) return;

    const handler = container.__mmPager?.onChange;
    if (typeof handler !== "function") return;

    await handler(next);
  });
}

/*
  정수 범위 보정
*/
function clampInt(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  const i = Math.trunc(n);
  if (i < min) return min;
  if (i > max) return max;
  return i;
}

/*
  시작 페이지 계산
  - 현재 페이지를 중심으로 MAX_BUTTONS 범위가 보이도록 조정한다
*/
function calcStart(current, totalPages, maxButtons) {
  const half = Math.floor(maxButtons / 2);

  let start = current - half;
  if (start < 1) start = 1;

  const end = start + (maxButtons - 1);
  if (end > totalPages) start = Math.max(1, totalPages - (maxButtons - 1));

  return start;
}

/*
  끝 페이지 계산
*/
function calcEnd(start, totalPages, maxButtons) {
  return Math.min(totalPages, start + (maxButtons - 1));
}
