// src/pages/mypage/index.js
import { template } from "./template.js";
import { createMyPageState } from "./state.js";
import { fetchMe } from "./api.js";
import { initTabsSection } from "./tabs.js";

export async function renderMyPage(view) {
  view.innerHTML = template();

  const state = createMyPageState();

  try {
    state.me = await fetchMe();
  } catch (e) {
    renderFatal(view, "내 정보 조회에 실패했다");
    return;
  }

  initTabsSection(state);
  await state.renderActiveTab();
}

function renderFatal(view, message) {
  view.innerHTML = `
    <div class="mypage-wrap">
      <h2 class="mypage-title">마이페이지</h2>
      <div class="card">
        <div class="empty">${escapeHtml(message || "오류가 발생했다")}</div>
      </div>
    </div>
  `;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
