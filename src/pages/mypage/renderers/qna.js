// src/pages/mypage/renderers/qna.js
/*
  QnA 아이템 렌더링
  - QnaResponse 구조(item.question, item.answer) 우선 대응
  - 구버전 구조(item.questionId, item.questionContent, item.answerBody) 호환
  - 질문/답변 작성일과 수정일 표시 처리
  - 답변 대기 상태에서는 수정/삭제 버튼 노출
  - 더보기 버튼은 초기 hidden 상태로 렌더링하고 외부에서 overflow 감지 후 노출
*/

import { escapeHtml, escapeAttr } from "../utils/dom.js";

export function renderMyQuestionItem(item) {
  // 질문 ID 추출(루트/내부 구조 모두 대응)
  const questionId = pickQuestionId(item);

  // 질문 내용 추출(QnaResponse 기준 우선)
  const question = safeText(
    item?.question?.content ?? item?.questionContent ?? item?.content,
    "-"
  );

  // 답변 여부
  const hasAnswer = Boolean(item?.hasAnswer);

  // 질문 날짜(QnaResponse 기준 우선)
  const qCreatedRaw = item?.question?.createdAt ?? item?.createdAt ?? "";
  const qUpdatedRaw = item?.question?.updatedAt ?? item?.updatedAt ?? "";
  const qCreatedDate = formatDateOnly(qCreatedRaw);
  const qUpdatedDate = formatDateOnly(qUpdatedRaw);
  const qEdited = hasMeaningfulUpdate(qCreatedRaw, qUpdatedRaw);

  // 답변 데이터(QnaResponse 기준 우선, 구버전 호환)
  const ans = item?.answer ?? item?.answerBody ?? null;
  const answerText = safeText(ans?.content, "");
  const aCreatedRaw = ans?.createdAt ?? "";
  const aUpdatedRaw = ans?.updatedAt ?? "";
  const aCreatedDate = formatDateOnly(aCreatedRaw);
  const aUpdatedDate = formatDateOnly(aUpdatedRaw);
  const aEdited = hasMeaningfulUpdate(aCreatedRaw, aUpdatedRaw);

  // 상태 칩
  const tone = hasAnswer ? "accepted" : "pending";
  const statusLabel = hasAnswer ? "답변 완료" : "답변 대기";

  // 날짜 라인 구성
  const qDatesLine = buildDatesLine({
    primaryLabel: "질문일",
    primaryValue: qCreatedDate,
    edited: qEdited,
    updatedLabel: "수정일",
    updatedValue: qUpdatedDate,
  });

  const aDatesLine = answerText
    ? buildDatesLine({
        primaryLabel: "답변일",
        primaryValue: aCreatedDate,
        edited: aEdited,
        updatedLabel: "수정일",
        updatedValue: aUpdatedDate,
      })
    : "";

  // 더보기 토글용 텍스트(현재는 동일 문자열을 short/full에 넣고, 외부에서 overflow를 기준으로 토글)
  const qShort = question;
  const qFull = question;
  const aShort = answerText;
  const aFull = answerText;

  return `
    <div class="mypage-item mypage-review-item mypage-qna-item"
      data-question-id="${escapeAttr(questionId)}"
    >
      <div class="mypage-review-top">
        <div class="mypage-review-left"></div>
        <div class="mypage-review-meta"></div>
      </div>

      <div class="mypage-qna-block mypage-qna-block--question">
        ${
          qDatesLine
            ? `<div class="mypage-qna-dates-line" data-no-detail="true">${qDatesLine}</div>`
            : ""
        }

        <div class="mypage-qna-text" data-no-detail="true">
          <span class="mypage-qna-short" data-part="q-short">${escapeHtml(
            qShort
          )}</span>
          <span class="mypage-qna-full" data-part="q-full" hidden>${escapeHtml(
            qFull
          )}</span>
          <button
            type="button"
            class="mypage-qna-more"
            data-action="toggle-qna"
            data-target="question"
            data-open="false"
            aria-expanded="false"
            hidden
          >더보기</button>
        </div>

        ${
          hasAnswer
            ? ""
            : `
              <div class="mypage-qna-actions">
                <button
                  class="mypage-mini-btn"
                  type="button"
                  data-action="edit-qna"
                  data-question-id="${escapeAttr(questionId)}"
                >수정하기</button>

                <button
                  class="mypage-mini-btn"
                  type="button"
                  data-action="delete-qna"
                  data-question-id="${escapeAttr(questionId)}"
                >삭제하기</button>
              </div>
            `
        }
      </div>

      <div class="mypage-qna-block mypage-qna-block--answer">
        <div class="mypage-qna-head">
          <div class="mypage-qna-head-left">
            <span class="mm-badge mypage-status-chip mypage-qna-status"
              data-tone="${escapeAttr(tone)}"
              data-no-detail="true"
            >${escapeHtml(statusLabel)}</span>
          </div>

          ${
            aDatesLine
              ? `<div class="mypage-qna-head-dates" data-no-detail="true">${aDatesLine}</div>`
              : ""
          }
        </div>

        ${
          answerText
            ? `
              <div class="mypage-qna-text" data-no-detail="true">
                <span class="mypage-qna-short" data-part="a-short">${escapeHtml(
                  aShort
                )}</span>
                <span class="mypage-qna-full" data-part="a-full" hidden>${escapeHtml(
                  aFull
                )}</span>
                <button
                  type="button"
                  class="mypage-qna-more"
                  data-action="toggle-qna"
                  data-target="answer"
                  data-open="false"
                  aria-expanded="false"
                  hidden
                >더보기</button>
              </div>
            `
            : `<div class="mm-empty">아직 답변이 없습니다</div>`
        }
      </div>
    </div>
  `;
}

/*
  질문 ID 추출
*/
function pickQuestionId(it) {
  return String(it?.questionId ?? it?.question?.questionId ?? "").trim();
}

/*
  날짜 라인 렌더링
*/
function buildDatesLine({
  primaryLabel,
  primaryValue,
  edited,
  updatedLabel,
  updatedValue,
} = {}) {
  const p = String(primaryValue || "").trim();
  if (!p || p === "-") return "";

  const parts = [`${renderChipLabel(primaryLabel)} ${renderDateValue(p)}`];

  if (edited) {
    const u = String(updatedValue || "").trim();
    if (u && u !== "-" && u !== p) {
      parts.push(`${renderChipLabel(updatedLabel)} ${renderDateValue(u)}`);
    }
  }

  return parts.join(`<span class="mypage-qna-dot" aria-hidden="true">·</span>`);
}

/*
  날짜 라벨 칩 렌더링
*/
function renderChipLabel(label) {
  return `<span class="mypage-qna-date-chip" data-no-detail="true">${escapeHtml(
    label
  )}</span>`;
}

/*
  날짜 값 렌더링
*/
function renderDateValue(value) {
  return `<span class="mypage-qna-date-val" data-no-detail="true">${escapeHtml(
    value
  )}</span>`;
}

/*
  안전한 문자열 처리
*/
function safeText(v, fallback = "") {
  const s = String(v ?? "").trim();
  return s ? s : fallback;
}

/*
  날짜(YYYY-MM-DD)만 표시
*/
function formatDateOnly(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return "-";
  return s.length >= 10 ? s.slice(0, 10) : s;
}

/*
  의미 있는 수정 여부 판정
  - createdAt과 updatedAt을 비교해 실제로 달라졌는지 판단
*/
function hasMeaningfulUpdate(createdAt, updatedAt) {
  const cKey = toComparableKey(createdAt);
  const uKey = toComparableKey(updatedAt);
  if (!uKey) return false;
  if (!cKey) return true;
  return uKey !== cKey;
}

/*
  비교용 키 생성
  - ISO 문자열에서 밀리초의 불필요한 0 제거 후 비교
*/
function toComparableKey(dt) {
  const s = String(dt ?? "").trim();
  if (!s) return "";

  const m = s.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?/);
  if (!m) return s;

  const base = m[1];
  const fracRaw = m[2] || "";
  const frac = fracRaw.replace(/0+$/, "");
  return frac ? `${base}.${frac}` : base;
}
