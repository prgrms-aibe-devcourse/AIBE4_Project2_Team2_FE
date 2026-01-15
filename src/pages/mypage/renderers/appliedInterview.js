// src/pages/mypage/renderers/appliedInterview.js
/*
  신청한 인터뷰 아이템 렌더러
  - 신청한 인터뷰 목록 카드 HTML 생성 처리
  - peer(상대방) 및 interview(인터뷰 본문) 구조 기반 표시 처리
  - 상태 칩 톤 계산 및 날짜 표시 처리
  - data-action/data-interview-id로 상세 모달 트리거 처리
*/

import { escapeHtml, escapeAttr } from "../utils/dom.js";

export function renderAppliedInterviewItem(item) {
  const peer = item?.peer || {};
  const interview = item?.interview || {};

  const interviewId = String(
    item?.interviewId ?? interview?.interviewId ?? ""
  ).trim();

  const profileImageUrl = String(peer?.profileImageUrl || "").trim();

  const nick = safeText(peer?.nickname, "-");
  const uniMajor = `${safeText(peer?.university, "")}${
    peer?.university && peer?.major ? " / " : ""
  }${safeText(peer?.major, "")}`.trim();

  const title = safeText(interview?.title, "-");

  const statusRaw = safeText(item?.status, "-");
  const statusUpper = statusRaw.toUpperCase();
  const chipTone = statusTone(statusUpper);

  const createdAtRaw = item?.createdAt ?? "";
  const updatedAtRaw = item?.updatedAt ?? "";

  const createdDate = formatDateOnly(createdAtRaw);
  const updatedDate = formatDateOnly(updatedAtRaw);

  const responded = hasMeaningfulUpdate(createdAtRaw, updatedAtRaw);
  const endLabel = statusUpper === "COMPLETED" ? "완료일" : "응답일";

  const avatarStyle = profileImageUrl
    ? `background-image:url('${escapeAttr(profileImageUrl)}')`
    : "";

  return `
    <div class="mypage-item mypage-review-item mypage-applied-item"
      data-action="open-applied-interview-detail"
      data-interview-id="${escapeAttr(interviewId)}"
      role="button"
      tabindex="0"
    >
      <div class="mypage-review-top">
        <div class="mypage-review-left">
          <div class="mypage-review-avatar" style="${avatarStyle}"></div>

          <div class="mypage-review-head">
            <div class="mypage-item-title">${escapeHtml(nick)}${
              uniMajor
                ? ` <span class="mypage-review-sub">(${escapeHtml(
                    uniMajor
                  )})</span>`
                : ""
            }</div>
          </div>
        </div>

        <div class="mypage-review-meta">
          <span
            class="mm-badge mypage-status-chip"
            data-tone="${escapeAttr(chipTone)}"
            data-no-detail="true"
          >${escapeHtml(statusRaw)}</span>
        </div>
      </div>

      <div class="mypage-review-bottom mypage-applied-bottom">
        <div class="mypage-review-snippet mypage-applied-snippet" data-no-detail="true">
          ${escapeHtml(title)}
        </div>

        <div class="mypage-applied-dates" data-no-detail="true">
          <div class="mypage-date">
            <span class="mypage-date-label">신청일</span>
            <span class="mypage-date-value">${escapeHtml(createdDate)}</span>
          </div>

          ${
            responded
              ? `<div class="mypage-date mypage-date--edited">
                   <span class="mypage-date-label">${escapeHtml(endLabel)}</span>
                   <span class="mypage-date-value">${escapeHtml(
                     updatedDate
                   )}</span>
                 </div>`
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

/*
  상태 칩 톤 계산 처리
*/
function statusTone(statusUpper) {
  const s = String(statusUpper || "").trim().toUpperCase();
  if (s === "ACCEPTED") return "accepted";
  if (s === "REJECT" || s === "REJECTED") return "rejected";
  if (s === "PENDING") return "pending";
  if (s === "COMPLETED") return "dark";
  return "soft";
}

/*
  안전 문자열 변환 처리
*/
function safeText(v, fallback) {
  const s = String(v ?? "").trim();
  return s ? s : String(fallback ?? "");
}

/*
  날짜(yyyy-mm-dd) 포맷 처리
*/
function formatDateOnly(raw) {
  const s = String(raw || "").trim();
  if (!s) return "-";
  return s.length >= 10 ? s.slice(0, 10) : s;
}

/*
  생성/수정 시간 차이 여부 판정 처리
*/
function hasMeaningfulUpdate(createdAt, updatedAt) {
  const cKey = toComparableKey(createdAt);
  const uKey = toComparableKey(updatedAt);
  if (!uKey) return false;
  if (!cKey) return true;
  return uKey !== cKey;
}

/*
  날짜 비교 키 생성 처리
*/
function toComparableKey(dt) {
  const s = String(dt || "").trim();
  if (!s) return "";

  const m = s.match(
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?/
  );
  if (!m) return s;

  const base = m[1];
  const fracRaw = m[2] || "";
  const frac = fracRaw.replace(/0+$/, "");
  return frac ? `${base}.${frac}` : base;
}
