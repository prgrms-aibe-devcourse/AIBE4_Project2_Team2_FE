// src/router.js
/*
  라우터 정책 정리
  - PUBLIC_PATHS: 비로그인 접근 허용 경로 집합
  - ROUTES: 정적 경로 렌더러 매핑
  - DYNAMIC_ROUTES: 파라미터 포함 경로 렌더러 매핑
  - CSS_BY_ROUTE: 경로별 CSS 파일 매핑
  - HIDE_HEADER_ON: 헤더 숨김 조건 목록
  - 마이페이지 모달 잔존 방지: 마이페이지 이탈 시 모달 DOM 제거 및 body 상태 복구 처리
*/

import { isLoggedIn, getSession, logout } from "./auth/auth.js";

import { renderHome } from "./pages/home.js";
import { renderMyPage } from "./pages/mypage.js";

import { renderLogin } from "./pages/login.js";
import { renderSignup } from "./pages/signup.js";
import { renderOAuthCallback } from "./pages/oauth-callback.js";
import { renderFindUsername } from "./pages/find-username.js";
import { renderFindPassword } from "./pages/find-password.js";

import { renderApply } from "./pages/apply.js";
import { renderMajorProfile } from "./pages/major-profile.js";
import { renderMajorRoleRequest } from "./pages/major-role-request.js";
import { renderMajorRequestDetail } from "./pages/major-role-request-detail.js";

import { renderInterviewCreate } from "./pages/interview-create.js";
import { renderMyMajorProfile } from "./pages/my-major-profile.js";

import { renderRecommend } from "./pages/recommend.js";
import { renderProfileDetail } from "./pages/major-card-detail.js";

/*
  비로그인 접근 허용 경로 목록
*/
const PUBLIC_PATHS = new Set([
  "/login",
  "/signup",
  "/oauth/callback",
  "/find-username",
  "/find-password",
]);

/*
  정적 라우트 렌더러 매핑
*/
const ROUTES = {
  "/": renderHome,
  "/mypage": renderMyPage,
  "/apply": renderApply,
  "/major-profile": renderMajorProfile,
  "/major-role-request": renderMajorRoleRequest,
  "/recommend": renderRecommend,
  "/login": renderLogin,
  "/signup": renderSignup,
  "/oauth/callback": renderOAuthCallback,
  "/find-username": renderFindUsername,
  "/find-password": renderFindPassword,
};

/*
  동적 라우트 목록
*/
const DYNAMIC_ROUTES = [
  { pattern: "/interview-create/:id", render: renderInterviewCreate },
  {
    pattern: "/major-role-request-detail/:id",
    render: renderMajorRequestDetail,
  },
  { pattern: "/major-card-detail/:id", render: renderProfileDetail },
];

/*
  경로별 CSS 매핑
*/
const CSS_BY_ROUTE = [
  { test: (p) => PUBLIC_PATHS.has(p), files: ["src/css/auth.css"] },
  { test: (p) => p === "/", files: ["src/css/home.css"] },
  {
    test: (p) => p === "/mypage" || p.startsWith("/mypage/"),
    files: ["src/css/mypage.css"],
  },
  { test: (p) => p === "/apply", files: ["src/css/apply.css"] },
  {
    test: (p) => p.startsWith("/interview-create/"),
    files: ["src/css/interview-create.css"],
  },
  { test: (p) => p === "/major-profile", files: ["src/css/major-profile.css"] },
  { test: (p) => p === "/recommend", files: ["src/css/recommend.css"] },
  {
    test: (p) => p === "/major-role-request",
    files: ["src/css/major-role-request.css"],
  },
  {
    test: (p) => p.startsWith("/major-role-request-detail/"),
    files: ["src/css/major-role-request-detail.css"],
  },
  {
    test: (p) => p.startsWith("/major-card-detail/"),
    files: ["src/css/profileDetail.css"],
  },
];

/*
  특정 경로에서 헤더 숨김 조건 목록
*/
const HIDE_HEADER_ON = [
  (p) => PUBLIC_PATHS.has(p),
  (p) => p.startsWith("/major-role-request-detail/"),
  (p) => p.startsWith("/interview-create/"),
];

/*
  마이페이지 모달 잔존 방지용 대상 ID 목록
*/
const MYPAGE_MODAL_IDS = [
  "reviewCreateModal",
  "reviewEditModal",
  "reviewDetailModal",
  "qnaEditModal",
  "appliedInterviewDetailModal",
];

/*
  해시 라우터 이동 함수
*/
export function navigate(path) {
  const p = normalizePath(path);
  if (window.location.hash === `#${p}`) return;
  window.location.hash = `#${p}`;
}

/*
  라우터 시작 함수
*/
export function startRouter() {
  bindHeaderActions();

  window.addEventListener("mm:user-updated", syncHeaderUser);
  window.addEventListener("mm:session-updated", syncHeaderUser);

  window.addEventListener("hashchange", route);
  route();
}

/*
  라우팅 본체 함수
*/
function route() {
  const view = document.getElementById("view");
  if (!view) return;

  const prevPath = getPrevGuardPath();
  const path = getPath();
  const guardPath = normalizePathForGuard(path);

  if (prevPath && prevPath !== guardPath) {
    cleanupOnRouteLeave(prevPath, guardPath);
  }

  setPrevGuardPath(guardPath);

  if (!PUBLIC_PATHS.has(guardPath) && !isLoggedIn()) {
    navigate("/login");
    return;
  }

  if (PUBLIC_PATHS.has(guardPath) && isLoggedIn()) {
    navigate("/");
    return;
  }

  toggleHeader(guardPath);
  syncRouteStyles(guardPath);

  syncHeaderUser();
  syncMobileMenuAvailability();

  view.innerHTML = "";

  const dyn = resolveDynamicRoute(path);
  if (dyn) {
    dyn.render(view, dyn.params);
    return;
  }

  const renderer = ROUTES[guardPath] || ROUTES["/"];
  renderer(view);
}

/*
  라우트 이탈 시 정리 처리
*/
function cleanupOnRouteLeave(prevGuardPath, nextGuardPath) {
  if (isMyPagePath(prevGuardPath) && !isMyPagePath(nextGuardPath)) {
    cleanupMyPageModals();
  }
}

/*
  마이페이지 여부 판단
*/
function isMyPagePath(guardPath) {
  const p = normalizePathForGuard(guardPath);
  return p === "/mypage" || p.startsWith("/mypage/");
}

/*
  마이페이지 모달 정리 처리
*/
function cleanupMyPageModals() {
  for (const id of MYPAGE_MODAL_IDS) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  document.body.classList.remove("mm-modal-open");

  document
    .querySelectorAll(".mm-modal.is-open")
    .forEach((el) => el.classList.remove("is-open"));
}

/*
  동적 라우트 해석 함수
*/
function resolveDynamicRoute(path) {
  for (const r of DYNAMIC_ROUTES) {
    const params = matchPath(path, r.pattern);
    if (params) return { render: r.render, params };
  }
  return null;
}

/*
  현재 해시에서 경로 추출 함수
*/
function getPath() {
  const raw = window.location.hash || "#/";
  const p = raw.startsWith("#") ? raw.slice(1) : raw;
  return normalizePath(p);
}

/*
  경로 정규화 함수
*/
function normalizePath(p) {
  const s = String(p || "").trim();
  if (!s || s === "#") return "/";
  if (!s.startsWith("/")) return `/${s}`;
  return s;
}

/*
  가드 및 매칭용 경로 정규화 함수
*/
function normalizePathForGuard(path) {
  const s = String(path || "").trim();
  if (!s) return "/";

  const qIdx = s.indexOf("?");
  const hIdx = s.indexOf("#");
  const cutIdx = qIdx === -1 ? hIdx : hIdx === -1 ? qIdx : Math.min(qIdx, hIdx);

  const clean = cutIdx === -1 ? s : s.slice(0, cutIdx);
  return clean || "/";
}

/*
  패턴 매칭 함수
*/
function matchPath(actualPath, pattern) {
  const actual = normalizePathForGuard(actualPath);
  const patt = normalizePathForGuard(pattern);

  const aParts = actual.split("/").filter(Boolean);
  const pParts = patt.split("/").filter(Boolean);
  if (aParts.length !== pParts.length) return null;

  const params = {};
  for (let i = 0; i < pParts.length; i++) {
    const pSeg = pParts[i];
    const aSeg = aParts[i];

    if (pSeg.startsWith(":")) {
      const key = pSeg.slice(1);
      params[key] = decodeURIComponent(aSeg);
      continue;
    }
    if (pSeg !== aSeg) return null;
  }
  return params;
}

/*
  헤더 표시/숨김 함수
*/
function toggleHeader(path) {
  const header = document.getElementById("siteHeader");
  if (!header) return;

  const hidden = HIDE_HEADER_ON.some((fn) => fn(path));
  header.style.display = hidden ? "none" : "";
}

/*
  라우트별 CSS 주입 함수
*/
function syncRouteStyles(guardPath) {
  const head = document.head;

  head
    .querySelectorAll('link[data-route-style="1"]')
    .forEach((el) => el.remove());

  const files = getCssFilesForPath(guardPath);
  for (const href of files) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute("data-route-style", "1");
    head.appendChild(link);
  }
}

/*
  경로에 해당하는 CSS 파일 목록 반환 함수
*/
function getCssFilesForPath(guardPath) {
  for (const rule of CSS_BY_ROUTE) {
    if (rule.test(guardPath)) return rule.files;
  }
  return [];
}

/*
  헤더 액션 바인딩 함수
*/
function bindHeaderActions() {
  const mypageBtn = document.getElementById("btnMyPage");
  const logoutBtn = document.getElementById("btnLogout");

  const avatarBtn = document.getElementById("avatarBtn");

  const menu = document.getElementById("userMenu");
  const menuMyPage = document.getElementById("menuMyPage");
  const menuLogout = document.getElementById("menuLogout");

  if (mypageBtn) mypageBtn.addEventListener("click", () => navigate("/mypage"));

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await logout();
      closeUserMenu();
      navigate("/login");
    });
  }

  if (menuMyPage) {
    menuMyPage.addEventListener("click", () => {
      closeUserMenu();
      navigate("/mypage");
    });
  }

  if (menuLogout) {
    menuLogout.addEventListener("click", async () => {
      await logout();
      closeUserMenu();
      navigate("/login");
    });
  }

  if (avatarBtn) {
    avatarBtn.addEventListener("click", () => {
      if (!isMobileHeaderMode()) return;
      toggleUserMenu(menu);
    });
  }

  document.addEventListener("click", (e) => {
    if (!menu || !menu.classList.contains("open")) return;
    const inMenu = e.target.closest("#userMenu");
    const inAvatar = e.target.closest("#avatarBtn");
    if (inMenu || inAvatar) return;
    closeUserMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeUserMenu();
  });

  window.addEventListener("resize", () => {
    syncMobileMenuAvailability();
    if (!isMobileHeaderMode()) closeUserMenu();
  });
}

/*
  유저 메뉴 토글 함수
*/
function toggleUserMenu(menu) {
  if (!menu) return;
  menu.classList.toggle("open");
}

/*
  유저 메뉴 닫기 함수
*/
function closeUserMenu() {
  const menu = document.getElementById("userMenu");
  if (!menu) return;
  menu.classList.remove("open");
}

/*
  헤더 유저 정보 동기화 함수
*/
function syncHeaderUser() {
  const session = getSession();
  const user = session?.user || null;

  const deskNick = document.getElementById("deskNickname");
  const menuNick = document.getElementById("menuNickname");

  const links = document.getElementById("userLinks");
  const authed = isLoggedIn();
  if (links) links.style.visibility = authed ? "visible" : "hidden";

  const nick = String(user?.nickname || "").trim() || "사용자";
  if (deskNick) deskNick.textContent = nick;
  if (menuNick) menuNick.textContent = nick;

  applyHeaderAvatar(user?.profileImageUrl);
}

/*
  헤더 아바타 반영 함수
*/
function applyHeaderAvatar(profileImageUrl) {
  const url = String(profileImageUrl || "").trim();
  const avatarSpan = document.querySelector("#avatarBtn .avatar");
  if (!avatarSpan) return;

  if (!url) {
    avatarSpan.style.removeProperty("background-image");
    avatarSpan.style.removeProperty("background-size");
    avatarSpan.style.removeProperty("background-position");
    avatarSpan.style.removeProperty("background-repeat");
    return;
  }

  avatarSpan.style.backgroundImage = `url("${url}")`;
  avatarSpan.style.backgroundSize = "cover";
  avatarSpan.style.backgroundPosition = "center";
  avatarSpan.style.backgroundRepeat = "no-repeat";
}

/*
  모바일 헤더 모드 판단 함수
*/
function isMobileHeaderMode() {
  return window.matchMedia("(max-width: 720px)").matches;
}

/*
  모바일 모드에서만 아바타 버튼 활성화 처리
*/
function syncMobileMenuAvailability() {
  const avatarBtn = document.getElementById("avatarBtn");
  if (!avatarBtn) return;
  const mobile = isMobileHeaderMode();
  avatarBtn.disabled = !mobile;
  avatarBtn.classList.toggle("avatar-btn--disabled", !mobile);
}

/*
  이전 가드 경로 저장용 유틸
*/
const PREV_GUARD_KEY = "__mm_prev_guard_path__";

function getPrevGuardPath() {
  try {
    return sessionStorage.getItem(PREV_GUARD_KEY) || "";
  } catch {
    return "";
  }
}

function setPrevGuardPath(path) {
  try {
    sessionStorage.setItem(PREV_GUARD_KEY, String(path || ""));
  } catch {}
}
