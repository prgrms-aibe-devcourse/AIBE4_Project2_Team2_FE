// src/pages/mypage/index.js
/*
  마이페이지 엔트리
  - template 렌더링 및 state 생성
  - 내 정보(me) 로딩 성공 시 탭 섹션 초기화 및 현재 탭 렌더링
  - 내 정보 로딩 실패 시 치명 오류 UI로 대체
*/

import { template } from "./template.js";
import { createMyPageState } from "./state.js";
import { fetchMe } from "./api.js";
import { initTabsSection } from "./tabs.js";

export async function renderMyPage(view) {
  if (!view) return;

  // 1) 기본 UI 마운트
  view.innerHTML = template();

  // 2) 상태 생성(마지막 탭 복원 옵션 사용 가능)
  // const state = createMyPageState({ rememberLastTab: true });
  const state = createMyPageState();

  // 3) 내 정보 로딩(필수)
  try {
    state.me = await fetchMe();
  } catch {
    renderFatal(view, "내 정보 조회에 실패했습니다");
    return;
  }

  // 4) 탭 UI 초기화 및 첫 렌더링 수행
  initTabsSection(state);

  // state.renderActiveTab 주입 여부 확인
  if (typeof state.renderActiveTab === "function") {
    await state.renderActiveTab();
    return;
  }

  renderFatal(view, "탭 초기화에 실패했습니다");
}

/*
  치명 오류 화면 렌더링
*/
function renderFatal(view, message) {
  view.innerHTML = `
    <div class="mypage-wrap">
      <h2 class="mypage-title">마이페이지</h2>
      <div class="card">
        <div class="empty">${escapeHtml(message || "오류가 발생했습니다")}</div>
      </div>
    </div>
  `;
}

/*
  최소 HTML 이스케이프 처리
*/
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
