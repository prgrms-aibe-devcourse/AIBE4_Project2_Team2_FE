import { navigate } from "../router.js";
import { api, ApiError } from "../services/api.js";
import { startOverlayLoading, endOverlayLoading } from "../utils/overlay.js";

export function renderFindPassword(root) {
  const wrap = document.createElement("div");
  wrap.className = "auth-wrap";

  wrap.innerHTML = `
    <div class="auth-split">
      <!-- 좌측: 로고 영역 -->
      <div class="auth-hero">
        <div class="auth-hero-content">
          <img src="/img/logo.png" alt="MajorMate" class="auth-hero-logo" />
          <p class="auth-hero-tagline">전공자와 함께하는<br/>진로 탐색의 첫걸음</p>
        </div>
        <div class="auth-hero-decoration"></div>
      </div>

      <!-- 우측: 비밀번호 찾기 폼 -->
      <div class="auth-form-side">
        <div class="auth-card card">
          <div class="auth-header">
            <p class="auth-desc">아이디와 이메일로 인증하면<br/>비밀번호를 재설정할 수 있습니다</p>
          </div>

          <form class="auth-form" id="findPasswordForm">
            <div class="auth-row">
              <label class="auth-label">아이디</label>
              <input class="auth-input" id="usernameInput" type="text" placeholder="아이디를 입력하세요" required />
            </div>

            <div class="auth-row">
              <label class="auth-label">이메일</label>
              <div class="auth-row-inline">
                <div class="auth-input-wrapper">
                  <input class="auth-input" id="emailInput" type="email" placeholder="이메일을 입력하세요" required />
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
                <input class="auth-input" id="newPasswordInput" type="password" placeholder="영문, 숫자, 특수기호 포함 8자 이상" />
                <div id="newPasswordStatus" class="auth-verification-status"></div>
              </div>

              <div class="auth-row">
                <label class="auth-label">새 비밀번호 확인</label>
                <input class="auth-input" id="newPasswordConfirmInput" type="password" placeholder="비밀번호를 다시 입력하세요" />
                <div id="newPasswordConfirmStatus" class="auth-verification-status"></div>
              </div>

              <button class="auth-primary" type="button" id="resetPasswordBtn">비밀번호 변경</button>
            </div>

            <div class="auth-links-group">
              <div class="auth-signup-prompt">
                <span>아이디가 기억나지 않으세요?</span>
                <button class="auth-link-btn" type="button" id="toFindUsername">아이디 찾기</button>
              </div>
              <div class="auth-signup-prompt">
                <span>로그인 화면으로</span>
                <button class="auth-link-btn" type="button" id="toLogin">돌아가기</button>
              </div>
            </div>
          </form>
        </div>
      </div>
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
  const newPasswordStatus = wrap.querySelector("#newPasswordStatus");
  const newPasswordConfirmStatus = wrap.querySelector("#newPasswordConfirmStatus");
  const resetPasswordBtn = wrap.querySelector("#resetPasswordBtn");
  const toLogin = wrap.querySelector("#toLogin");
  const toFindUsername = wrap.querySelector("#toFindUsername");

  let isEmailVerified = false;

  // 비밀번호 검증 함수
  function validatePassword(password) {
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const isLengthValid = password.length >= 8 && password.length <= 20;

    return {
      valid: isLengthValid && hasLetter && hasNumber && hasSpecial,
      hasLetter,
      hasNumber,
      hasSpecial,
      isLengthValid,
    };
  }

  // 비밀번호 확인 검증 함수
  function validatePasswordConfirm() {
    const password = newPasswordInput.value;
    const passwordConfirm = newPasswordConfirmInput.value;

    if (!passwordConfirm) {
      newPasswordConfirmStatus.textContent = "";
      newPasswordConfirmStatus.className = "auth-verification-status";
      return;
    }

    if (password === passwordConfirm) {
      newPasswordConfirmStatus.textContent = "✓ 비밀번호가 일치합니다";
      newPasswordConfirmStatus.className = "auth-verification-status success";
    } else {
      newPasswordConfirmStatus.textContent = "비밀번호가 일치하지 않습니다";
      newPasswordConfirmStatus.className = "auth-verification-status error";
    }
  }

  // 실시간 새 비밀번호 검증
  newPasswordInput.addEventListener("input", (e) => {
    const password = e.target.value;
    const validation = validatePassword(password);

    if (!password) {
      newPasswordStatus.textContent = "";
      newPasswordStatus.className = "auth-verification-status";
      return;
    }

    if (validation.valid) {
      newPasswordStatus.textContent = "✓ 사용 가능한 비밀번호입니다";
      newPasswordStatus.className = "auth-verification-status success";
    } else {
      const errors = [];
      if (!validation.isLengthValid) errors.push("8자 이상 20자 이하");
      if (!validation.hasLetter) errors.push("영문자");
      if (!validation.hasNumber) errors.push("숫자");
      if (!validation.hasSpecial) errors.push("특수기호");

      newPasswordStatus.textContent = `필요: ${errors.join(", ")}`;
      newPasswordStatus.className = "auth-verification-status error";
    }

    // 비밀번호 확인 필드도 체크
    if (newPasswordConfirmInput.value) {
      validatePasswordConfirm();
    }
  });

  // 실시간 비밀번호 확인 검증
  newPasswordConfirmInput.addEventListener("input", validatePasswordConfirm);

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

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      alert("비밀번호는 영문자, 숫자, 특수기호를 포함해 8자 이상 20자 이하이어야 합니다");
      newPasswordInput.focus();
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      alert("비밀번호 확인이 일치하지 않습니다");
      return;
    }

    resetPasswordBtn.disabled = true;
    startOverlayLoading({ text: "비밀번호 변경 중..." });

    try {
      const result = await api.post("/auth/reset-password", {
        username,
        email,
        code,
        newPassword
      });

      endOverlayLoading();

      if (result.success) {
        alert("비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.");
        navigate("/login");
      } else {
        alert(result.message || "비밀번호 변경 실패");
        resetPasswordBtn.disabled = false;
      }
    } catch (error) {
      endOverlayLoading();
      console.error("비밀번호 변경 에러:", error);

      let errorMessage = "서버 오류";
      if (error instanceof ApiError) {
        errorMessage = error.data?.error?.message || error.data?.message || error.message;
      }
      alert(errorMessage);
      resetPasswordBtn.disabled = false;
    }
  });

  toLogin.addEventListener("click", () => navigate("/login"));
  toFindUsername.addEventListener("click", () => navigate("/find-username"));
}