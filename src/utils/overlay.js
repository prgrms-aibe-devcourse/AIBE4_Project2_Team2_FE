// src/utils/overlay.js
let hideTimer = null;
let loadingCount = 0;

let showDelayTimer = null;
let minVisibleUntil = 0;

function getOverlay() {
  return document.getElementById("mmOverlay");
}

function setOverlayVisible(visible) {
  const overlay = getOverlay();
  if (!overlay) return;

  if (visible) {
    overlay.classList.add("is-show");
    overlay.setAttribute("aria-hidden", "false");
  } else {
    overlay.classList.remove("is-show");
    overlay.setAttribute("aria-hidden", "true");
    overlay.dataset.mode = "";
  }
}

function setOverlayText(text) {
  const textEl = document.getElementById("mmOverlayText");
  if (!textEl) return;

  const t = String(text || "").trim();
  textEl.textContent = t;
  textEl.style.display = t ? "block" : "none";
}

function setMode(mode) {
  const overlay = getOverlay();
  if (!overlay) return;

  overlay.dataset.mode = String(mode || "");
}

export function showOverlayCheck({ durationMs = 900, text = "" } = {}) {
  window.clearTimeout(hideTimer);
  window.clearTimeout(showDelayTimer);

  setMode("check");
  setOverlayText(text);
  setOverlayVisible(true);

  hideTimer = window.setTimeout(() => {
    setOverlayVisible(false);
  }, durationMs);
}

export function startOverlayLoading({
  text = "",
  delayMs = 150,
  minVisibleMs = 350,
} = {}) {
  window.clearTimeout(hideTimer);

  loadingCount += 1;
  setMode("loading");
  setOverlayText(text);

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

export function endOverlayLoading() {
  loadingCount = Math.max(0, loadingCount - 1);
  if (loadingCount !== 0) return;

  window.clearTimeout(showDelayTimer);

  const now = Date.now();
  const remain = Math.max(0, minVisibleUntil - now);

  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    if (loadingCount === 0) setOverlayVisible(false);
  }, remain);
}

export function hideOverlay() {
  loadingCount = 0;
  window.clearTimeout(hideTimer);
  window.clearTimeout(showDelayTimer);
  setOverlayVisible(false);
}

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
