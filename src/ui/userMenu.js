import { navigate } from "../router.js";

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
    alert("로그아웃 처리 위치다.");
  }

  mq.addEventListener("change", syncForViewport);
  syncForViewport();
  setNickname("공감학생");

  return { setNickname, closeMenu };
}
