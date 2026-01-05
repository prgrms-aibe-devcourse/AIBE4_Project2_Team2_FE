import { navigate } from "../router.js";
import { api, ApiError } from "../services/api.js";

export function renderSignup(root) {
  const wrap = document.createElement("div");
  wrap.className = "auth-wrap";

  
  wrap.innerHTML = `
    <div class="auth-card card">
      <div class="auth-brand">
        <div class="brand-mark">MM</div>
        <div class="auth-title">회원가입</div>
      </div>

      <form class="auth-form" id="signupForm">

        <div class="auth-row">
          <label class="auth-label">아이디</label>
          <input class="auth-input" name="username" required />
        </div>

        <div class="auth-row">
          <label class="auth-label">이름</label>
          <input class="auth-input" name="name" required />
        </div>

        <div class="auth-row">
          <label class="auth-label">닉네임</label>
          <input class="auth-input" name="nickname" required />
        </div>

        <div class="auth-row">
          <label class="auth-label">이메일</label>
          <input class="auth-input" name="email" type="email" required />
        </div>

        <div class="auth-row">
          <label class="auth-label">회원 유형</label>
          <select class="auth-input" name="role" required>
            <option value="">선택</option>
            <option value="STUDENT">학생</option>
            <option value="MAJOR">전공자</option>
            
          </select>
        </div>

        <div class="auth-row">
          <label class="auth-label">재학 상태</label>
          <select class="auth-input" name="status" required>
            <option value="">선택</option>
            <option value="ENROLLED">재학</option>
            <option value="GRADUATED">졸업</option>
            
            
          </select>
        </div>

        <div class="auth-row">
          <label class="auth-label">비밀번호</label>
          <input class="auth-input" name="password" type="password" required />
        </div>

        <div class="auth-row">
          <label class="auth-label">비밀번호 확인</label>
          <input class="auth-input" name="password2" type="password" required />
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);

    const username = fd.get("username")?.trim();
    const name = fd.get("name")?.trim();
    const nickname = fd.get("nickname")?.trim();
    const email = fd.get("email")?.trim();
    const role = fd.get("role");
    const status = fd.get("status");
    const password = fd.get("password");
    const password2 = fd.get("password2");

    // ✅ 프론트 최소 검증
    if (!username || !name || !nickname || !email) {
      alert("필수 항목을 모두 입력해라");
      return;
    }

    if (password.length < 8) {
      alert("비밀번호는 8자 이상이어야 한다");
      return;
    }

    if (password !== password2) {
      alert("비밀번호 확인이 일치하지 않는다");
      return;
    }

    try {
      const result = await api.post("/auth/signup", {
        username,
        password,
        name,
        nickname,
        email,
        memberType: role,
        status,
      });

      if (!result.success) {
        alert(result.message || "회원가입 실패");
        return;
      }

      alert("회원가입 완료");
      navigate("/login");
    } catch (error) {
      console.error(error);
      if (error instanceof ApiError) {
        alert(error.message);
      } else {
        alert("서버 연결 오류");
      }
    }
  });
}
