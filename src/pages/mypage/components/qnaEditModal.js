// src/pages/mypage/components/qnaEditModal.js
/*
  질문 수정 모달 구성 요소
  - 모달 DOM 존재 여부 기반 초기화 처리
  - 이벤트 바인딩 1회 처리
  - 내용 입력 검증 및 수정 API 호출 처리
  - 수정 완료 이벤트 브로드캐스트 처리
*/

import { escapeHtml, escapeAttr } from "../utils/dom.js";
import {
  startOverlayLoading,
  endOverlayLoading,
  showOverlayCheck,
} from "../../../utils/overlay.js";
import { updateQuestion } from "../api.js";

let bound = false;

export function ensureQnaEditModal() {
  /* SPA 환경에서 DOM이 제거될 수 있으므로 DOM 존재 여부로 판단 처리 */
  const existing = document.getElementById("qnaEditModal");
  if (existing) {
    bindOnce();
    return;
  }

  /* 모달 DOM 마운트 처리 */
  const el = document.createElement("div");
  el.id = "qnaEditModal";
  el.className = "mm-modal";
  el.innerHTML = `
    <div class="mm-modal__backdrop" data-action="close"></div>
    <div class="mm-modal__panel" role="dialog" aria-modal="true" aria-label="질문 수정">
      <button class="mm-modal__close mm-modal__close--floating" type="button" data-action="close" aria-label="닫기">×</button>
      <div class="mm-modal__body" id="qnaEditBody"></div>
    </div>
  `;
  document.body.appendChild(el);

  /* 배경 클릭 닫기 처리 */
  el.addEventListener("click", (e) => {
    const act = e.target?.getAttribute?.("data-action");
    if (act === "close") closeQnaEditModal();
  });

  /* ESC 닫기 처리 */
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeQnaEditModal();
  });

  bindOnce();
}

export function openQnaEditModal({ questionId, content = "" } = {}) {
  ensureQnaEditModal();

  const modal = document.getElementById("qnaEditModal");
  const body = document.getElementById("qnaEditBody");
  if (!modal || !body) return;

  /* 폼 렌더링 처리 */
  body.innerHTML = renderForm({ questionId, content });

  /* 모달 오픈 처리 */
  modal.classList.add("is-open");
  document.body.classList.add("mm-modal-open");

  /* 스크롤 및 상태 초기화 처리 */
  resetBodyScroll(body);
  updateCount(body);
  clearError(body);
}

export function closeQnaEditModal() {
  const modal = document.getElementById("qnaEditModal");
  const body = document.getElementById("qnaEditBody");
  if (!modal) return;

  /* 모달 클로즈 처리 */
  modal.classList.remove("is-open");
  document.body.classList.remove("mm-modal-open");

  if (body) resetBodyScroll(body);
}

/* 폼 HTML 생성 처리 */
function renderForm({ questionId, content }) {
  const qid = String(questionId ?? "").trim();
  const c = String(content ?? "");

  return `
    <div class="mm-modal__stack mm-review-edit-stack">
      <form id="mmQnaEditForm" class="mm-review-edit mm-review-edit--vertical"
        data-question-id="${escapeAttr(qid)}"
      >
        <div class="mm-edit-body">
          <div class="mm-textarea-wrap">
            <textarea class="mm-textarea mm-textarea--fixed" id="mmQnaContent" rows="10"
              placeholder="질문 내용을 입력합니다"
              maxlength="3000"
            >${escapeHtml(c)}</textarea>

            <div class="mm-textarea-meta">
              <span id="mmQnaCount">0</span><span>/3000</span>
            </div>
          </div>
          <div class="mm-field-error" id="mmQnaErr" aria-live="polite"></div>
        </div>

        <div class="mm-actions mm-actions--sticky">
          <button type="button" class="mypage-mini-btn" data-action="close">취소</button>
          <button type="submit" class="mypage-save-btn mm-save-btn">저장</button>
        </div>
      </form>
    </div>
  `;
}

/* 이벤트 바인딩 1회 처리 */
function bindOnce() {
  if (bound) return;
  bound = true;

  /* 닫기 버튼 클릭 처리 */
  document.addEventListener("click", (e) => {
    const modal = document.getElementById("qnaEditModal");
    if (!modal || !modal.classList.contains("is-open")) return;

    const closeBtn = e.target.closest?.('[data-action="close"]');
    if (closeBtn) {
      e.preventDefault();
      closeQnaEditModal();
    }
  });

  /* 입력 변화 처리 */
  document.addEventListener("input", (e) => {
    const modal = document.getElementById("qnaEditModal");
    if (!modal || !modal.classList.contains("is-open")) return;

    if (e.target?.id === "mmQnaContent") {
      const body = document.getElementById("qnaEditBody");
      updateCount(body);
      clearError(body);
    }
  });

  /* 제출 처리 */
  document.addEventListener("submit", async (e) => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.id !== "mmQnaEditForm") return;

    e.preventDefault();

    const body = document.getElementById("qnaEditBody");
    if (!body) return;

    const qid = String(form.getAttribute("data-question-id") || "").trim();
    const content = String(
      body.querySelector("#mmQnaContent")?.value ?? ""
    ).trim();

    if (!validate(content, body)) return;

    try {
      startOverlayLoading();

      const res = await updateQuestion(qid, { content });

      /* updateQuestion은 data만 반환하므로 success 플래그 확인 대신 예외 기반 처리 */
      closeQnaEditModal();
      window.dispatchEvent(new CustomEvent("mm:question-updated"));
    } catch (err) {
      applyError(err, body);
    } finally {
      endOverlayLoading();
      showOverlayCheck({ durationMs: 900 });
    }
  });
}

/* 입력값 검증 처리 */
function validate(content, root) {
  if (!content) {
    setError("내용은 필수입니다", root);
    return false;
  }
  if (content.length > 3000) {
    setError("내용은 3000자 이하여야 합니다", root);
    return false;
  }
  return true;
}

/* 오류 메시지 반영 처리 */
function applyError(errOrRes, root) {
  const msg =
    String(errOrRes?.message ?? errOrRes?.error?.message ?? errOrRes ?? "")
      .replace(/\s+/g, " ")
      .trim() || "요청에 실패했습니다";
  setError(msg, root);
}

/* 오류 메시지 설정/해제 처리 */
function setError(text, root) {
  const el = root?.querySelector?.("#mmQnaErr");
  if (!el) return;
  el.textContent = String(text || "");
}

function clearError(root) {
  const el = root?.querySelector?.("#mmQnaErr");
  if (!el) return;
  el.textContent = "";
}

/* 글자수 카운트 업데이트 처리 */
function updateCount(root) {
  if (!root) return;
  const ta = root.querySelector("#mmQnaContent");
  const countEl = root.querySelector("#mmQnaCount");
  if (!ta || !countEl) return;
  countEl.textContent = String(String(ta.value ?? "").length);
}

/* 모달 바디 스크롤 최상단 초기화 처리 */
function resetBodyScroll(body) {
  if (!body) return;
  body.scrollTop = 0;
  body.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
  requestAnimationFrame(() => {
    body.scrollTop = 0;
    body.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
  });
}
