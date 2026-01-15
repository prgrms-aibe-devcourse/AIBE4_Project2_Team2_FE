// src/pages/mypage/components/reviewCreateModal.js
/*
  후기 작성 모달 구성 요소
  - 모달 DOM 1회 마운트 처리
  - 별점/내용 입력 UI 렌더링 처리
  - 이벤트 바인딩 1회 처리
  - 생성 API 호출 및 이벤트 브로드캐스트 처리
*/

import { escapeAttr } from "../utils/dom.js";
import {
  startOverlayLoading,
  endOverlayLoading,
  showOverlayCheck,
} from "../../../utils/overlay.js";
import { api } from "../../../services/api.js";

let mounted = false;
let bound = false;

export function ensureReviewCreateModal() {
  if (mounted) return;
  mounted = true;

  const el = document.createElement("div");
  el.id = "reviewCreateModal";
  el.className = "mm-modal";
  el.innerHTML = `
    <div class="mm-modal__backdrop" data-action="close"></div>
    <div class="mm-modal__panel" role="dialog" aria-modal="true" aria-label="후기 작성">
      <button class="mm-modal__close mm-modal__close--floating" type="button" data-action="close" aria-label="닫기">×</button>
      <div class="mm-modal__body" id="reviewCreateBody"></div>
    </div>
  `;
  document.body.appendChild(el);

  el.addEventListener("click", (e) => {
    const act = e.target?.getAttribute?.("data-action");
    if (act === "close") closeReviewCreateModal();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeReviewCreateModal();
  });

  bindFormOnce();
}

export function openReviewCreateModal({ interviewId } = {}) {
  ensureReviewCreateModal();

  const modal = document.getElementById("reviewCreateModal");
  const body = document.getElementById("reviewCreateBody");
  if (!modal || !body) return;

  const safeInterviewId = String(interviewId ?? "").trim();
  if (!safeInterviewId) return;

  body.innerHTML = renderCreateForm({ interviewId: safeInterviewId });

  resetBodyScroll(body);

  const nextRating = clampInt(
    Number(body.querySelector("#mmCreateRating")?.value),
    0,
    5
  );
  updateStarUI(nextRating, body);
  updateCount(body);
  clearError("mmCreateRatingErr", body);
  clearError("mmCreateContentErr", body);

  modal.classList.add("is-open");
  document.body.classList.add("mm-modal-open");
}

export function closeReviewCreateModal() {
  const modal = document.getElementById("reviewCreateModal");
  const body = document.getElementById("reviewCreateBody");
  if (!modal) return;

  modal.classList.remove("is-open");
  document.body.classList.remove("mm-modal-open");

  if (body) resetBodyScroll(body);
}

/*
  작성 폼 HTML 생성 처리
*/
function renderCreateForm({ interviewId }) {
  return `
    <div class="mm-modal__stack mm-review-edit-stack">
      <form id="mmReviewCreateForm" class="mm-review-edit mm-review-edit--vertical"
        data-interview-id="${escapeAttr(interviewId)}"
      >
        <input type="hidden" name="rating" id="mmCreateRating" value="0" />

        <div class="mm-edit-top">
          <div class="mm-star-picker mm-star-picker--top" role="radiogroup" aria-label="평점 선택">
            ${[1, 2, 3, 4, 5]
              .map(
                (n) => `
              <button type="button"
                class="mm-star-btn"
                data-star="${n}"
                aria-label="${n}점"
                aria-pressed="false"
              >★</button>
            `
              )
              .join("")}
          </div>
          <div class="mm-field-error" id="mmCreateRatingErr" aria-live="polite"></div>
        </div>

        <div class="mm-edit-body">
          <div class="mm-textarea-wrap">
            <textarea class="mm-textarea mm-textarea--fixed" id="mmCreateContent" name="content" rows="10"
              placeholder="후기 내용을 입력합니다"
              maxlength="1000"
            ></textarea>

            <div class="mm-textarea-meta">
              <span id="mmCreateCount">0</span><span>/1000</span>
            </div>
          </div>
          <div class="mm-field-error" id="mmCreateContentErr" aria-live="polite"></div>
        </div>

        <div class="mm-actions mm-actions--sticky">
          <button type="button" class="mypage-mini-btn" data-action="close">취소</button>
          <button type="submit" class="mypage-save-btn mm-save-btn">저장</button>
        </div>
      </form>
    </div>
  `;
}

/*
  이벤트 바인딩 1회 처리
*/
function bindFormOnce() {
  if (bound) return;
  bound = true;

  document.addEventListener("click", (e) => {
    const modal = document.getElementById("reviewCreateModal");
    if (!modal || !modal.classList.contains("is-open")) return;

    const body = document.getElementById("reviewCreateBody");
    if (!body) return;

    const closeBtn = e.target.closest?.('[data-action="close"]');
    if (closeBtn) {
      e.preventDefault();
      closeReviewCreateModal();
      return;
    }

    const starBtn = e.target.closest?.(".mm-star-btn");
    if (starBtn) {
      e.preventDefault();

      const n = Number(starBtn.getAttribute("data-star"));
      if (!Number.isFinite(n)) return;

      const ratingEl = body.querySelector("#mmCreateRating");
      if (!ratingEl) return;

      const next = clampInt(n, 1, 5);
      ratingEl.value = String(next);

      updateStarUI(next, body);
      clearError("mmCreateRatingErr", body);
    }
  });

  document.addEventListener("input", (e) => {
    const modal = document.getElementById("reviewCreateModal");
    if (!modal || !modal.classList.contains("is-open")) return;

    const body = document.getElementById("reviewCreateBody");
    if (!body) return;

    if (e.target?.id === "mmCreateContent") {
      updateCount(body);
      clearError("mmCreateContentErr", body);
    }
  });

  document.addEventListener("submit", async (e) => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.id !== "mmReviewCreateForm") return;

    e.preventDefault();

    const body = document.getElementById("reviewCreateBody");
    if (!body) return;

    const interviewId = String(form.getAttribute("data-interview-id") || "").trim();
    if (!interviewId) return;

    const rating = clampInt(
      Number(body.querySelector("#mmCreateRating")?.value),
      0,
      5
    );
    const content = String(body.querySelector("#mmCreateContent")?.value ?? "").trim();

    const ok = validate({ rating, content }, body);
    if (!ok) return;

    try {
      startOverlayLoading();

      const res = await api.post(
        `/interviews/${encodeURIComponent(interviewId)}/reviews`,
        { rating, content }
      );

      if (!res?.success) {
        applyServerError(res, body);
        return;
      }

      closeReviewCreateModal();

      window.dispatchEvent(
        new CustomEvent("mm:review-created", {
          detail: { interviewId, data: res.data },
        })
      );
      window.dispatchEvent(new CustomEvent("mm:review-updated"));
    } catch (err) {
      applyServerError(err, body);
    } finally {
      endOverlayLoading();
      showOverlayCheck({ durationMs: 1000 });
    }
  });
}

/*
  클라이언트 입력 검증 처리
*/
function validate({ rating, content }, root) {
  let ok = true;

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    setError("mmCreateRatingErr", "평점은 1~5 사이여야 합니다", root);
    ok = false;
  }

  if (!content) {
    setError("mmCreateContentErr", "후기 내용은 필수입니다", root);
    ok = false;
  } else if (content.length > 1000) {
    setError("mmCreateContentErr", "후기 내용은 1000자 이하여야 합니다", root);
    ok = false;
  }

  return ok;
}

/*
  서버 오류 메시지 반영 처리
*/
function applyServerError(errOrRes, root) {
  const msg =
    String(errOrRes?.message ?? errOrRes?.error?.message ?? errOrRes ?? "")
      .replace(/\s+/g, " ")
      .trim() || "요청에 실패했습니다";

  setError("mmCreateContentErr", msg, root);
}

/*
  별점 UI 업데이트 처리
*/
function updateStarUI(rating, root) {
  const btns = Array.from(root.querySelectorAll(".mm-star-btn"));
  for (const b of btns) {
    const n = Number(b.getAttribute("data-star"));
    const on = Number.isFinite(n) && n <= rating;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", n === rating ? "true" : "false");
  }
}

/*
  글자수 카운트 업데이트 처리
*/
function updateCount(root) {
  const ta = root.querySelector("#mmCreateContent");
  const countEl = root.querySelector("#mmCreateCount");
  if (!ta || !countEl) return;
  countEl.textContent = String(String(ta.value ?? "").length);
}

/*
  에러 메시지 설정/해제 처리
*/
function setError(id, text, root) {
  const el = root?.querySelector?.(`#${id}`);
  if (!el) return;
  el.textContent = String(text || "");
}

function clearError(id, root) {
  const el = root?.querySelector?.(`#${id}`);
  if (!el) return;
  el.textContent = "";
}

/*
  정수 범위 클램프 처리
*/
function clampInt(v, min, max) {
  const n = Math.trunc(Number(v));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/*
  모달 바디 스크롤 최상단 초기화 처리
*/
function resetBodyScroll(body) {
  if (!body) return;
  body.scrollTop = 0;
  body.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
  requestAnimationFrame(() => {
    body.scrollTop = 0;
    body.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
  });
}
