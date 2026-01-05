import { navigate } from "../router.js";
import { isLoggedIn, signup, login } from "../auth/auth.js";

export function renderSignup(root) {
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
        <div class="auth-title">회원가입</div>
      </div>

      <form class="auth-form" id="signupForm">
        <div class="auth-row">
          <label class="auth-label" for="su-userId">아이디</label>
          <input class="auth-input" id="su-userId" name="userId" autocomplete="username" required />
        </div>

        <div class="auth-row">
          <label class="auth-label" for="su-nickname">닉네임</label>
          <input class="auth-input" id="su-nickname" name="nickname" required />
        </div>

        <div class="auth-row">
          <label class="auth-label" for="su-major">소속/전공</label>
          <input class="auth-input" id="su-major" name="major" placeholder="예: 고려대생" required />
        </div>

        <div class="auth-row">
          <label class="auth-label" for="su-password">비밀번호</label>
          <input class="auth-input" id="su-password" name="password" type="password" autocomplete="new-password" required />
        </div>

        <div class="auth-row">
          <label class="auth-label" for="su-password2">비밀번호 확인</label>
          <input class="auth-input" id="su-password2" name="password2" type="password" autocomplete="new-password" required />
        </div>

        <button class="auth-primary" type="submit">가입하기</button>
        <button class="auth-ghost" type="button" id="toLogin">로그인으로</button>
      </form>
    </div>
  `;

  root.appendChild(wrap);

  const form = wrap.querySelector("#signupForm");
  const toLogin = wrap.querySelector("#toLogin");

  toLogin.addEventListener("click", () => navigate("/login"));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);

    const userId = String(fd.get("userId") || "").trim();
    const nickname = String(fd.get("nickname") || "").trim();
    const major = String(fd.get("major") || "").trim();
    const pw = String(fd.get("password") || "");
    const pw2 = String(fd.get("password2") || "");

    if (pw !== pw2) {
      alert("비밀번호 확인이 일치하지 않는다");
      return;
    }

    const res = signup({ userId, password: pw, nickname, major });
    if (!res.ok) {
      alert(res.message || "회원가입에 실패했다");
      return;
    }

    const loginRes = login({ userId, password: pw });
    if (!loginRes.ok) {
      navigate("/login");
      return;
    }

    navigate("/");
  });
}
