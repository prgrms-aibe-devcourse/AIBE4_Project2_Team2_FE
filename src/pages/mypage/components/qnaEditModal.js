// src/pages/mypage/components/qnaEditModal.js
import { escapeHtml, escapeAttr } from "../utils/dom.js";
import {
  startOverlayLoading,
  endOverlayLoading,
  showOverlayCheck,
} from "../../../utils/overlay.js";
import { updateQuestion } from "../api.js";

let bound = false;

export function ensureQnaEditModal() {
  // SPA에서 DOM이 제거될 수 있으니 mounted 플래그가 아니라 "실제 DOM 존재"로 판단한다
  const existing = document.getElementById("qnaEditModal");
  if (existing) {
    bindOnce();
    return;
  }

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

  el.addEventListener("click", (e) => {
    const act = e.target?.getAttribute?.("data-action");
    if (act === "close") closeQnaEditModal();
  });

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

  body.innerHTML = renderForm({ questionId, content });

  modal.classList.add("is-open");
  document.body.classList.add("mm-modal-open");
  body.scrollTop = 0;

  updateCount(body);
  clearError(body);
}

export function closeQnaEditModal() {
  const modal = document.getElementById("qnaEditModal");
  const body = document.getElementById("qnaEditBody");
  if (!modal) return;

  modal.classList.remove("is-open");
  document.body.classList.remove("mm-modal-open");
  if (body) body.scrollTop = 0;
}

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
              placeholder="질문 내용을 입력한다"
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

function bindOnce() {
  if (bound) return;
  bound = true;

  document.addEventListener("click", (e) => {
    const modal = document.getElementById("qnaEditModal");
    if (!modal || !modal.classList.contains("is-open")) return;

    const closeBtn = e.target.closest?.('[data-action="close"]');
    if (closeBtn) {
      e.preventDefault();
      closeQnaEditModal();
    }
  });

  document.addEventListener("input", (e) => {
    const modal = document.getElementById("qnaEditModal");
    if (!modal || !modal.classList.contains("is-open")) return;

    if (e.target?.id === "mmQnaContent") {
      const body = document.getElementById("qnaEditBody");
      updateCount(body);
      clearError(body);
    }
  });

  document.addEventListener("submit", async (e) => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.id !== "mmQnaEditForm") return;

    e.preventDefault();

    const body = document.getElementById("qnaEditBody");
    if (!body) return;

    const qid = String(form.getAttribute("data-question-id") || "").trim();
    const content = String(body.querySelector("#mmQnaContent")?.value ?? "").trim();

    if (!validate(content, body)) return;

    try {
      startOverlayLoading();

      const res = await updateQuestion(qid, { content });
      if (!res?.success) {
        applyError(res, body);
        return;
      }

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

function validate(content, root) {
  if (!content) {
    setError("내용은 필수다", root);
    return false;
  }
  if (content.length > 3000) {
    setError("내용은 3000자 이하여야 한다", root);
    return false;
  }
  return true;
}

function applyError(errOrRes, root) {
  const msg =
    String(errOrRes?.message ?? errOrRes?.error?.message ?? errOrRes ?? "")
      .replace(/\s+/g, " ")
      .trim() || "요청에 실패했다";
  setError(msg, root);
}

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

function updateCount(root) {
  if (!root) return;
  const ta = root.querySelector("#mmQnaContent");
  const countEl = root.querySelector("#mmQnaCount");
  if (!ta || !countEl) return;
  countEl.textContent = String(String(ta.value ?? "").length);
}
