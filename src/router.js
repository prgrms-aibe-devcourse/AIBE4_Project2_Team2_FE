// src/router.js
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
  라우터 정책
  - PUBLIC_PATHS: 로그인 없이 접근 가능한 경로
  - ROUTES: 정적 경로 렌더러 매핑
  - DYNAMIC_ROUTES: 파라미터가 포함된 동적 경로 렌더러 매핑
  - CSS_BY_ROUTE: 경로별 CSS 파일 매핑
  - HIDE_HEADER_ON: 특정 경로에서 헤더를 숨기는 조건
*/

const PUBLIC_PATHS = new Set([
  "/login",
  "/signup",
  "/oauth/callback",
  "/find-username",
  "/find-password",
]);

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
  - matchPath로 pattern과 실제 path를 비교하여 params를 추출한다
  - params는 render(view, params) 형태로 넘긴다
*/
const DYNAMIC_ROUTES = [
  { pattern: "/interview-create/:id", render: renderInterviewCreate },
  { pattern: "/major-role-request-detail/:id", render: renderMajorRequestDetail },
  { pattern: "/major-card-detail/:id", render: renderProfileDetail },
];

/*
  경로별 CSS 매핑
  - 먼저 매칭되는 규칙의 files를 적용한다
  - data-route-style="1" 링크를 매 라우팅마다 제거 후 다시 주입한다
*/
const CSS_BY_ROUTE = [
  { test: (p) => PUBLIC_PATHS.has(p), files: ["src/css/auth.css"] },
  { test: (p) => p === "/", files: ["src/css/home.css"] },
  { test: (p) => p === "/mypage" || p.startsWith("/mypage/"), files: ["src/css/mypage.css"] },
  { test: (p) => p === "/apply", files: ["src/css/apply.css"] },
  { test: (p) => p.startsWith("/interview-create/"), files: ["src/css/interview-create.css"] },
  { test: (p) => p === "/major-profile", files: ["src/css/major-profile.css"] },
  { test: (p) => p === "/recommend", files: ["src/css/recommend.css"] },
  { test: (p) => p === "/major-role-request", files: ["src/css/major-role-request.css"] },
  { test: (p) => p.startsWith("/major-role-request-detail/"), files: ["src/css/major-role-request-detail.css"] },
  { test: (p) => p.startsWith("/major-card-detail/"), files: ["src/css/profileDetail.css"] },
];

/*
  특정 경로에서는 헤더를 숨긴다
  - 인증 페이지
  - 상세 페이지(요청사항 기준)
  - 인터뷰 생성 팝업 화면(요청사항 기준)
*/
const HIDE_HEADER_ON = [
  (p) => PUBLIC_PATHS.has(p),
  (p) => p.startsWith("/major-role-request-detail/"),
  (p) => p.startsWith("/interview-create/"),
];

/*
  해시 라우터 이동
  - 동일 경로로의 중복 이동은 무시한다
*/
export function navigate(path) {
  const p = normalizePath(path);
  if (window.location.hash === `#${p}`) return;
  window.location.hash = `#${p}`;
}

/*
  라우터 시작
  - 헤더 버튼 이벤트 바인딩
  - 세션/유저 업데이트 이벤트를 수신하면 헤더를 즉시 동기화
  - 해시 변경 시 route 실행
*/
export function startRouter() {
  bindHeaderActions();

  window.addEventListener("mm:user-updated", syncHeaderUser);
  window.addEventListener("mm:session-updated", syncHeaderUser);

  window.addEventListener("hashchange", route);
  route();
}

/*
  라우팅 본체
  1) path 계산
  2) 가드(로그인 여부, 공개 경로 여부)
  3) 헤더 표시/숨김, CSS 적용
  4) 헤더 유저/모바일 메뉴 상태 동기화
  5) 동적 라우트 우선 매칭, 실패 시 정적 라우트 렌더
*/
function route() {
  const view = document.getElementById("view");
  if (!view) return;

  const path = getPath();
  const guardPath = normalizePathForGuard(path);

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
  동적 라우트 해석
  - 선언된 DYNAMIC_ROUTES를 순회하며 최초로 매칭되는 항목을 반환한다
*/
function resolveDynamicRoute(path) {
  for (const r of DYNAMIC_ROUTES) {
    const params = matchPath(path, r.pattern);
    if (params) return { render: r.render, params };
  }
  return null;
}

/*
  현재 해시에서 경로를 추출한다
  - hash가 없으면 "#/"로 간주
  - "#/xxx" -> "/xxx"
*/
function getPath() {
  const raw = window.location.hash || "#/";
  const p = raw.startsWith("#") ? raw.slice(1) : raw;
  return normalizePath(p);
}

/*
  경로 정규화
  - 빈 값이면 "/"
  - "/"로 시작하지 않으면 "/"를 붙인다
*/
function normalizePath(p) {
  const s = String(p || "").trim();
  if (!s || s === "#") return "/";
  if (!s.startsWith("/")) return `/${s}`;
  return s;
}

/*
  가드 및 매칭용 정규화
  - 쿼리(?), 추가 해시(#)를 제거한다
  - "/path?x=1" -> "/path"
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
  패턴 매칭
  - 길이가 다르면 실패
  - ":param" 형태면 params로 추출
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
  헤더 표시/숨김
*/
function toggleHeader(path) {
  const header = document.getElementById("siteHeader");
  if (!header) return;

  const hidden = HIDE_HEADER_ON.some((fn) => fn(path));
  header.style.display = hidden ? "none" : "";
}

/*
  라우트별 CSS 주입
  - 기존 data-route-style="1" 링크를 제거하고 현재 경로에 맞는 CSS를 다시 주입한다
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
  경로에 해당하는 CSS 파일 목록 반환
  - CSS_BY_ROUTE의 첫 매칭 규칙을 사용한다
*/
function getCssFilesForPath(guardPath) {
  for (const rule of CSS_BY_ROUTE) {
    if (rule.test(guardPath)) return rule.files;
  }
  return [];
}

/*
  헤더 액션 바인딩
  - 마이페이지 이동
  - 로그아웃 후 로그인 페이지 이동
  - 모바일 모드일 때만 아바타 버튼으로 메뉴 토글
  - 메뉴 외부 클릭 및 ESC로 닫기
  - 리사이즈 시 모바일 모드 상태 반영
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
  유저 메뉴 토글
*/
function toggleUserMenu(menu) {
  if (!menu) return;
  menu.classList.toggle("open");
}

/*
  유저 메뉴 닫기
*/
function closeUserMenu() {
  const menu = document.getElementById("userMenu");
  if (!menu) return;
  menu.classList.remove("open");
}

/*
  헤더 유저 정보 동기화
  - 로그인 상태면 링크 영역 표시, 아니면 숨김
  - 닉네임 표시
  - 아바타(프로필 이미지) 반영
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
  헤더 아바타 반영
  - profileImageUrl이 없으면 background-image 제거
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
  모바일 헤더 모드 판단
*/
function isMobileHeaderMode() {
  return window.matchMedia("(max-width: 720px)").matches;
}

/*
  모바일 모드에서만 아바타 버튼을 활성화한다
*/
function syncMobileMenuAvailability() {
  const avatarBtn = document.getElementById("avatarBtn");
  if (!avatarBtn) return;
  const mobile = isMobileHeaderMode();
  avatarBtn.disabled = !mobile;
  avatarBtn.classList.toggle("avatar-btn--disabled", !mobile);
}
