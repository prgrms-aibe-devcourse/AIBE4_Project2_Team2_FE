import { api, ApiError } from "../services/api.js";

const KEY = "mm_session";

export function getSession() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  const s = getSession();
  return Boolean(s && s.accessToken);
}

export async function login({ username, password }) {
  try {
    const result = await api.post("/auth/login", { username, password });

    if (!result.success) {
      return { ok: false, message: result.message || "로그인 실패" };
    }

    const session = {
      accessToken: result.data.accessToken,

      tokenType: result.data.tokenType,
      expiresIn: result.data.expiresIn,
    };

    localStorage.setItem(KEY, JSON.stringify(session));

    try {
      const userInfo = await api.get("/member/me");
      if (userInfo.success && userInfo.data) {
        session.user = {
          id: userInfo.data.id,
          email: userInfo.data.email,
          name: userInfo.data.name,
          nickname: userInfo.data.nickname,
          role: userInfo.data.role,
          memberStatus: userInfo.data.memberStatus,
        };
        localStorage.setItem(KEY, JSON.stringify(session));
      }
    } catch (error) {
      console.warn("사용자 정보 조회 실패:", error);
    }

    return { ok: true, session };
  } catch (error) {
    if (error instanceof ApiError) {
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
  }
}
