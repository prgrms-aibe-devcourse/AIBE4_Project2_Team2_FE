// src/pages/mypage/components/appliedInterviewDetailModal.js
import { escapeHtml, escapeAttr } from "../utils/dom.js";

let mounted = false;

export function openAppliedInterviewDetailModal(data) {
  ensureModal();

  const modal = document.getElementById("appliedInterviewDetailModal");
  const body = document.getElementById("appliedInterviewDetailBody");
  if (!modal || !body) return;

  body.innerHTML = renderDetail(data);

  body.scrollTop = 0;
  body.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
  requestAnimationFrame(() => {
    body.scrollTop = 0;
    body.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
  });

  modal.classList.add("is-open");
  document.body.classList.add("mm-modal-open");
}

export function closeAppliedInterviewDetailModal() {
  const modal = document.getElementById("appliedInterviewDetailModal");
  if (!modal) return;

  modal.classList.remove("is-open");
  document.body.classList.remove("mm-modal-open");
}

function ensureModal() {
  if (mounted) return;
  mounted = true;

  if (document.getElementById("appliedInterviewDetailModal")) return;

  const el = document.createElement("div");
  el.id = "appliedInterviewDetailModal";
  el.className = "mm-modal";
  el.innerHTML = `
    <div class="mm-modal__backdrop" data-action="close"></div>
    <div class="mm-modal__panel" role="dialog" aria-modal="true" aria-label="인터뷰 신청 상세">
      <button class="mm-modal__close mm-modal__close--floating" type="button" data-action="close" aria-label="닫기">×</button>
      <div class="mm-modal__body" id="appliedInterviewDetailBody"></div>
    </div>
  `;
  document.body.appendChild(el);

  el.addEventListener("click", (e) => {
    const act = e.target?.getAttribute?.("data-action");
    if (act === "close") closeAppliedInterviewDetailModal();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAppliedInterviewDetailModal();
  });
}

function renderDetail(item) {
  const major = item?.peer || {};
  const interview = item?.interview || {};

  const profileImageUrl = String(major?.profileImageUrl || "").trim();
  const nick = safeText(major?.nickname, "-");
  const uniMajor = `${safeText(major?.university, "")}${
    major?.university && major?.major ? " / " : ""
  }${safeText(major?.major, "")}`.trim();

  const statusRaw = String(item?.status || "").trim();
  const statusUpper = statusRaw.toUpperCase();
  const badgeTone = statusTone(statusUpper);

  const createdAt = formatDateTime(item?.createdAt) || "-";
  const updatedAt = formatDateTime(item?.updatedAt) || "-";
  const responded = hasMeaningfulUpdate(item?.createdAt, item?.updatedAt);

  const endLabel = statusUpper === "COMPLETED" ? "완료일" : "응답일";

  const dateLine = responded
    ? `<span class="mm-date-label">신청일</span> ${escapeHtml(
        createdAt
      )} · <span class="mm-date-label">${endLabel}</span> ${escapeHtml(
        updatedAt
      )}`
    : `<span class="mm-date-label">신청일</span> ${escapeHtml(createdAt)}`;

  const dateTitle = responded
    ? `신청일 ${createdAt} · ${endLabel} ${updatedAt}`
    : `신청일 ${createdAt}`;

  const title = safeText(interview?.title, "-");
  const content = safeText(interview?.content, "-");
  const method = safeText(interview?.interviewMethod, "-");
  const preferredDatetime = formatDateTime(interview?.preferredDatetime) || "-";
  const extraDescription = safeText(interview?.extraDescription, "-");

  const majorMessage = safeText(item?.majorMessage, "-");

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
                ? `<div class="mm-badge" data-tone="${escapeAttr(
                    badgeTone
                  )}">${escapeHtml(statusRaw)}</div>`
                : ""
            }
          </div>

          <div class="mm-hero2__dates mm-hero2__dates--inline" title="${escapeAttr(
            dateTitle
          )}">
            ${dateLine}
          </div>
        </div>

        <div class="mm-hero2__message">
          <div class="mm-hero2__message-k">전공자 메시지</div>
          <div class="mm-hero2__message-v mm-pre">${escapeHtml(
            majorMessage
          )}</div>
        </div>
      </div>

      <div class="mm-card">
        <div class="mm-card__title">인터뷰 신청 정보</div>

        <div class="mm-kv2">
          <div class="mm-kv2__row">
            <div class="mm-kv2__k">제목</div>
            <div class="mm-kv2__v">${escapeHtml(title)}</div>
          </div>

          <div class="mm-kv2__row">
            <div class="mm-kv2__k">내용</div>
            <div class="mm-kv2__v mm-pre">${escapeHtml(content)}</div>
          </div>

          <div class="mm-kv2__row">
            <div class="mm-kv2__k">진행 방식</div>
            <div class="mm-kv2__v">${escapeHtml(method)}</div>
          </div>

          <div class="mm-kv2__row">
            <div class="mm-kv2__k">희망 일시</div>
            <div class="mm-kv2__v">${escapeHtml(preferredDatetime)}</div>
          </div>

          <div class="mm-kv2__row">
            <div class="mm-kv2__k">추가 설명</div>
            <div class="mm-kv2__v mm-pre">${escapeHtml(extraDescription)}</div>
          </div>
        </div>
      </div>

    </div>
  `;
}

function statusTone(statusUpper) {
  const s = String(statusUpper || "")
    .trim()
    .toUpperCase();
  if (s === "ACCEPTED") return "accepted";
  if (s === "REJECT" || s === "REJECTED") return "rejected";
  if (s === "PENDING") return "pending";
  if (s === "COMPLETED") return "dark";
  return "soft";
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
