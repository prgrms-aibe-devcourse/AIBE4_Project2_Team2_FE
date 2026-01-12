// src/pages/mypage/components/reviewEditModal.js
import { escapeHtml, escapeAttr } from "../utils/dom.js";
import {
  startOverlayLoading,
  endOverlayLoading,
  showOverlayCheck,
} from "../../../utils/overlay.js";
import { api } from "../../../services/api.js";

let mounted = false;
let bound = false;

export function ensureReviewEditModal() {
  if (mounted) return;
  mounted = true;

  const el = document.createElement("div");
  el.id = "reviewEditModal";
  el.className = "mm-modal";
  el.innerHTML = `
    <div class="mm-modal__backdrop" data-action="close"></div>
    <div class="mm-modal__panel" role="dialog" aria-modal="true" aria-label="후기 수정">
      <button class="mm-modal__close mm-modal__close--floating" type="button" data-action="close" aria-label="닫기">×</button>
      <div class="mm-modal__body" id="reviewEditBody"></div>
    </div>
  `;
  document.body.appendChild(el);

  el.addEventListener("click", (e) => {
    const act = e.target?.getAttribute?.("data-action");
    if (act === "close") closeReviewEditModal();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeReviewEditModal();
  });

  bindFormOnce();
}

export function openReviewEditModal({
  reviewId,
  interviewId,
  rating = 0,
  content = "",
} = {}) {
  ensureReviewEditModal();

  const modal = document.getElementById("reviewEditModal");
  const body = document.getElementById("reviewEditBody");
  if (!modal || !body) return;

  body.innerHTML = renderEditForm({ reviewId, interviewId, rating, content });

  modal.classList.add("is-open");
  document.body.classList.add("mm-modal-open");

  body.scrollTop = 0;

  const nextRating = clampInt(
    Number(body.querySelector("#mmEditRating")?.value),
    0,
    5
  );
  updateStarUI(nextRating, body);
  updateCount(body);
  clearError("mmEditRatingErr", body);
  clearError("mmEditContentErr", body);
}

export function closeReviewEditModal() {
  const modal = document.getElementById("reviewEditModal");
  const body = document.getElementById("reviewEditBody");
  if (!modal) return;

  modal.classList.remove("is-open");
  document.body.classList.remove("mm-modal-open");

  if (body) body.scrollTop = 0;
}

function renderEditForm({ reviewId, interviewId, rating, content }) {
  const safeReviewId = String(reviewId ?? "").trim();
  const safeInterviewId = String(interviewId ?? "").trim();
  const r = clampInt(rating, 0, 5);

  return `
    <div class="mm-modal__stack mm-review-edit-stack">
      <form id="mmReviewEditForm" class="mm-review-edit mm-review-edit--vertical"
        data-review-id="${escapeAttr(safeReviewId)}"
        data-interview-id="${escapeAttr(safeInterviewId)}"
      >
        <input type="hidden" name="rating" id="mmEditRating" value="${escapeAttr(
          r
        )}" />

        <div class="mm-edit-top">
          <div class="mm-star-picker mm-star-picker--top" role="radiogroup" aria-label="평점 선택">
            ${[1, 2, 3, 4, 5]
              .map(
                (n) => `
              <button type="button"
                class="mm-star-btn ${n <= r ? "is-on" : ""}"
                data-star="${n}"
                aria-label="${n}점"
                aria-pressed="${n === r ? "true" : "false"}"
              >★</button>
            `
              )
              .join("")}
          </div>
          <div class="mm-field-error" id="mmEditRatingErr" aria-live="polite"></div>
        </div>

        <div class="mm-edit-body">
          <div class="mm-textarea-wrap">
            <textarea class="mm-textarea mm-textarea--fixed" id="mmEditContent" name="content" rows="10"
              placeholder="후기 내용을 입력한다"
              maxlength="1000"
            >${escapeHtml(String(content ?? ""))}</textarea>

            <div class="mm-textarea-meta">
              <span id="mmEditCount">0</span><span>/1000</span>
            </div>
          </div>
          <div class="mm-field-error" id="mmEditContentErr" aria-live="polite"></div>
        </div>

        <div class="mm-actions mm-actions--sticky">
          <button type="button" class="mypage-mini-btn" data-action="close">취소</button>
          <button type="submit" class="mypage-save-btn mm-save-btn">저장</button>
        </div>
      </form>
    </div>
  `;
}

function bindFormOnce() {
  if (bound) return;
  bound = true;

  document.addEventListener("click", (e) => {
    const modal = document.getElementById("reviewEditModal");
    if (!modal || !modal.classList.contains("is-open")) return;

    const body = document.getElementById("reviewEditBody");
    if (!body) return;

    const closeBtn = e.target.closest?.('[data-action="close"]');
    if (closeBtn) {
      e.preventDefault();
      closeReviewEditModal();
      return;
    }

    const starBtn = e.target.closest?.(".mm-star-btn");
    if (starBtn) {
      e.preventDefault();

      const n = Number(starBtn.getAttribute("data-star"));
      if (!Number.isFinite(n)) return;

      const ratingEl = body.querySelector("#mmEditRating");
      if (!ratingEl) return;

      const next = clampInt(n, 1, 5);
      ratingEl.value = String(next);

      updateStarUI(next, body);
      clearError("mmEditRatingErr", body);
      return;
    }
  });

  document.addEventListener("input", (e) => {
    const modal = document.getElementById("reviewEditModal");
    if (!modal || !modal.classList.contains("is-open")) return;

    const body = document.getElementById("reviewEditBody");
    if (!body) return;

    if (e.target?.id === "mmEditContent") {
      updateCount(body);
      clearError("mmEditContentErr", body);
    }
  });

  document.addEventListener("submit", async (e) => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.id !== "mmReviewEditForm") return;

    e.preventDefault();

    const body = document.getElementById("reviewEditBody");
    if (!body) return;

    const reviewId = String(form.getAttribute("data-review-id") || "").trim();
    const interviewId = String(
      form.getAttribute("data-interview-id") || ""
    ).trim();

    const rating = clampInt(
      Number(body.querySelector("#mmEditRating")?.value),
      0,
      5
    );
    const content = String(
      body.querySelector("#mmEditContent")?.value ?? ""
    ).trim();

    const ok = validate({ rating, content }, body);
    if (!ok) return;

    try {
      startOverlayLoading();

      const res = await api.patch(
        `/interviews/${encodeURIComponent(interviewId)}/reviews`,
        { rating, content }
      );

      if (!res?.success) {
        endOverlayLoading();
        applyServerError(res, body);
        return;
      }

      closeReviewEditModal();

      window.dispatchEvent(
        new CustomEvent("mm:review-updated", {
          detail: { reviewId, interviewId, data: res.data },
        })
      );
    } catch (err) {
      endOverlayLoading();
      applyServerError(err, body);
    } finally {
      endOverlayLoading();
      showOverlayCheck({ durationMs: 1000 });
    }
  });
}

function validate({ rating, content }, root) {
  let ok = true;

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    setError("mmEditRatingErr", "평점은 1~5 사이여야 한다", root);
    ok = false;
  }

  if (!content) {
    setError("mmEditContentErr", "후기 내용은 필수다", root);
    ok = false;
  } else if (content.length > 1000) {
    setError("mmEditContentErr", "후기 내용은 1000자 이하여야 한다", root);
    ok = false;
  }

  return ok;
}

function applyServerError(errOrRes, root) {
  const msg =
    String(errOrRes?.message ?? errOrRes?.error?.message ?? errOrRes ?? "")
      .replace(/\s+/g, " ")
      .trim() || "요청에 실패했다";

  setError("mmEditContentErr", msg, root);
}

function updateStarUI(rating, root) {
  const btns = Array.from(root.querySelectorAll(".mm-star-btn"));
  for (const b of btns) {
    const n = Number(b.getAttribute("data-star"));
    const on = Number.isFinite(n) && n <= rating;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", n === rating ? "true" : "false");
  }
}

function updateCount(root) {
  const ta = root.querySelector("#mmEditContent");
  const countEl = root.querySelector("#mmEditCount");
  if (!ta || !countEl) return;
  countEl.textContent = String(String(ta.value ?? "").length);
}

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

function clampInt(v, min, max) {
  const n = Math.trunc(Number(v));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}
