import { navigate } from "../router.js";
import { api, ApiError } from "../services/api.js";

export function renderFindUsername(root) {
  const wrap = document.createElement("div");
  wrap.className = "auth-wrap";

  wrap.innerHTML = `
    <div class="auth-card card">
      <div class="auth-brand">
        <div class="brand-mark">MM</div>
        <div class="auth-title">아이디 찾기</div>
      </div>

      <p class="auth-desc">가입 시 등록한 이메일로 인증하면 아이디를 확인할 수 있습니다</p>

      <form class="auth-form" id="findUsernameForm">
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

        <div id="usernameResult" class="auth-row" style="display: none;">
          <div style="padding: 16px; background: rgba(212, 244, 167, 0.2); border-radius: 10px; border: 1px solid var(--pastel-green);">
            <p style="margin: 0 0 8px; font-size: 12px; color: var(--muted);">회원님의 아이디</p>
            <p id="usernameText" style="margin: 0; font-size: 16px; font-weight: 800; color: var(--dark-text);"></p>
          </div>
        </div>

        <button class="auth-primary" type="button" id="toLogin">로그인으로</button>
        <button class="auth-ghost" type="button" id="toFindPassword">비밀번호 찾기</button>
      </form>
    </div>
  `;

  root.appendChild(wrap);

  const emailInput = wrap.querySelector("#emailInput");
  const sendVerificationBtn = wrap.querySelector("#sendVerificationBtn");
  const emailStatus = wrap.querySelector("#emailStatus");
  const verificationCodeRow = wrap.querySelector("#verificationCodeRow");
  const verificationCodeInput = wrap.querySelector("#verificationCodeInput");
  const verifyCodeBtn = wrap.querySelector("#verifyCodeBtn");
  const verificationStatus = wrap.querySelector("#verificationStatus");
  const usernameResult = wrap.querySelector("#usernameResult");
  const usernameText = wrap.querySelector("#usernameText");
  const toLogin = wrap.querySelector("#toLogin");
  const toFindPassword = wrap.querySelector("#toFindPassword");

  // 이메일 인증 코드 발송
  sendVerificationBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    if (!email) {
      emailStatus.textContent = "이메일을 입력해주세요";
      emailStatus.className = "auth-verification-status error";
      return;
    }

    sendVerificationBtn.disabled = true;
    emailStatus.textContent = "발송 중...";
    emailStatus.className = "auth-verification-status";

    try {
      const result = await api.post("/auth/email/send", {
        email,
        type: "FIND_USERNAME"
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

  // 이메일 인증 코드 확인 및 아이디 찾기
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
      // 먼저 인증 코드 확인
      const verifyResult = await api.post("/auth/email/verify", {
        email,
        code,
        type: "FIND_USERNAME"
      });

      if (!verifyResult.success) {
        verificationStatus.textContent = verifyResult.message || "인증 실패";
        verificationStatus.className = "auth-verification-status error";
        verifyCodeBtn.disabled = false;
        return;
      }

      // 인증 성공 후 아이디 찾기
      const findResult = await api.post("/auth/find-username", {
        email,
        code
      });

      if (findResult.success && findResult.data) {
        verificationStatus.textContent = "✓ 인증 완료";
        verificationStatus.className = "auth-verification-status success";

        // 소셜 로그인 사용자 처리
        const { username, provider } = findResult.data;

        if (provider && provider !== "LOCAL") {
          // 소셜 로그인 사용자
          const providerNames = {
            GOOGLE: "Google",
            GITHUB: "GitHub",
            KAKAO: "Kakao"
          };
          const providerName = providerNames[provider] || provider;

          usernameText.innerHTML = `
            <div style="text-align: center;">
              <p style="margin: 0 0 8px; font-size: 14px; color: var(--text);">소셜 로그인으로 가입된 계정입니다</p>
              <p style="margin: 0; font-size: 16px; font-weight: 800; color: var(--pastel-green-strong);">${providerName} 로그인을 사용해주세요</p>
            </div>
          `;
        } else {
          // 일반 로그인 사용자
          usernameText.textContent = username;
        }

        usernameResult.style.display = "flex";

        emailInput.readOnly = true;
        emailInput.style.backgroundColor = "#f5f5f5";
        sendVerificationBtn.disabled = true;
        verificationCodeInput.readOnly = true;
        verificationCodeInput.style.backgroundColor = "#f5f5f5";
        verifyCodeBtn.disabled = true;
      } else {
        verificationStatus.textContent = "아이디를 찾을 수 없습니다";
        verificationStatus.className = "auth-verification-status error";
        verifyCodeBtn.disabled = false;
      }
    } catch (error) {
      console.error("아이디 찾기 에러:", error);

      let errorMessage = "서버 오류";
      if (error instanceof ApiError) {
        errorMessage = error.data?.error?.message || error.data?.message || error.message;
      }
      verificationStatus.textContent = errorMessage;
      verificationStatus.className = "auth-verification-status error";
      verifyCodeBtn.disabled = false;
    }
  });

  toLogin.addEventListener("click", () => navigate("/login"));
  toFindPassword.addEventListener("click", () => navigate("/find-password"));
}
