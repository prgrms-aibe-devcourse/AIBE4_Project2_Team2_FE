import { navigate } from "../router.js";

const KEY = "mm_user";

function getSession() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    return { user };
  } catch {
    return null;
  }
}

function getNicknameFromSession() {
  const s = getSession();
  const nickname = s?.user?.nickname;
  return String(nickname || "").trim();
}

export function initUserMenu() {
  const btn = document.getElementById("userMenuBtn");
  const menu = document.getElementById("userMenu");
  const logoutBtn = document.getElementById("logoutBtn");
  const menuNick = document.getElementById("userMenuNickname");
  const headerNick = document.getElementById("headerNickname");

  if (!btn || !menu) return;

  const mq = window.matchMedia("(max-width: 720px)");

  function setNickname(nickname) {
    const safe = String(nickname || "").trim() || "사용자";
    if (headerNick) headerNick.textContent = safe;
    if (menuNick) menuNick.textContent = safe;
  }

  function openMenu() {
    menu.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    menu.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  }

  function toggleMenu() {
    if (!mq.matches) return;
    if (menu.classList.contains("open")) closeMenu();
    else openMenu();
  }

  function syncForViewport() {
    if (mq.matches) {
      btn.disabled = false;
      btn.classList.remove("avatar-btn--disabled");
      btn.setAttribute("aria-haspopup", "menu");
      btn.setAttribute("aria-expanded", "false");
    } else {
      closeMenu();
      btn.disabled = true;
      btn.classList.add("avatar-btn--disabled");
      btn.removeAttribute("aria-haspopup");
      btn.removeAttribute("aria-expanded");
    }
  }

  btn.addEventListener("click", (e) => {
    if (!mq.matches) return;
    e.preventDefault();
    e.stopPropagation();
    toggleMenu();
  });

  document.addEventListener("click", (e) => {
    if (!mq.matches) return;
    const t = e.target;
    if (btn.contains(t) || menu.contains(t)) return;
    closeMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (!mq.matches) return;
    if (e.key === "Escape") closeMenu();
  });

  window.addEventListener("hashchange", () => closeMenu());

  menu.addEventListener("click", (e) => {
    const item = e.target.closest("[data-action]");
    if (!item) return;

    const action = item.getAttribute("data-action");
    closeMenu();

    if (action === "mypage") {
      navigate("/mypage");
      return;
    }

    if (action === "logout") {
      doLogout();
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => doLogout());
  }

  function doLogout() {
    localStorage.removeItem(KEY);
    // 혹시 남아있을 수 있는 기존 키도 제거
    localStorage.removeItem("mm_session");
    alert("로그아웃되었습니다.");
    navigate("/login");
  }

  // 1) 최초 진입 시 세션 기반 닉네임 적용
  mq.addEventListener("change", syncForViewport);
  syncForViewport();
  setNickname(getNicknameFromSession());

  // 2) 마이페이지 등에서 세션 갱신 이벤트가 오면 즉시 반영
  window.addEventListener("mm:session-updated", (e) => {
    const nick = e?.detail?.user?.nickname;
    setNickname(String(nick || "").trim() || getNicknameFromSession() || "사용자");
  });

  // 3) 다른 탭에서 localStorage가 바뀌는 경우도 반영
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    setNickname(getNicknameFromSession());
  });

  return { setNickname, closeMenu };
}
