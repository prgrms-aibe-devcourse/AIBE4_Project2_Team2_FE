import { isLoggedIn, getSession, logout } from "./auth/auth.js";

import { renderHome } from "./pages/home.js";
import { renderMyPage } from "./pages/mypage.js";
import { renderLogin } from "./pages/login.js";
import { renderSignup } from "./pages/signup.js";
import { renderOAuthCallback } from "./pages/oauth-callback.js";
import { renderFindUsername } from "./pages/find-username.js";
import { renderFindPassword } from "./pages/find-password.js";

import { renderApply } from "./pages/apply.js";
import { renderMajorRoleRequest } from "./pages/major-role-request.js";
import { renderMajorRequestDetail } from "./pages/major-role-request-detail.js";

import { renderMyMajorProfile } from "./pages/my-major-profile.js";

import { renderRecommend } from "./pages/recommend.js";
import { renderProfileDetail } from "./pages/major-card-detail.js";
import { renderManager } from "./pages/manager.js";

const PUBLIC_PATHS = new Set([
  "/login",
  "/signup",
  "/oauth/callback",
  "/find-username",
  "/find-password",
]);

const routes = {
  "/": renderHome,
  "/mypage": renderMyPage,
  "/apply": renderApply,
  "/major-role-request": renderMajorRoleRequest,
  "/major-role-request-detail/:id": renderMajorRequestDetail,
  "/my-major-profile": renderMyMajorProfile,
  "/major-card-detail/:id": renderProfileDetail,
  "/recommend": renderRecommend,
  "/login": renderLogin,
  "/signup": renderSignup,
  "/oauth/callback": renderOAuthCallback,
  "/find-username": renderFindUsername,
  "/find-password": renderFindPassword,
  "/manager": renderManager,
};

export function navigate(path) {
  const p = normalizePath(path);
  if (window.location.hash === `#${p}`) return;
  window.location.hash = `#${p}`;
}

export function startRouter() {
  bindHeaderActions();
  window.addEventListener("hashchange", route);
  route();
}

function route() {
  const path = getPath();
  const view = document.getElementById("view");
  if (!view) return;

  // 인증 가드: 로그인/회원가입 외 전부 차단
  if (!PUBLIC_PATHS.has(path) && !isLoggedIn()) {
    navigate("/login");
    return;
  }

  // 로그인/회원가입에서 로그인 상태면 홈으로
  if (PUBLIC_PATHS.has(path) && isLoggedIn()) {
    navigate("/");
    return;
  }

  toggleHeaderForAuth(path);
  syncRouteStyles(path);
  syncHeaderUser();
  syncMobileMenuAvailability();

  view.innerHTML = "";

  // 동적 라우트: /profile/:id
  if (path.startsWith("/profile/")) {
    const id = decodeURIComponent(path.slice("/profile/".length));
    renderProfileDetail(view, { id });
    return;
  }

  if (path.startsWith("/major-role-request-detail/")) {
    const id = decodeURIComponent(
      path.slice("/major-role-request-detail/".length)
    );
    renderMajorRequestDetail(view, { id });
    return;
  }

  if (path.startsWith("/major-card-detail/")) {
    const id = decodeURIComponent(path.slice("/major-card-detail/".length));
    renderProfileDetail(view, { id });
    return;
  }

  const renderer = routes[path] || routes["/"];
  renderer(view);
}

function getPath() {
  const raw = window.location.hash || "#/";
  const p = raw.startsWith("#") ? raw.slice(1) : raw;
  return normalizePath(p);
}

function normalizePath(p) {
  const s = String(p || "").trim();
  if (!s || s === "#") return "/";
  if (!s.startsWith("/")) return `/${s}`;
  return s;
}

function toggleHeaderForAuth(path) {
  const header = document.getElementById("siteHeader");
  if (!header) return;
  const isAuth = PUBLIC_PATHS.has(path);
  header.style.display = isAuth ? "none" : "";
}

function syncRouteStyles(path) {
  const files = getCssFilesForPath(path);
  const head = document.head;

  // 기존 라우트 스타일 제거
  head
    .querySelectorAll('link[data-route-style="1"]')
    .forEach((el) => el.remove());

  // 새 라우트 스타일 추가
  for (const href of files) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute("data-route-style", "1");
    head.appendChild(link);
  }
}

function getCssFilesForPath(path) {
  if (
    path === "/login" ||
    path === "/signup" ||
    path === "/oauth/callback" ||
    path === "/find-username" ||
    path === "/find-password"
  )
    return ["src/css/auth.css"];
  if (path === "/") return ["src/css/home.css"];
  if (path === "/mypage") return ["src/css/mypage.css"];
  if (path === "/apply") return ["src/css/apply.css"];
  if (path === "/recommend") return ["src/css/recommend.css"];
  if (path.startsWith("/major-card-detail/"))
    return ["src/css/profileDetail.css"];
  if (path === "/manager") return ["src/css/manager.css"];
  if (path === "/major-role-request") return ["src/css/major-role-request.css"];
  if (path.startsWith("/major-role-request-detail/"))
    return ["src/css/major-role-request-detail.css"];
  if (path === "/my-major-profile") return ["src/css/my-major-profile.css"];
  return [];
}

function bindHeaderActions() {
  const mypageBtn = document.getElementById("btnMyPage");
  const managerBtn = document.getElementById("btnManager");
  const logoutBtn = document.getElementById("btnLogout");

  const menu = document.getElementById("userMenu");
  const menuMyPage = document.getElementById("menuMyPage");
  const menuManager = document.getElementById("menuManager");
  const menuLogout = document.getElementById("menuLogout");

  if (mypageBtn) mypageBtn.addEventListener("click", () => navigate("/mypage"));
  if (managerBtn)
    managerBtn.addEventListener("click", () => navigate("/manager"));
  if (logoutBtn)
    logoutBtn.addEventListener("click", async () => {
      await logout();
      closeUserMenu();
      navigate("/login");
    });

  if (menuMyPage)
    menuMyPage.addEventListener(
      "click",
      () => (closeUserMenu(), navigate("/mypage"))
    );
  if (menuManager)
    menuManager.addEventListener(
      "click",
      () => (closeUserMenu(), navigate("/manager"))
    );
  if (menuLogout)
    menuLogout.addEventListener("click", async () => {
      await logout();
      closeUserMenu();
      navigate("/login");
    });

  // 모바일에서만 아바타 클릭 시 드롭다운 열기
  if (avatarBtn) {
    avatarBtn.addEventListener("click", () => {
      const canOpen = isMobileHeaderMode();
      if (!canOpen) return;
      toggleUserMenu();
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

  function toggleUserMenu() {
    if (!menu) return;
    menu.classList.toggle("open");
  }

  function closeUserMenu() {
    if (!menu) return;
    menu.classList.remove("open");
  }

  function isMobileHeaderMode() {
    return window.matchMedia("(max-width: 720px)").matches;
  }

  function syncMobileMenuAvailability() {
    if (!avatarBtn) return;
    avatarBtn.disabled = !isMobileHeaderMode();
    avatarBtn.classList.toggle("avatar-btn--disabled", !isMobileHeaderMode());
  }
}

function syncHeaderUser() {
  const session = getSession();

  const nickEl = document.getElementById("nickname");
  const deskNick = document.getElementById("deskNickname");
  const menuNick = document.getElementById("menuNickname");

  const links = document.getElementById("userLinks");

  const isAuth = isLoggedIn();

  if (links) links.style.visibility = isAuth ? "visible" : "hidden";

  const nick = session?.user?.nickname
    ? String(session.user.nickname)
    : "사용자";
  if (nickEl) nickEl.textContent = nick;
  if (deskNick) deskNick.textContent = nick;
  if (menuNick) menuNick.textContent = nick;

  // 매니저 버튼 visibility 처리
  const isManager = session?.major === "관리자";
  const managerBtn = document.getElementById("btnManager");
  const menuManager = document.getElementById("menuManager");

  if (managerBtn) managerBtn.style.display = isManager ? "" : "none";
  if (menuManager) menuManager.style.display = isManager ? "" : "none";
}

function closeUserMenu() {
  const menu = document.getElementById("userMenu");
  if (!menu) return;
  menu.classList.remove("open");
}

function isMobileHeaderMode() {
  return window.matchMedia("(max-width: 720px)").matches;
}

function syncMobileMenuAvailability() {
  const avatarBtn = document.getElementById("avatarBtn");
  if (!avatarBtn) return;
  avatarBtn.disabled = !isMobileHeaderMode();
  avatarBtn.classList.toggle("avatar-btn--disabled", !isMobileHeaderMode());
}
