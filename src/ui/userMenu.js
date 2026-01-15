// src/ui/userMenu.js
/*
  유저 메뉴/헤더 동기화 유틸
  - 로컬 저장소(KEY=mm_user)의 유저 정보를 헤더(닉네임/이름/아바타)에 반영한다
  - 로그아웃 버튼(데스크탑/모바일)을 바인딩한다
  - 유저 갱신 이벤트(mm:user-updated, mm:session-updated)를 수신해 로컬 저장소와 UI를 즉시 동기화한다
  - 다른 탭에서 storage 변경이 발생하면 헤더를 갱신한다
*/

import { navigate } from "../router.js";
import { logout as serverLogout } from "../auth/auth.js";

const KEY = "mm_user";
const SESSION_KEY = "mm_session";

/*
  로컬 저장소에서 유저 읽기
  - 저장 포맷이 user 객체 단일 형태라고 가정한다
*/
function readUser() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/*
  로컬 저장소에 유저 쓰기
  - user가 falsy면 삭제
*/
function writeUser(user) {
  try {
    if (!user) {
      localStorage.removeItem(KEY);
      return;
    }
    localStorage.setItem(KEY, JSON.stringify(user));
  } catch {}
}

/*
  안전한 병합
  - incoming은 전체 user 또는 부분 patch 둘 다 허용한다
*/
function mergeUser(prev, next) {
  const p = prev && typeof prev === "object" ? prev : {};
  const n = next && typeof next === "object" ? next : {};
  return { ...p, ...n };
}

/*
  헤더 닉네임 반영
*/
function applyHeaderNickname(user) {
  const nick = String(user?.nickname || "").trim() || "사용자";

  const deskNick = document.getElementById("deskNickname");
  const menuNick = document.getElementById("menuNickname");

  if (deskNick) deskNick.textContent = nick;
  if (menuNick) menuNick.textContent = nick;
}

/*
  헤더 이름 반영(해당 id가 있는 경우만)
*/
function applyHeaderName(user) {
  const name = String(user?.name || "").trim();

  const nameEl = document.getElementById("deskName");
  const menuNameEl = document.getElementById("menuName");

  if (nameEl) nameEl.textContent = name || "";
  if (menuNameEl) menuNameEl.textContent = name || "";
}

/*
  헤더 아바타 반영
  - profileImageUrl이 없으면 background-image 제거
*/
function applyHeaderAvatar(user) {
  const url = String(user?.profileImageUrl || "").trim();
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
  헤더에 유저 정보 일괄 반영
*/
function applyAll(user) {
  applyHeaderNickname(user);
  applyHeaderName(user);
  applyHeaderAvatar(user);
}

/*
  공통 로그아웃 처리
  - 서버 로그아웃은 실패해도 로컬 세션은 반드시 정리한다
*/
async function handleLogout() {
  try {
    await serverLogout();
  } finally {
    localStorage.removeItem(KEY);
    localStorage.removeItem(SESSION_KEY);
    navigate("/login");
  }
}

/*
  이벤트로 들어온 user patch를 병합하고 저장/적용
*/
function handleUserPatched(incoming) {
  const merged = mergeUser(readUser(), incoming);
  writeUser(merged);
  applyAll(merged);
}

export function initUserMenu() {
  // 최초 1회 적용
  applyAll(readUser());

  // 데스크탑 로그아웃 버튼
  const logoutBtn = document.getElementById("btnLogout");
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);

  // 모바일 메뉴 로그아웃 버튼
  const menuLogout = document.getElementById("menuLogout");
  if (menuLogout) menuLogout.addEventListener("click", handleLogout);

  /*
    유저 갱신 이벤트
    - e.detail.user: 전체 user 또는 부분 patch
  */
  window.addEventListener("mm:user-updated", (e) => {
    handleUserPatched(e?.detail?.user);
  });

  // 구 이벤트명 호환
  window.addEventListener("mm:session-updated", (e) => {
    handleUserPatched(e?.detail?.user);
  });

  /*
    같은 탭에서 localStorage 변경을 즉시 반영하고 싶을 때 사용
    - 저장/갱신은 호출자가 수행하고, 이 이벤트는 UI 동기화만 담당한다
  */
  window.addEventListener("mm:user-storage-sync", () => {
    applyAll(readUser());
  });

  /*
    다른 탭에서 storage 변경 시 반영
    - 같은 탭에서는 storage 이벤트가 발생하지 않는다
  */
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    applyAll(readUser());
  });

  return {
    // 외부에서 강제 새로고침이 필요할 때 사용
    refresh() {
      applyAll(readUser());
    },
  };
}
