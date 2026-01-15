import { api } from "../services/api.js";

export async function renderOAuthCallback(root) {
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
  const error = params.get("error");

  if (error) {
    // 에러 타입별 메시지 매핑
    const errorMessages = {
      email_already_registered:
        "이미 가입된 이메일입니다. 로컬 계정으로 로그인해주세요.",
      email_not_found: "이메일 정보를 가져올 수 없습니다.",
      unsupported_provider: "지원하지 않는 소셜 로그인입니다.",
      username_generation_failed: "계정 생성 중 오류가 발생했습니다.",
      nickname_generation_failed: "닉네임 생성 중 오류가 발생했습니다.",
    };

    const errorMessage = errorMessages[error] || "로그인에 실패했습니다.";
    alert(errorMessage);
    window.location.replace("/login");
    return;
  }

  // 쿠키 기반 인증: 서버가 이미 쿠키를 설정했으므로 토큰 파라미터 불필요
  // 사용자 정보만 조회하여 저장
  try {
    const userInfo = await api.get("/members/me");

    if (userInfo?.success && userInfo?.data) {
      const user = {
        memberId: userInfo.data.memberId ?? "",
        name: userInfo.data.name ?? "",
        nickname: userInfo.data.nickname ?? "",
        email: userInfo.data.email ?? "",
        username: userInfo.data.username ?? "",
        profileImageUrl: userInfo.data.profileImageUrl ?? "",
        status: userInfo.data.status ?? "",
        university: userInfo.data.university ?? "",
        major: userInfo.data.major ?? "",
        role: userInfo.data.role ?? "",
      };

      localStorage.setItem("mm_user", JSON.stringify(user));
    } else {
      alert("사용자 정보 조회 실패");
      window.location.replace("/login");
      return;
    }
  } catch (error) {
    console.error("사용자 정보 조회 실패:", error);
    alert("사용자 정보 조회 실패");
    window.location.replace("/login");
    return;
  }

  /**
   * ★ 핵심 수정
   * OAuth 콜백에서는 navigate() 금지
   * → query/hash 완전히 제거한 뒤 새로 진입
   */
  window.location.replace("/");
}
