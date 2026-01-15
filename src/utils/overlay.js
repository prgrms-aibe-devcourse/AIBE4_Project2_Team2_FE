// src/utils/overlay.js
/*
  오버레이 유틸
  - 체크(완료) 오버레이: showOverlayCheck()
  - 로딩 오버레이: startOverlayLoading() / endOverlayLoading()
  - 중첩 로딩 처리: loadingCount로 start/end 짝을 맞춘다
  - 깜빡임 방지: delayMs 이후에만 표시, 표시되면 minVisibleMs 이상 유지
*/

let hideTimer = null; // 오버레이 숨김 예약 타이머
let showDelayTimer = null; // 로딩 표시 지연 타이머

let loadingCount = 0; // 로딩 start/end 중첩 카운트
let minVisibleUntil = 0; // 로딩이 표시된 후 최소 유지 종료 시각(ms)

/*
  DOM 조회
*/
function getOverlayEl() {
  return document.getElementById("mmOverlay");
}

function getOverlayTextEl() {
  return document.getElementById("mmOverlayText");
}

/*
  표시/숨김
  - 숨길 때는 mode도 초기화하여 상태 누수를 방지한다
*/
function setOverlayVisible(visible) {
  const overlay = getOverlayEl();
  if (!overlay) return;

  if (visible) {
    overlay.classList.add("is-show");
    overlay.setAttribute("aria-hidden", "false");
    return;
  }

  overlay.classList.remove("is-show");
  overlay.setAttribute("aria-hidden", "true");
  overlay.dataset.mode = "";
}

/*
  텍스트 설정
  - 빈 문자열이면 텍스트 영역을 숨긴다
*/
function setOverlayText(text) {
  const textEl = getOverlayTextEl();
  if (!textEl) return;

  const t = String(text || "").trim();
  textEl.textContent = t;
  textEl.style.display = t ? "block" : "none";
}

/*
  모드 설정
  - CSS에서 [data-mode="loading"] 같은 형태로 제어 가능
*/
function setOverlayMode(mode) {
  const overlay = getOverlayEl();
  if (!overlay) return;

  overlay.dataset.mode = String(mode || "");
}

/*
  타이머 정리
*/
function clearTimers() {
  window.clearTimeout(hideTimer);
  window.clearTimeout(showDelayTimer);
  hideTimer = null;
  showDelayTimer = null;
}

/*
  체크(완료) 오버레이
  - 기존 타이머를 정리하고 즉시 표시한 뒤 durationMs 후 숨김
*/
export function showOverlayCheck({ durationMs = 900, text = "" } = {}) {
  clearTimers();

  setOverlayMode("check");
  setOverlayText(text);
  setOverlayVisible(true);

  hideTimer = window.setTimeout(() => {
    setOverlayVisible(false);
  }, durationMs);
}

/*
  로딩 시작
  - 중첩 호출을 지원한다(loadingCount)
  - 첫 로딩일 때만 delayMs 후에 표시한다(짧은 요청의 깜빡임 방지)
  - 표시된 이후에는 minVisibleMs 이상 유지되도록 minVisibleUntil을 계산한다
*/
export function startOverlayLoading({
  text = "",
  delayMs = 150,
  minVisibleMs = 350,
} = {}) {
  window.clearTimeout(hideTimer);

  loadingCount += 1;

  setOverlayMode("loading");
  setOverlayText(text);

  // 이미 로딩이 표시 중(또는 표시 예정)이라면 그대로 유지
  if (loadingCount > 1) {
    setOverlayVisible(true);
    return;
  }

  const now = Date.now();
  minVisibleUntil = now + delayMs + minVisibleMs;

  window.clearTimeout(showDelayTimer);
  showDelayTimer = window.setTimeout(() => {
    if (loadingCount > 0) setOverlayVisible(true);
  }, delayMs);
}

/*
  로딩 종료
  - loadingCount를 감소시키고 0이 되면 숨김 예약
  - 최소 표시 시간(minVisibleUntil)이 남아 있으면 그만큼 더 유지한다
*/
export function endOverlayLoading() {
  loadingCount = Math.max(0, loadingCount - 1);
  if (loadingCount !== 0) return;

  window.clearTimeout(showDelayTimer);
  showDelayTimer = null;

  const now = Date.now();
  const remain = Math.max(0, minVisibleUntil - now);

  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    if (loadingCount === 0) setOverlayVisible(false);
  }, remain);
}

/*
  강제 숨김
  - 모든 로딩을 종료된 것으로 간주하고 즉시 숨긴다
*/
export function hideOverlay() {
  loadingCount = 0;
  clearTimers();
  setOverlayVisible(false);
}

/*
  로딩 래퍼
  - 비동기 함수를 오버레이 로딩과 함께 실행한다
  - 성공/실패와 무관하게 endOverlayLoading을 보장한다
*/
export async function withOverlayLoading(
  fn,
  { text = "", delayMs = 150, minVisibleMs = 350 } = {}
) {
  startOverlayLoading({ text, delayMs, minVisibleMs });
  try {
    return await fn();
  } finally {
    endOverlayLoading();
  }
}

/*
  커스텀 이벤트 바인딩
  - 다른 모듈에서 window.dispatchEvent(new CustomEvent(...))로 제어 가능
*/
export function initOverlayEvents() {
  window.addEventListener("mm:overlay-check", (e) => {
    showOverlayCheck(e?.detail || {});
  });

  window.addEventListener("mm:overlay-loading-start", (e) => {
    startOverlayLoading(e?.detail || {});
  });

  window.addEventListener("mm:overlay-loading-end", () => {
    endOverlayLoading();
  });

  window.addEventListener("mm:overlay-hide", () => {
    hideOverlay();
  });
}
