// src/services/api.js
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

function normalizeEndpoint(endpoint) {
  return String(endpoint || "").trim();
}

function isAuthEndpoint(endpoint) {
  const ep = normalizeEndpoint(endpoint);
  // auth 관련 엔드포인트는 refresh 로직을 타지 않게 분리한다
  return (
    ep === "/auth/login" ||
    ep === "auth/login" ||
    ep === "/auth/signup" ||
    ep === "auth/signup" ||
    ep === "/auth/refresh" ||
    ep === "auth/refresh" ||
    ep === "/auth/logout" ||
    ep === "auth/logout"
  );
}

async function safeParseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (response.status === 204) return null;

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

  const isFormData =
    typeof FormData !== "undefined" && config.body instanceof FormData;

  if (config.body && !isFormData && !config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }
  if (!config.headers["Accept"]) {
    config.headers["Accept"] = "application/json";
  }

  // 인증 엔드포인트는 기본적으로 Authorization을 붙이지 않는다
  const shouldSkipAuth = Boolean(options.skipAuth) || isAuthEndpoint(endpoint);

  if (!shouldSkipAuth) {
    const token = getAccessToken();
    const tokenType = getTokenType();
    if (token) {
      config.headers["Authorization"] = `${tokenType} ${token}`;
    }
  } else {
    delete config.headers["Authorization"];
  }

  try {
    const response = await fetch(url, config);
    const data = await safeParseResponse(response);

    if (response.ok) return data;

    // auth 엔드포인트는 refresh 재시도 로직을 타지 않는다
    if (response.status === 401 && !isAuthEndpoint(endpoint)) {
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

    throw new ApiError(
      data?.message || "요청에 실패했습니다.",
      response.status,
      data
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("네트워크 오류가 발생했습니다.", 0, null);
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
      headers: { Accept: "application/json" },
    });

    const result = await safeParseResponse(response);

    if (!response.ok || !result?.success) return false;

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

  postForm: (endpoint, formData, options = {}) =>
    request(endpoint, { method: "POST", body: formData, ...options }),

  putForm: (endpoint, formData, options = {}) =>
    request(endpoint, { method: "PUT", body: formData, ...options }),

  patchForm: (endpoint, formData, options = {}) =>
    request(endpoint, { method: "PATCH", body: formData, ...options }),

  delete: (endpoint, options = {}) =>
    request(endpoint, { ...options, method: "DELETE" }),
};
