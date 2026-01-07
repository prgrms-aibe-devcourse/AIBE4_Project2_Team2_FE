import { navigate } from "../router.js";

export function renderOAuthCallback(root) {
  const wrap = document.createElement("div");
  wrap.className = "auth-wrap";

  wrap.innerHTML = `
    <div class="auth-card card">
      <div class="auth-brand">
        <div class="brand-mark">MM</div>
        <div class="auth-title">로그인 처리중...</div>
      </div>
      <p class="auth-desc">잠시만 기다려주세요</p>
    </div>
  `;

  root.appendChild(wrap);

  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get("accessToken");
  const tokenType = params.get("tokenType");
  const expiresIn = params.get("expiresIn");
  const error = params.get("error");

  if (error) {
    alert("소셜 로그인 실패: " + error);
    window.location.replace("/login");
    return;
  }

  if (!accessToken) {
    alert("소셜 로그인 토큰을 받지 못했습니다");
    window.location.replace("/login");
    return;
  }

  const session = {
    accessToken,
    tokenType: tokenType || "Bearer",
    expiresIn: expiresIn ? Number(expiresIn) : null,
    tokenUpdatedAt: Date.now(),
  };

  localStorage.setItem("mm_session", JSON.stringify(session));

  /**
   * ★ 핵심 수정
   * OAuth 콜백에서는 navigate() 금지
   * → query/hash 완전히 제거한 뒤 새로 진입
   */
  window.location.replace("/");
}
