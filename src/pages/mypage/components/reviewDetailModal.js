// src/pages/mypage/components/reviewDetailModal.js
/*
  후기 상세 모달 구성 요소
  - 모달 DOM 1회 마운트 처리
  - 상세 데이터 렌더링 처리
  - 열기/닫기 및 스크롤 초기화 처리
*/

import { escapeHtml, escapeAttr } from "../utils/dom.js";
import { renderStars, formatDateTime } from "../utils/format.js";

let mounted = false;

export function ensureReviewDetailModal() {
  if (mounted) return;
  mounted = true;

  const el = document.createElement("div");
  el.id = "reviewDetailModal";
  el.className = "mm-modal";
  el.innerHTML = `
    <div class="mm-modal__backdrop" data-action="close"></div>
    <div class="mm-modal__panel" role="dialog" aria-modal="true" aria-label="후기 상세">
      <button class="mm-modal__close mm-modal__close--floating" type="button" data-action="close" aria-label="닫기">×</button>
      <div class="mm-modal__body" id="reviewDetailBody"></div>
    </div>
  `;
  document.body.appendChild(el);

  el.addEventListener("click", (e) => {
    const act = e.target?.getAttribute?.("data-action");
    if (act === "close") closeReviewDetailModal();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeReviewDetailModal();
  });
}

export function openReviewDetailModal(detail) {
  ensureReviewDetailModal();

  const modal = document.getElementById("reviewDetailModal");
  const body = document.getElementById("reviewDetailBody");
  if (!modal || !body) return;

  body.innerHTML = renderDetail(detail);

  resetBodyScroll(body);

  modal.classList.add("is-open");
  document.body.classList.add("mm-modal-open");
}

export function closeReviewDetailModal() {
  const modal = document.getElementById("reviewDetailModal");
  const body = document.getElementById("reviewDetailBody");
  if (!modal) return;

  modal.classList.remove("is-open");
  document.body.classList.remove("mm-modal-open");

  if (body) resetBodyScroll(body);
}

/*
  상세 내용 HTML 생성 처리
*/
function renderDetail(item) {
  const peer = item?.peer || {};
  const review = item?.review || {};
  const interview = item?.interview || null;

  const profileImageUrl = String(peer?.profileImageUrl || "").trim();

  const nick = safeText(peer?.nickname, "-");
  const uniMajor = `${safeText(peer?.university, "")}${
    peer?.university && peer?.major ? " / " : ""
  }${safeText(peer?.major, "")}`.trim();

  const rating = Number(review?.rating || 0);
  const content = safeText(review?.content, "");

  const reviewCreatedAt = formatDateTime(item?.createdAt) || "-";
  const reviewUpdatedAt = formatDateTime(item?.updatedAt) || "-";
  const reviewEdited = hasMeaningfulUpdate(item?.createdAt, item?.updatedAt);

  const interviewCreatedAt = formatDateTime(interview?.createdAt) || "-";
  const interviewUpdatedAt = formatDateTime(interview?.updatedAt) || "-";
  const interviewStatus = String(interview?.status || "").trim();

  const interviewHasCompleted = Boolean(interview?.updatedAt);

  const reviewDateLine = reviewEdited
    ? `<span class="mm-date-label">작성일</span> ${escapeHtml(
        reviewCreatedAt
      )} · <span class="mm-date-label">수정일</span> ${escapeHtml(reviewUpdatedAt)}`
    : `<span class="mm-date-label">작성일</span> ${escapeHtml(reviewCreatedAt)}`;

  const interviewDateLine = interviewHasCompleted
    ? `<span class="mm-date-label">신청일</span> ${escapeHtml(
        interviewCreatedAt
      )} · <span class="mm-date-label">완료일</span> ${escapeHtml(interviewUpdatedAt)}`
    : `<span class="mm-date-label">신청일</span> ${escapeHtml(interviewCreatedAt)}`;

  const reviewDateTitle = reviewEdited
    ? `작성일 ${reviewCreatedAt} · 수정일 ${reviewUpdatedAt}`
    : `작성일 ${reviewCreatedAt}`;

  const interviewDateTitle = interviewHasCompleted
    ? `신청일 ${interviewCreatedAt} · 완료일 ${interviewUpdatedAt}`
    : `신청일 ${interviewCreatedAt}`;

  return `
    <div class="mm-modal__stack">

      <div class="mm-card mm-card--hero">
        <div class="mm-hero2">
          <div class="mm-hero2__avatar" style="${
            profileImageUrl
              ? `background-image:url('${escapeAttr(profileImageUrl)}')`
              : ""
          }"></div>

          <div class="mm-hero2__main">
            <div class="mm-hero2__line">
              <span class="mm-hero2__name">${escapeHtml(nick)}</span>
              <span class="mm-hero2__paren">(${escapeHtml(
                uniMajor || "-"
              )})</span>
            </div>
          </div>

          <div class="mm-hero2__badge">
            ${
              interviewStatus
                ? `<div class="mm-badge" data-tone="dark">${escapeHtml(
                    interviewStatus
                  )}</div>`
                : ""
            }
          </div>

          <div class="mm-hero2__dates mm-hero2__dates--inline" title="${escapeAttr(
            interviewDateTitle
          )}">
            ${interviewDateLine}
          </div>
        </div>
      </div>

      <div class="mm-card">
        <div class="mm-card__title">인터뷰 신청 정보</div>
        ${
          interview
            ? `
          <div class="mm-kv2">
            <div class="mm-kv2__row">
              <div class="mm-kv2__k">제목</div>
              <div class="mm-kv2__v">${escapeHtml(interview?.title || "-")}</div>
            </div>

            <div class="mm-kv2__row">
              <div class="mm-kv2__k">내용</div>
              <div class="mm-kv2__v mm-pre">${escapeHtml(
                interview?.content || "-"
              )}</div>
            </div>

            <div class="mm-kv2__row">
              <div class="mm-kv2__k">진행 방식</div>
              <div class="mm-kv2__v">${escapeHtml(
                interview?.interviewMethod || "-"
              )}</div>
            </div>

            <div class="mm-kv2__row">
              <div class="mm-kv2__k">희망 일시</div>
              <div class="mm-kv2__v">${escapeHtml(
                formatDateTime(interview?.preferredDatetime) || "-"
              )}</div>
            </div>

            ${
              interview?.extraDescription
                ? `
              <div class="mm-kv2__row">
                <div class="mm-kv2__k">추가 설명</div>
                <div class="mm-kv2__v mm-pre">${escapeHtml(
                  interview?.extraDescription
                )}</div>
              </div>
              `
                : ""
            }

            ${
              interview?.majorMessage
                ? `
              <div class="mm-kv2__row">
                <div class="mm-kv2__k">전공자 메시지</div>
                <div class="mm-kv2__v mm-pre">${escapeHtml(
                  interview?.majorMessage
                )}</div>
              </div>
              `
                : ""
            }
          </div>
          `
            : `<div class="mm-empty">상세에서만 제공되는 정보입니다</div>`
        }
      </div>

      <div class="mm-card">
        <div class="mm-card__head mm-card__head--review">
          <div class="mm-card__head-left">
            <div class="mm-card__title mm-card__title--inline">내 후기</div>
            <div class="mm-review__stars mm-review__stars--inline">${renderStars(
              rating
            )}</div>
          </div>

          <div class="mm-card__head-right mm-review__dates mm-review__dates--top" title="${escapeAttr(
            reviewDateTitle
          )}">
            ${reviewDateLine}
          </div>
        </div>

        <div class="mm-review">
          <div class="mm-review__content mm-pre">${escapeHtml(content || "-")}</div>

          <div class="mm-review__dates mm-review__dates--below" title="${escapeAttr(
            reviewDateTitle
          )}">
            ${reviewDateLine}
          </div>
        </div>
      </div>

    </div>
  `;
}

/*
  문자열 기본값 처리
*/
function safeText(v, fallback) {
  const s = String(v ?? "").trim();
  return s ? s : fallback ?? "";
}

/*
  createdAt/updatedAt 의미 있는 변경 판단 처리
*/
function hasMeaningfulUpdate(createdAt, updatedAt) {
  const cKey = toComparableKey(createdAt);
  const uKey = toComparableKey(updatedAt);
  if (!uKey) return false;
  if (!cKey) return true;
  return uKey !== cKey;
}

/*
  날짜 문자열 비교용 키 생성 처리
*/
function toComparableKey(dt) {
  const s = String(dt || "").trim();
  if (!s) return "";
  const m = s.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?/);
  if (!m) return s;
  const base = m[1];
  const fracRaw = m[2] || "";
  const frac = fracRaw.replace(/0+$/, "");
  return frac ? `${base}.${frac}` : base;
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
