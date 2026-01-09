const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
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

function joinUrl(base, endpoint) {
  const ep = String(endpoint || "");
  if (!ep) return base;
  if (ep.startsWith("/")) return `${base}${ep}`;
  return `${base}/${ep}`;
}

async function safeParseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (response.status === 204) return null;

  if (contentType.includes("application/json")) {
    return await response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
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

  const token = getAccessToken();
  const tokenType = getTokenType();
  if (token) {
    config.headers["Authorization"] = `${tokenType} ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await safeParseResponse(response);

    if (response.ok) {
      return data;
    }

    // refresh 엔드포인트 자체면 재시도하지 않는다
    const isRefreshEndpoint = String(endpoint) === "/auth/refresh" || String(endpoint) === "auth/refresh";
    if (response.status === 401 && !isRefreshEndpoint) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const retryConfig = {
          ...config,
          headers: { ...config.headers },
        };
        const retryToken = getAccessToken();
        const retryTokenType = getTokenType();
        if (retryToken) {
          retryConfig.headers["Authorization"] = `${retryTokenType} ${retryToken}`;
        } else {
          delete retryConfig.headers["Authorization"];
        }

        const retryResponse = await fetch(url, retryConfig);
        const retryData = await safeParseResponse(retryResponse);

        if (!retryResponse.ok) {
          throw new ApiError(
            retryData?.message || "요청 실패",
            retryResponse.status,
            retryData
          );
        }

        return retryData;
      }

      logoutLocal();
      // SPA 라우팅이면 여기서 navigate("/login") 같은 방식으로 바꾸는 게 낫다
      window.location.hash = "#/login";
      throw new ApiError("인증이 만료되었다. 다시 로그인해라", 401, data);
    }

    throw new ApiError(
      data?.message || "요청 실패",
      response.status,
      data
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("네트워크 오류가 발생했다", 0, null);
  }
}

function getSession() {
  try {
    const raw = localStorage.getItem("mm_session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getAccessToken() {
  const session = getSession();
  return session?.accessToken || null;
}

function getTokenType() {
  const session = getSession();
  return session?.tokenType || "Bearer";
}

async function refreshAccessToken() {
  try {
    const response = await fetch(joinUrl(API_BASE_URL, "/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    const result = await safeParseResponse(response);

    if (!response.ok || !result?.success) {
      return false;
    }

    const session = getSession() || {};
    session.accessToken = result.data?.accessToken;
    session.tokenType = result.data?.tokenType || "Bearer";
    session.expiresIn = result.data?.expiresIn;
    session.tokenUpdatedAt = Date.now();

    localStorage.setItem("mm_session", JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

function logoutLocal() {
  localStorage.removeItem("mm_session");
}

export const api = {
  get: (endpoint, options = {}) =>
    request(endpoint, { ...options, method: "GET" }),

  post: (endpoint, body, options = {}) =>
    request(endpoint, {
      ...options,
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: {
        ...(options.headers || {}),
        "Content-Type": "application/json",
      },
    }),

  put: (endpoint, body, options = {}) =>
    request(endpoint, {
      ...options,
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: {
        ...(options.headers || {}),
        "Content-Type": "application/json",
      },
    }),

  delete: (endpoint, options = {}) =>
    request(endpoint, { ...options, method: "DELETE" }),
};
