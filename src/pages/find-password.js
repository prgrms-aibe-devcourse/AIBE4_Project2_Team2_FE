import { navigate } from "../router.js";
import { api, ApiError } from "../services/api.js";

export function renderFindPassword(root) {
  const wrap = document.createElement("div");
  wrap.className = "auth-wrap";

  wrap.innerHTML = `
    <div class="auth-card card">
      <div class="auth-brand">
        <div class="brand-mark">MM</div>
        <div class="auth-title">비밀번호 찾기</div>
      </div>

      <p class="auth-desc">아이디와 이메일로 인증하면 비밀번호를 재설정할 수 있습니다</p>

      <form class="auth-form" id="findPasswordForm">
        <div class="auth-row">
          <label class="auth-label">아이디</label>
          <input class="auth-input" id="usernameInput" type="text" required />
        </div>

        <div class="auth-row">
          <label class="auth-label">이메일</label>
          <div class="auth-row-inline">
            <div class="auth-input-wrapper">
              <input class="auth-input" id="emailInput" type="email" required />
            </div>
            <button type="button" class="auth-btn-secondary" id="sendVerificationBtn">인증 코드 발송</button>
          </div>
          <div id="emailStatus" class="auth-verification-status"></div>
        </div>

        <div class="auth-row" id="verificationCodeRow" style="display: none;">
          <label class="auth-label">인증 코드</label>
          <div class="auth-row-inline">
            <div class="auth-input-wrapper">
              <input class="auth-input" id="verificationCodeInput" type="text" maxlength="6" placeholder="6자리 코드 입력" />
            </div>
            <button type="button" class="auth-btn-secondary" id="verifyCodeBtn">확인</button>
          </div>
          <div id="verificationStatus" class="auth-verification-status"></div>
        </div>

        <div id="passwordResetSection" style="display: none;">
          <div class="auth-row">
            <label class="auth-label">새 비밀번호</label>
            <input class="auth-input" id="newPasswordInput" type="password" placeholder="8자 이상" />
          </div>

          <div class="auth-row">
            <label class="auth-label">새 비밀번호 확인</label>
            <input class="auth-input" id="newPasswordConfirmInput" type="password" placeholder="8자 이상" />
          </div>

          <button class="auth-primary" type="button" id="resetPasswordBtn">비밀번호 변경</button>
        </div>

        <button class="auth-ghost" type="button" id="toLogin" style="margin-top: 8px;">로그인으로</button>
      </form>
    </div>
  `;

  root.appendChild(wrap);

  const usernameInput = wrap.querySelector("#usernameInput");
  const emailInput = wrap.querySelector("#emailInput");
  const sendVerificationBtn = wrap.querySelector("#sendVerificationBtn");
  const emailStatus = wrap.querySelector("#emailStatus");
  const verificationCodeRow = wrap.querySelector("#verificationCodeRow");
  const verificationCodeInput = wrap.querySelector("#verificationCodeInput");
  const verifyCodeBtn = wrap.querySelector("#verifyCodeBtn");
  const verificationStatus = wrap.querySelector("#verificationStatus");
  const passwordResetSection = wrap.querySelector("#passwordResetSection");
  const newPasswordInput = wrap.querySelector("#newPasswordInput");
  const newPasswordConfirmInput = wrap.querySelector("#newPasswordConfirmInput");
  const resetPasswordBtn = wrap.querySelector("#resetPasswordBtn");
  const toLogin = wrap.querySelector("#toLogin");

  let isEmailVerified = false;

  // 이메일 인증 코드 발송
  sendVerificationBtn.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();

    if (!username) {
      emailStatus.textContent = "아이디를 입력해주세요";
      emailStatus.className = "auth-verification-status error";
      return;
    }

    if (!email) {
      emailStatus.textContent = "이메일을 입력해주세요";
      emailStatus.className = "auth-verification-status error";
      return;
    }

    sendVerificationBtn.disabled = true;
    emailStatus.textContent = "확인 중...";
    emailStatus.className = "auth-verification-status";

    try {
      // 먼저 해당 계정이 소셜 로그인 계정인지 확인
      const checkResult = await api.post("/auth/check-provider", {
        username,
        email
      });

      if (checkResult.success && checkResult.data?.provider && checkResult.data.provider !== "LOCAL") {
        // 소셜 로그인 계정
        const providerNames = {
          GOOGLE: "Google",
          GITHUB: "GitHub",
          KAKAO: "Kakao"
        };
        const providerName = providerNames[checkResult.data.provider] || checkResult.data.provider;

        emailStatus.textContent = `${providerName} 소셜 로그인 계정입니다. 소셜 로그인을 사용해주세요.`;
        emailStatus.className = "auth-verification-status error";
        sendVerificationBtn.disabled = false;
        return;
      }

      // 일반 계정이면 인증 코드 발송
      const result = await api.post("/auth/email/send", {
        email,
        type: "RESET_PASSWORD"
      });

      if (result.success) {
        emailStatus.textContent = "인증 코드가 발송되었습니다";
        emailStatus.className = "auth-verification-status success";
        verificationCodeRow.style.display = "flex";
        sendVerificationBtn.textContent = "재발송";
      } else {
        emailStatus.textContent = result.message || "발송 실패";
        emailStatus.className = "auth-verification-status error";
      }
    } catch (error) {
      console.error("이메일 발송 에러:", error);

      let errorMessage = "서버 오류";
      if (error instanceof ApiError) {
        errorMessage = error.data?.error?.message || error.data?.message || error.message;
      }
      emailStatus.textContent = errorMessage;
      emailStatus.className = "auth-verification-status error";
    } finally {
      sendVerificationBtn.disabled = false;
    }
  });

  // 이메일 인증 코드 확인
  verifyCodeBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const code = verificationCodeInput.value.trim();

    if (!code) {
      verificationStatus.textContent = "인증 코드를 입력해주세요";
      verificationStatus.className = "auth-verification-status error";
      return;
    }

    verifyCodeBtn.disabled = true;
    verificationStatus.textContent = "확인 중...";
    verificationStatus.className = "auth-verification-status";

    try {
      const result = await api.post("/auth/email/verify", {
        email,
        code,
        type: "RESET_PASSWORD"
      });

      if (result.success) {
        verificationStatus.textContent = "✓ 인증 완료";
        verificationStatus.className = "auth-verification-status success";
        isEmailVerified = true;

        usernameInput.readOnly = true;
        usernameInput.style.backgroundColor = "#f5f5f5";
        emailInput.readOnly = true;
        emailInput.style.backgroundColor = "#f5f5f5";
        sendVerificationBtn.disabled = true;
        verificationCodeInput.readOnly = true;
        verificationCodeInput.style.backgroundColor = "#f5f5f5";
        verifyCodeBtn.disabled = true;

        passwordResetSection.style.display = "block";
      } else {
        verificationStatus.textContent = result.message || "인증 실패";
        verificationStatus.className = "auth-verification-status error";
      }
    } catch (error) {
      console.error("인증 코드 확인 에러:", error);

      let errorMessage = "서버 오류";
      if (error instanceof ApiError) {
        errorMessage = error.data?.error?.message || error.data?.message || error.message;
      }
      verificationStatus.textContent = errorMessage;
      verificationStatus.className = "auth-verification-status error";
    } finally {
      if (!isEmailVerified) {
        verifyCodeBtn.disabled = false;
      }
    }
  });

  // 비밀번호 재설정
  resetPasswordBtn.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const code = verificationCodeInput.value.trim();
    const newPassword = newPasswordInput.value;
    const newPasswordConfirm = newPasswordConfirmInput.value;

    if (!isEmailVerified) {
      alert("이메일 인증을 완료해주세요");
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      alert("비밀번호는 8자 이상이어야 합니다");
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      alert("비밀번호 확인이 일치하지 않습니다");
      return;
    }

    resetPasswordBtn.disabled = true;
    resetPasswordBtn.textContent = "변경 중...";

    try {
      const result = await api.post("/auth/reset-password", {
        username,
        email,
        code,
        newPassword
      });

      if (result.success) {
        alert("비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.");
        navigate("/login");
      } else {
        alert(result.message || "비밀번호 변경 실패");
        resetPasswordBtn.disabled = false;
        resetPasswordBtn.textContent = "비밀번호 변경";
      }
    } catch (error) {
      console.error("비밀번호 변경 에러:", error);

      let errorMessage = "서버 오류";
      if (error instanceof ApiError) {
        errorMessage = error.data?.error?.message || error.data?.message || error.message;
      }
      alert(errorMessage);
      resetPasswordBtn.disabled = false;
      resetPasswordBtn.textContent = "비밀번호 변경";
    }
  });

  toLogin.addEventListener("click", () => navigate("/login"));
}
