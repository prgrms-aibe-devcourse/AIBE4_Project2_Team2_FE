import { api, ApiError } from "../services/api.js";

const KEY = "mm_user";

// 기존 mm_session 제거 (마이그레이션)
if (localStorage.getItem("mm_session")) {
  console.log("🧹 기존 mm_session 제거 중...");
  localStorage.removeItem("mm_session");
}

export function getSession() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    // 쿠키 기반이므로 user 정보만 반환
    return { user };
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  const s = getSession();
  return Boolean(s && s.user);
}

export async function login({ username, password }) {
  try {
    console.log("🔐 로그인 시도:", username);
    const result = await api.post("/auth/login", { username, password });
    console.log("✅ 로그인 응답:", result);

    if (!result?.success) {
      console.error("❌ 로그인 실패:", result);
      return { ok: false, message: result?.message || "로그인 실패" };
    }

    // 쿠키 기반 인증: 토큰은 서버가 쿠키로 설정하므로 저장 불필요
    // 사용자 정보만 조회하여 저장
    try {
      console.log("👤 사용자 정보 조회 시작");
      const userInfo = await api.get("/members/me");
      console.log("✅ 사용자 정보 응답:", userInfo);

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

        localStorage.setItem(KEY, JSON.stringify(user));
        console.log("✅ 사용자 정보 저장 완료:", user);
        return { ok: true, user };
      } else {
        console.error("❌ 사용자 정보 형식 오류:", userInfo);
        return { ok: false, message: "사용자 정보 조회 실패" };
      }
    } catch (error) {
      console.error("❌ 사용자 정보 조회 실패:", error);
      if (error instanceof ApiError) {
        console.error("  - Status:", error.status);
        console.error("  - Data:", error.data);
        console.error("  - Message:", error.message);
        return { ok: false, message: error.data?.message || error.message || "사용자 정보 조회 실패" };
      }
      return { ok: false, message: "사용자 정보 조회 실패" };
    }
  } catch (error) {
    console.error("❌ 로그인 오류:", error);
    if (error instanceof ApiError) {
      console.error("  - Status:", error.status);
      console.error("  - Data:", error.data);
      // 백엔드의 상세 에러 메시지 추출
      const errorMessage = error.data?.error?.message || error.data?.message || error.message;
      return { ok: false, message: errorMessage };
    }
    return { ok: false, message: "서버 연결 오류" };
  }
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    console.error("로그아웃 API 호출 실패:", error);
  } finally {
    localStorage.removeItem(KEY);
    // 혹시 남아있을 수 있는 기존 키도 제거
    localStorage.removeItem("mm_session");
  }
}