const RAW_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
const API_BASE_URL = normalizeBaseUrl(RAW_BASE_URL);

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function normalizeBaseUrl(v) {
  const base = String(v || "").trim();
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

function isAbsoluteUrl(u) {
  return /^https?:\/\//i.test(String(u || "").trim());
}

function joinUrl(base, endpoint) {
  const ep = String(endpoint || "").trim();
  if (!ep) return base;
  if (isAbsoluteUrl(ep)) return ep;
  if (ep.startsWith("/")) return `${base}${ep}`;
  return `${base}/${ep}`;
}

async function safeParseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (response.status === 204) return null;

  // JSON 우선 시도(실패해도 텍스트로 폴백)
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      // fallthrough
    }
  }

  try {
    const text = await response.text();
    return text ? { message: text } : null;
  } catch {
    return null;
  }
}

function emitAuthExpired() {
  try {
    window.dispatchEvent(new CustomEvent("mm:auth-expired"));
  } catch {}
}

async function request(endpoint, options = {}) {
  const url = joinUrl(API_BASE_URL, endpoint);

  const config = {
    method: "GET",
    credentials: "include",
    ...options,
    headers: {
      ...options.headers,
    },
  };

  // body가 있을 때만 Content-Type을 JSON으로 강제한다
  if (config.body && !config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }
  if (!config.headers["Accept"]) {
    config.headers["Accept"] = "application/json";
  }

  // 쿠키 기반 인증: Authorization 헤더 불필요
  // 브라우저가 자동으로 쿠키를 포함하여 전송 (credentials: 'include')

  try {
    console.log(`🌐 API 요청: ${config.method} ${url}`);
    console.log("  - Headers:", config.headers);
    console.log("  - Credentials:", config.credentials);

    const response = await fetch(url, config);
    const data = await safeParseResponse(response);

    console.log(`📥 API 응답: ${config.method} ${url}`);
    console.log("  - Status:", response.status);
    console.log("  - Data:", data);

    if (response.ok) return data;

    const isRefreshEndpoint =
      String(endpoint) === "/auth/refresh" || String(endpoint) === "auth/refresh";

    if (response.status === 401 && !isRefreshEndpoint) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // 쿠키가 갱신되었으므로 동일한 요청 재시도
        const retryResponse = await fetch(url, config);
        const retryData = await safeParseResponse(retryResponse);

        if (!retryResponse.ok) {
          throw new ApiError(
            retryData?.message || "요청에 실패했습니다.",
            retryResponse.status,
            retryData
          );
        }

        return retryData;
      }

      logoutLocal();
      emitAuthExpired();
      window.location.hash = "#/login";
      throw new ApiError("인증이 만료되었습니다. 다시 로그인하세요.", 401, data);
    }

    throw new ApiError(data?.message || "요청에 실패했습니다.", response.status, data);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("네트워크 오류가 발생했습니다.", 0, null);
  }
}

// 쿠키 기반 인증: 세션 정보 조회 불필요
// 사용자 정보는 auth.js의 getSession()을 통해 관리

async function refreshAccessToken() {
  try {
    const response = await fetch(joinUrl(API_BASE_URL, "/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    const result = await safeParseResponse(response);

    // 쿠키 기반 인증: 서버가 새 쿠키를 설정하므로 localStorage 갱신 불필요
    return response.ok && result?.success;
  } catch {
    return false;
  }
}

function logoutLocal() {
  localStorage.removeItem("mm_user");
  // 혹시 남아있을 수 있는 기존 키도 제거
  localStorage.removeItem("mm_session");
}

function withJsonBody(body, options = {}) {
  const hasBody = body !== undefined;
  return {
    ...options,
    body: hasBody ? JSON.stringify(body) : undefined,
    headers: {
      ...(options.headers || {}),
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
    },
  };
}

export const api = {
  get: (endpoint, options = {}) =>
    request(endpoint, { ...options, method: "GET" }),

  post: (endpoint, body, options = {}) =>
    request(endpoint, { method: "POST", ...withJsonBody(body, options) }),

  put: (endpoint, body, options = {}) =>
    request(endpoint, { method: "PUT", ...withJsonBody(body, options) }),

  patch: (endpoint, body, options = {}) =>
    request(endpoint, { method: "PATCH", ...withJsonBody(body, options) }),

  delete: (endpoint, options = {}) =>
    request(endpoint, { ...options, method: "DELETE" }),
};
