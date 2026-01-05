import { navigate } from "../router.js";
import { isLoggedIn, login } from "../auth/auth.js";

export function renderLogin(root) {
  if (isLoggedIn()) {
    navigate("/");
    return;
  }

  const wrap = document.createElement("div");
  wrap.className = "auth-wrap";

  wrap.innerHTML = `
    <div class="auth-card card">
      <div class="auth-brand">
        <div class="brand-mark" aria-hidden="true">MM</div>
        <div class="auth-title">MajorMate</div>
      </div>

      <p class="auth-desc">로그인하지 않으면 접속할 수 없다</p>

      <form class="auth-form" id="loginForm">
        <div class="auth-row">
          <label class="auth-label" for="login-userId">아이디</label>
          <input class="auth-input" id="login-userId" name="userId" autocomplete="username" required />
        </div>

        <div class="auth-row">
          <label class="auth-label" for="login-password">비밀번호</label>
          <input class="auth-input" id="login-password" name="password" type="password" autocomplete="current-password" required />
        </div>

        <button class="auth-primary" type="submit">로그인</button>
        <button class="auth-ghost" type="button" id="toSignup">회원가입</button>

        <p class="auth-hint">테스트 계정: student123 / password123</p>
        <p class="auth-hint">매니저 계정: manager / adminpass</p>
      </form>
    </div>
  `;

  root.appendChild(wrap);

  const form = wrap.querySelector("#loginForm");
  const toSignup = wrap.querySelector("#toSignup");

  toSignup.addEventListener("click", () => navigate("/signup"));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);

    const res = login({
      userId: String(fd.get("userId") || "").trim(),
      password: String(fd.get("password") || ""),
    });

    if (!res.ok) {
      alert(res.message || "로그인에 실패했다");
      return;
    }

    navigate("/");
  });
}
