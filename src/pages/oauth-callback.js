import { navigate } from "../router.js";
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
    alert("소셜 로그인 실패: " + error);
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
