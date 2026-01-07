const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  const token = getAccessToken();
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          config.headers["Authorization"] = `Bearer ${getAccessToken()}`;
          const retryResponse = await fetch(url, config);
          const retryData = await retryResponse.json();

          if (!retryResponse.ok) {
            throw new ApiError(
              retryData.message || "요청 실패",
              retryResponse.status,
              retryData
            );
          }

          return retryData;
        } else {
          logout();
          window.location.href = "/login";
          throw new ApiError("인증이 만료되었다. 다시 로그인해라", 401, data);
        }
      }

      throw new ApiError(
        data.message || "요청 실패",
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("네트워크 오류가 발생했다", 0, null);
  }
}

function getAccessToken() {
  try {
    const session = localStorage.getItem("mm_session");
    if (!session) return null;
    const parsed = JSON.parse(session);
    return parsed.accessToken || null;
  } catch {
    return null;
  }
}



async function refreshAccessToken() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include", // ★ 핵심
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return false;
    }

    const session = JSON.parse(localStorage.getItem("mm_session") || "{}");

    session.accessToken = result.data.accessToken;
    session.tokenType = result.data.tokenType;
    session.expiresIn = result.data.expiresIn;
    session.tokenUpdatedAt = Date.now();

    localStorage.setItem("mm_session", JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}


function logout() {
  localStorage.removeItem("mm_session");
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options = {}) => request(endpoint, {
    ...options,
    method: "POST",
    body: JSON.stringify(body),
  }),
  put: (endpoint, body, options = {}) => request(endpoint, {
    ...options,
    method: "PUT",
    body: JSON.stringify(body),
  }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: "DELETE" }),
};
