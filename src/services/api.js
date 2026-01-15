// src/services/api.js
/*
  API 클라이언트
  - baseUrl: VITE_API_BASE_URL 또는 기본값(http://localhost:8080/api)
  - 인증 방식: 쿠키 기반(credentials: "include")
  - 401 처리: auth 엔드포인트가 아닌 경우 /auth/refresh 시도 후 1회 재시도
  - 갱신 실패: 로컬 세션 정리, mm:auth-expired 이벤트 발행, 로그인으로 이동
  - 응답 파싱: JSON 우선, 실패 시 text로 message 구성
*/

const RAW_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
const API_BASE_URL = normalizeBaseUrl(RAW_BASE_URL);

const USER_KEY = "mm_user";
const SESSION_KEY = "mm_session";

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/*
  baseUrl 정규화
  - 끝의 "/" 제거
*/
function normalizeBaseUrl(v) {
  const base = String(v || "").trim();
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

/*
  절대 URL 여부
*/
function isAbsoluteUrl(u) {
  return /^https?:\/\//i.test(String(u || "").trim());
}

/*
  base + endpoint 결합
  - endpoint가 절대 URL이면 그대로 사용
  - endpoint가 "/..."면 base에 바로 붙임
*/
function joinUrl(base, endpoint) {
  const ep = String(endpoint || "").trim();
  if (!ep) return base;
  if (isAbsoluteUrl(ep)) return ep;
  if (ep.startsWith("/")) return `${base}${ep}`;
  return `${base}/${ep}`;
}

/*
  endpoint 정규화(공백 제거)
*/
function normalizeEndpoint(endpoint) {
  return String(endpoint || "").trim();
}

/*
  인증 관련 엔드포인트인지 판별
  - 해당 엔드포인트는 refresh 재시도 로직을 타지 않게 한다
*/
function isAuthEndpoint(endpoint) {
  const ep = normalizeEndpoint(endpoint);
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

/*
  안전한 응답 파싱
  - 204는 null
  - application/json이면 json() 시도
  - 실패하면 text()로 message 형태를 만든다
*/
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

/*
  인증 만료 이벤트 발행
  - 다른 모듈에서 이 이벤트를 받아 UI 처리 가능
*/
function emitAuthExpired() {
  try {
    window.dispatchEvent(new CustomEvent("mm:auth-expired"));
  } catch {}
}

/*
  로컬 세션 정리
  - 쿠키는 서버에서 만료/삭제하므로, 여기서는 localStorage만 정리한다
*/
function logoutLocal() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(SESSION_KEY);
}

/*
  JSON 바디 옵션 구성
  - body가 undefined가 아니면 JSON.stringify 적용
  - Content-Type은 body가 있을 때만 강제한다
*/
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

/*
  토큰(쿠키) 갱신
  - 서버가 Set-Cookie로 갱신하므로, 클라이언트는 성공 여부만 확인한다
*/
async function refreshAccessToken() {
  try {
    const response = await fetch(joinUrl(API_BASE_URL, "/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    const result = await safeParseResponse(response);
    return response.ok && Boolean(result?.success);
  } catch {
    return false;
  }
}

/*
  단일 요청 실행
  - 기본적으로 credentials: "include" 사용
  - FormData면 Content-Type 강제하지 않는다(브라우저가 boundary 포함해 설정)
  - Authorization 헤더는 제거한다(쿠키 기반이므로 불필요)
  - 401이면 refresh 후 동일 요청 1회 재시도(단, auth 엔드포인트 제외)
*/
async function request(endpoint, options = {}) {
  const url = joinUrl(API_BASE_URL, endpoint);

  const config = {
    method: "GET",
    credentials: "include",
    ...options,
    headers: {
      ...(options.headers || {}),
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

  // 쿠키 기반 인증이므로 Authorization 헤더는 사용하지 않는다
  delete config.headers["Authorization"];

  try {
    const response = await fetch(url, config);
    const data = await safeParseResponse(response);

    if (response.ok) return data;

    // 401 처리: auth 엔드포인트는 refresh 로직을 타지 않는다
    if (response.status === 401 && !isAuthEndpoint(endpoint)) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const retryResponse = await fetch(url, config);
        const retryData = await safeParseResponse(retryResponse);

        if (retryResponse.ok) return retryData;

        throw new ApiError(
          retryData?.message || "요청에 실패했습니다.",
          retryResponse.status,
          retryData
        );
      }

      logoutLocal();
      emitAuthExpired();
      window.location.hash = "#/login";
      throw new ApiError(
        "인증이 만료되었습니다. 다시 로그인하세요.",
        401,
        data
      );
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

/*
  외부에서 사용하는 API 표면
  - get/post/put/patch: JSON 바디 자동 처리
  - *Form: FormData 전송용(Content-Type 미설정)
  - delete: 단순 호출
*/
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
