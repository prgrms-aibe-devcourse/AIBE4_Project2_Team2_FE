// src/ui/userMenu.js
import { navigate } from "../router.js";
import { logout as serverLogout } from "../auth/auth.js";

const KEY = "mm_user";

function readUser() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function applyHeaderNickname(user) {
  const nick = String(user?.nickname || "").trim() || "사용자";

  const deskNick = document.getElementById("deskNickname");
  const menuNick = document.getElementById("menuNickname");

  if (deskNick) deskNick.textContent = nick;
  if (menuNick) menuNick.textContent = nick;
}

function applyHeaderName(user) {
  // 상단에 이름을 표시하는 엘리먼트가 있으면 반영
  // (지금 index.html에는 name 전용 id가 없어서, 있으면만 적용한다)
  const name = String(user?.name || "").trim();
  const nameEl = document.getElementById("deskName");
  const menuNameEl = document.getElementById("menuName");

  if (nameEl) nameEl.textContent = name || "";
  if (menuNameEl) menuNameEl.textContent = name || "";
}

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

function applyAll(user) {
  applyHeaderNickname(user);
  applyHeaderName(user);
  applyHeaderAvatar(user);
}

function mergeUser(prev, next) {
  const p = prev && typeof prev === "object" ? prev : {};
  const n = next && typeof next === "object" ? next : {};
  return { ...p, ...n };
}

function writeUser(user) {
  try {
    if (!user) {
      localStorage.removeItem(KEY);
      return;
    }
    localStorage.setItem(KEY, JSON.stringify(user));
  } catch {}
}

export function initUserMenu() {
  // 최초 1회 적용
  applyAll(readUser());

  // 상단(데스크탑) 로그아웃
  const logoutBtn = document.getElementById("btnLogout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await serverLogout();
      } finally {
        localStorage.removeItem(KEY);
        localStorage.removeItem("mm_session");
        navigate("/login");
      }
    });
  }

  // 모바일 메뉴 로그아웃(있다면)
  const menuLogout = document.getElementById("menuLogout");
  if (menuLogout) {
    menuLogout.addEventListener("click", async () => {
      try {
        await serverLogout();
      } finally {
        localStorage.removeItem(KEY);
        localStorage.removeItem("mm_session");
        navigate("/login");
      }
    });
  }

  // 마이페이지 등에서 사용자 정보 갱신 이벤트 오면 즉시 반영
  // detail.user에 "전체 user" 또는 "부분 patch" 둘 다 허용
  window.addEventListener("mm:user-updated", (e) => {
    const incoming = e?.detail?.user;
    const merged = mergeUser(readUser(), incoming);
    writeUser(merged);
    applyAll(merged);
  });

  // 이전 이벤트 이름도 호환 유지
  window.addEventListener("mm:session-updated", (e) => {
    const incoming = e?.detail?.user;
    const merged = mergeUser(readUser(), incoming);
    writeUser(merged);
    applyAll(merged);
  });

  // 같은 탭에서 localStorage가 바뀌어도 즉시 반영되게 커스텀 이벤트 지원
  window.addEventListener("mm:user-storage-sync", () => {
    applyAll(readUser());
  });

  // 다른 탭에서 storage 바뀌면 반영
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    applyAll(readUser());
  });

  return {
    refresh() {
      applyAll(readUser());
    },
  };
}
