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

    if (!result?.success) {
      return { ok: false, message: result?.message || "로그인 실패" };
    }

    const session = {
      accessToken: result?.data?.accessToken || "",
      tokenType: result?.data?.tokenType || "Bearer",
      expiresIn: result?.data?.expiresIn,
      tokenUpdatedAt: Date.now(),
    };

    localStorage.setItem(KEY, JSON.stringify(session));

    try {
      const userInfo = await api.get("/members/me");

      if (userInfo?.success && userInfo?.data) {
        session.user = {
          memberId: userInfo.data.memberId ?? "",
          username: userInfo.data.username ?? "",
          email: userInfo.data.email ?? "",
          name: userInfo.data.name ?? "",
          nickname: userInfo.data.nickname ?? "",
          profileImageUrl: userInfo.data.profileImageUrl ?? "",
          status: userInfo.data.status ?? "",
          role: userInfo.data.role ?? "",
        };

        localStorage.setItem(KEY, JSON.stringify(session));
      }
    } catch (error) {
      console.warn("사용자 정보 조회 실패:", error);
    }

    return { ok: true, session };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "서버 연결 오류" };
  }
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    console.warn("로그아웃 API 호출 실패:", error);
  } finally {
    localStorage.removeItem(KEY);
  }
}
