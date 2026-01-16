import { navigate } from "../router.js";
import { isLoggedIn, login } from "../auth/auth.js";
import { startOverlayLoading, endOverlayLoading } from "../utils/overlay.js";

function enableAuthPageMode(root) {
  const page = root.closest(".page");
  if (page) page.classList.add("page--auth");
  return () => {
    if (page) page.classList.remove("page--auth");
  };
}

export function renderLogin(root) {
  if (isLoggedIn()) {
    navigate("/");
    return;
  }

  const cleanupAuthMode = enableAuthPageMode(root);
  const logoSrc = `${import.meta.env.BASE_URL}img/logo.png`;

  const wrap = document.createElement("div");
  wrap.className = "auth-wrap";

  wrap.innerHTML = `
    <div class="auth-split">
      <div class="auth-hero">
        <div class="auth-hero-content">
          <img src="${logoSrc}" alt="MajorMate" class="auth-hero-logo" />
          <p class="auth-hero-tagline">전공자와 함께하는<br/>진로 탐색의 첫걸음</p>
        </div>
        <div class="auth-hero-decoration"></div>
      </div>

      <div class="auth-form-side">
        <div class="auth-card card">
          <div class="auth-header">
            <p class="auth-desc">MajorMate에 오신 것을 환영합니다</p>
          </div>

          <form class="auth-form" id="loginForm">
            <div class="auth-row">
              <label class="auth-label" for="login-username">아이디</label>
              <input class="auth-input" id="login-username" name="username" type="text" autocomplete="username" placeholder="아이디를 입력하세요" required />
            </div>

            <div class="auth-row">
              <label class="auth-label" for="login-password">비밀번호</label>
              <input class="auth-input" id="login-password" name="password" type="password" autocomplete="current-password" placeholder="비밀번호를 입력하세요" required />
            </div>

            <button class="auth-primary" type="submit">로그인</button>

            <div class="auth-links">
              <a href="#" id="toFindUsername">아이디 찾기</a>
              <span class="auth-link-divider">|</span>
              <a href="#" id="toFindPassword">비밀번호 찾기</a>
            </div>

            <div class="auth-divider">또는</div>

            <div class="auth-social-buttons">
              <button type="button" class="auth-social-btn google" id="googleLogin" title="Google로 로그인">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path d="M15.68 8.18182C15.68 7.61455 15.6291 7.06909 15.5345 6.54545H8V9.64364H12.3055C12.1164 10.64 11.5491 11.4836 10.6982 12.0509V14.0655H13.2945C14.8073 12.6691 15.68 10.6182 15.68 8.18182Z" fill="#4285F4"/>
                  <path d="M8 16C10.16 16 11.9709 15.2873 13.2945 14.0655L10.6982 12.0509C9.98545 12.5309 9.07636 12.8218 8 12.8218C5.92 12.8218 4.15273 11.4182 3.52 9.52H0.858182V11.5927C2.17455 14.2036 4.87273 16 8 16Z" fill="#34A853"/>
                  <path d="M3.52 9.52C3.36 9.04 3.27273 8.52727 3.27273 8C3.27273 7.47273 3.36 6.96 3.52 6.48V4.40727H0.858182C0.312727 5.49091 0 6.70909 0 8C0 9.29091 0.312727 10.5091 0.858182 11.5927L3.52 9.52Z" fill="#FBBC05"/>
                  <path d="M8 3.17818C9.17818 3.17818 10.2255 3.58545 11.0582 4.37818L13.3527 2.08364C11.9673 0.792727 10.1564 0 8 0C4.87273 0 2.17455 1.79636 0.858182 4.40727L3.52 6.48C4.15273 4.58182 5.92 3.17818 8 3.17818Z" fill="#EA4335"/>
                </svg>
              </button>

              <button type="button" class="auth-social-btn github" id="githubLogin" title="GitHub로 로그인">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
              </button>

              <button type="button" class="auth-social-btn kakao" id="kakaoLogin" title="Kakao로 로그인">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path d="M8 0C3.58 0 0 2.91 0 6.5C0 8.74 1.23 10.71 3.13 11.89L2.38 14.84C2.32 15.06 2.53 15.25 2.73 15.14L6.29 13.03C6.85 13.12 7.42 13.17 8 13.17C12.42 13.17 16 10.26 16 6.67C16 3.08 12.42 0 8 0Z" fill="#3c1e1e"/>
                </svg>
              </button>
            </div>

            <div class="auth-signup-prompt">
              <span>아직 계정이 없으신가요?</span>
              <button class="auth-link-btn" type="button" id="toSignup">회원가입</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  root.appendChild(wrap);

  const form = wrap.querySelector("#loginForm");
  const toSignup = wrap.querySelector("#toSignup");
  const toFindUsername = wrap.querySelector("#toFindUsername");
  const toFindPassword = wrap.querySelector("#toFindPassword");
  const googleLoginBtn = wrap.querySelector("#googleLogin");
  const githubLoginBtn = wrap.querySelector("#githubLogin");
  const kakaoLoginBtn = wrap.querySelector("#kakaoLogin");

  const leave = (path) => {
    cleanupAuthMode();
    navigate(path);
  };

  toSignup.addEventListener("click", () => leave("/signup"));
  toFindUsername.addEventListener("click", (e) => {
    e.preventDefault();
    leave("/find-username");
  });
  toFindPassword.addEventListener("click", (e) => {
    e.preventDefault();
    leave("/find-password");
  });

  googleLoginBtn.addEventListener("click", () => {
    startOverlayLoading({ text: "Google 로그인 중..." });
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
    const backendUrl = apiBaseUrl.replace(/\/api$/, "");
    window.location.href = `${backendUrl}/oauth2/authorization/google`;
  });

  githubLoginBtn.addEventListener("click", () => {
    startOverlayLoading({ text: "GitHub 로그인 중..." });
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
    const backendUrl = apiBaseUrl.replace(/\/api$/, "");
    window.location.href = `${backendUrl}/oauth2/authorization/github`;
  });

  kakaoLoginBtn.addEventListener("click", () => {
    startOverlayLoading({ text: "Kakao 로그인 중..." });
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
    const backendUrl = apiBaseUrl.replace(/\/api$/, "");
    window.location.href = `${backendUrl}/oauth2/authorization/kakao`;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);

    startOverlayLoading({ text: "로그인 중..." });

    const res = await login({
      username: String(fd.get("username") || "").trim(),
      password: String(fd.get("password") || ""),
    });

    endOverlayLoading();

    if (!res.ok) {
      alert(res.message || "로그인에 실패했습니다");
      return;
    }

    cleanupAuthMode();
    navigate("/");
  });
}
