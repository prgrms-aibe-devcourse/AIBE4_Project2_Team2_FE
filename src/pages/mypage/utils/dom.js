// src/pages/mypage/utils/dom.js
/*
  DOM 유틸 모음
  - id 기반 요소 조회 함수 제공
  - 텍스트/값 설정 헬퍼 제공
  - HTML/속성 값 이스케이프 처리 제공
*/

export function $(id) {
  if (!id) return null;
  return document.getElementById(id);
}

/*
  textContent 설정 유틸
*/
export function setText(id, text) {
  const el = $(id);
  if (!el) return;
  el.textContent = String(text ?? "");
}

/*
  input/select value 설정 유틸
*/
export function setValue(id, value) {
  const el = $(id);
  if (!el) return;
  el.value = value == null ? "" : String(value);
}

/*
  최소 HTML 이스케이프 처리
*/
export function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/*
  속성 값 이스케이프 처리
  - 현재는 escapeHtml과 동일 처리
*/
export function escapeAttr(s) {
  return escapeHtml(s);
}
