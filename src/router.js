// src/router.js
import { isLoggedIn, getSession, logout } from "./auth/auth.js";

import { renderHome } from "./pages/home.js";
import { renderMyPage } from "./pages/mypage.js";
import { renderMyInterviewDetail } from "./pages/mypage-interview-detail.js";
import { renderMyQnaDetail } from "./pages/mypage-qna-detail.js";
import { renderMyReviewDetail } from "./pages/mypage-review-detail.js";

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
  "/interview-create/:id": renderInterviewCreate,
  "/apply": renderApply,
  "/major-profile": renderMajorProfile,
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

  // 마이페이지에서 사용자 정보 갱신 이벤트가 오면 헤더 즉시 반영
  window.addEventListener("mm:user-updated", () => {
    syncHeaderUser();
  });
  // 구버전 이벤트도 호환
  window.addEventListener("mm:session-updated", () => {
    syncHeaderUser();
  });

  window.addEventListener("hashchange", route);
  route();
}

function route() {
  const path = getPath();
  const view = document.getElementById("view");
  if (!view) return;

  const normalizedForGuard = normalizePathForGuard(path);

  if (!PUBLIC_PATHS.has(normalizedForGuard) && !isLoggedIn()) {
    navigate("/login");
    return;
  }

  if (PUBLIC_PATHS.has(normalizedForGuard) && isLoggedIn()) {
    navigate("/");
    return;
  }

  toggleHeaderForAuth(normalizedForGuard);
  syncRouteStyles(path);

  // 라우팅마다 헤더 동기화(페이지 이동 시)
  syncHeaderUser();
  syncMobileMenuAvailability();

  view.innerHTML = "";

  const myInterviewId = matchPath(path, "/mypage/interviews/:id");
  if (myInterviewId) {
    renderMyInterviewDetail(view, { id: myInterviewId.id });
    return;
  }

  const myQnaId = matchPath(path, "/mypage/qna/:id");
  if (myQnaId) {
    renderMyQnaDetail(view, { id: myQnaId.id });
    return;
  }

  const myReviewId = matchPath(path, "/mypage/reviews/:id");
  if (myReviewId) {
    renderMyReviewDetail(view, { id: myReviewId.id });
    return;
  }

  const interviewerId = matchPath(path, "/interview-create/:id");
  if (interviewerId) {
    renderInterviewCreate(view, { id: interviewerId.id });
    return;
  }

  const majorReqId = matchPath(path, "/major-role-request-detail/:id");
  if (majorReqId) {
    renderMajorRequestDetail(view, { id: majorReqId.id });
    return;
  }

  const majorCardId = matchPath(path, "/major-card-detail/:id");
  if (majorCardId) {
    renderProfileDetail(view, { id: majorCardId.id });
    return;
  }

  const renderer = routes[normalizePathForGuard(path)] || routes["/"];
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

function normalizePathForGuard(path) {
  const s = String(path || "").trim();
  if (!s) return "/";

  const qIdx = s.indexOf("?");
  const hIdx = s.indexOf("#");
  const cutIdx = qIdx === -1 ? hIdx : hIdx === -1 ? qIdx : Math.min(qIdx, hIdx);

  const clean = cutIdx === -1 ? s : s.slice(0, cutIdx);
  return clean || "/";
}

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

function toggleHeaderForAuth(path) {
  const header = document.getElementById("siteHeader");
  if (!header) return;
  const isAuth = PUBLIC_PATHS.has(path);
  const isDetailPage = path.startsWith("/major-role-request-detail/");
  const isInterviewPopUp = path.startsWith("/interview-create/");
  if (isAuth || isDetailPage || isInterviewPopUp) {
    header.style.display = "none";
  } else {
    header.style.display = "";
  }
}

function syncRouteStyles(path) {
  const files = getCssFilesForPath(path);
  const head = document.head;

  head
    .querySelectorAll('link[data-route-style="1"]')
    .forEach((el) => el.remove());

  for (const href of files) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute("data-route-style", "1");
    head.appendChild(link);
  }
}

function getCssFilesForPath(path) {
  const p = normalizePathForGuard(path);

  if (PUBLIC_PATHS.has(p)) return ["src/css/auth.css"];
  if (p === "/") return ["src/css/home.css"];
  if (p === "/mypage") return ["src/css/mypage.css"];
  if (p.startsWith("/mypage/")) return ["src/css/mypage.css"];
  if (p === "/apply") return ["src/css/apply.css"];
  if (p.startsWith("/interview-create/"))
    return ["src/css/interview-create.css"];
  if (p === "/major-profile") return ["src/css/major-profile.css"];
  if (p === "/recommend") return ["src/css/recommend.css"];
  if (p === "/manager") return ["src/css/manager.css"];
  if (p === "/major-role-request") return ["src/css/major-role-request.css"];
  if (p.startsWith("/major-role-request-detail/"))
    return ["src/css/major-role-request-detail.css"];
  if (p.startsWith("/major-card-detail/")) return ["src/css/profileDetail.css"];
  return [];
}

function bindHeaderActions() {
  const mypageBtn = document.getElementById("btnMyPage");
  const managerBtn = document.getElementById("btnManager");
  const logoutBtn = document.getElementById("btnLogout");

  const avatarBtn = document.getElementById("avatarBtn");

  const menu = document.getElementById("userMenu");
  const menuMyPage = document.getElementById("menuMyPage");
  const menuManager = document.getElementById("menuManager");
  const menuLogout = document.getElementById("menuLogout");

  if (mypageBtn) mypageBtn.addEventListener("click", () => navigate("/mypage"));
  if (managerBtn)
    managerBtn.addEventListener("click", () => navigate("/manager"));

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

  if (menuManager) {
    menuManager.addEventListener("click", () => {
      closeUserMenu();
      navigate("/manager");
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
}

function syncHeaderUser() {
  const session = getSession();
  const user = session?.user || null;

  const deskNick = document.getElementById("deskNickname");
  const menuNick = document.getElementById("menuNickname");

  const links = document.getElementById("userLinks");
  const isAuth = isLoggedIn();
  if (links) links.style.visibility = isAuth ? "visible" : "hidden";

  const nick = String(user?.nickname || "").trim() || "사용자";
  if (deskNick) deskNick.textContent = nick;
  if (menuNick) menuNick.textContent = nick;

  // 헤더 아바타(프로필 이미지) 반영
  applyHeaderAvatar(user?.profileImageUrl);

  // 관리자 버튼 표시
  const role = String(user?.role || "").trim();
  const isManager = role === "ADMIN" || role === "관리자";

  const managerBtn = document.getElementById("btnManager");
  const menuManager = document.getElementById("menuManager");

  if (managerBtn) managerBtn.style.display = isManager ? "" : "none";
  if (menuManager) menuManager.style.display = isManager ? "" : "none";
}

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
