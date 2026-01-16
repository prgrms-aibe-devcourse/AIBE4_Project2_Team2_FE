// src/pages/mypage/components/reviewDetailModal.js
/*
  후기 상세 모달 구성 요소
  - 모달 DOM 1회 마운트 처리
  - 상세 데이터 렌더링 처리
  - 열기/닫기 및 스크롤 초기화 처리
*/

import { escapeHtml, escapeAttr } from "../utils/dom.js";
import { renderStars } from "../utils/format.js";

let mounted = false;

export function ensureReviewDetailModal() {
  if (document.getElementById("reviewDetailModal")) return;
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
  const content = safeText(review?.content, "-");

  const statusRaw = String(interview?.status || "").trim();

  const createdAt = formatDateTime(item?.createdAt) || "-";
  const updatedAt = formatDateTime(item?.updatedAt) || "-";
  const edited = hasMeaningfulUpdate(item?.createdAt, item?.updatedAt);

  const dateLine = edited
    ? `<span class="mm-date-label">작성일</span> ${escapeHtml(
        createdAt
      )} · <span class="mm-date-label">수정일</span> ${escapeHtml(updatedAt)}`
    : `<span class="mm-date-label">작성일</span> ${escapeHtml(createdAt)}`;

  const dateTitle = edited
    ? `작성일 ${createdAt} · 수정일 ${updatedAt}`
    : `작성일 ${createdAt}`;

  const title = safeText(interview?.title, "-");
  const interviewContent = safeText(interview?.content, "-");
  const method = safeText(interview?.interviewMethod, "-");
  const preferredDatetime = formatDateTime(interview?.preferredDatetime) || "-";
  const extraDescription = safeText(interview?.extraDescription, "-");
  const majorMessage = safeText(interview?.majorMessage, "-");

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
              statusRaw
                ? `<div class="mm-badge" data-tone="dark">${escapeHtml(
                    statusRaw
                  )}</div>`
                : ""
            }
          </div>

          <div class="mm-hero2__dates mm-hero2__dates--inline" title="${escapeAttr(
            dateTitle
          )}">
            ${dateLine}
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
              <div class="mm-kv2__v">${escapeHtml(title)}</div>
            </div>

            <div class="mm-kv2__row">
              <div class="mm-kv2__k">내용</div>
              <div class="mm-kv2__v mm-pre">${escapeHtml(
                interviewContent
              )}</div>
            </div>

            <div class="mm-kv2__row">
              <div class="mm-kv2__k">진행 방식</div>
              <div class="mm-kv2__v">${escapeHtml(method)}</div>
            </div>

            <div class="mm-kv2__row">
              <div class="mm-kv2__k">희망 일시</div>
              <div class="mm-kv2__v">${escapeHtml(preferredDatetime)}</div>
            </div>

            ${
              interview?.extraDescription
                ? `
              <div class="mm-kv2__row">
                <div class="mm-kv2__k">추가 설명</div>
                <div class="mm-kv2__v mm-pre">${escapeHtml(
                  extraDescription
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
                  majorMessage
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
            dateTitle
          )}">
            ${dateLine}
          </div>
        </div>

        <div class="mm-review">
          <div class="mm-review__content mm-pre">${escapeHtml(content)}</div>

          <div class="mm-review__dates mm-review__dates--below" title="${escapeAttr(
            dateTitle
          )}">
            ${dateLine}
          </div>
        </div>
      </div>

    </div>
  `;
}

function safeText(v, fallback) {
  const s = String(v ?? "").trim();
  return s ? s : fallback ?? "";
}

function formatDateTime(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  if (s.length >= 16) return s.slice(0, 16).replace("T", " ");
  if (s.length >= 10) return s.slice(0, 10);
  return s;
}

function hasMeaningfulUpdate(createdAt, updatedAt) {
  const cKey = toComparableKey(createdAt);
  const uKey = toComparableKey(updatedAt);
  if (!uKey) return false;
  if (!cKey) return true;
  return uKey !== cKey;
}

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

function resetBodyScroll(body) {
  if (!body) return;
  body.scrollTop = 0;
  body.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
  requestAnimationFrame(() => {
    body.scrollTop = 0;
    body.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
  });
}
