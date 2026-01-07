export function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search);

  const accessToken = params.get("accessToken");
  const tokenType = params.get("tokenType");
  const expiresIn = params.get("expiresIn");

  if (!accessToken) {
    console.error("OAuth2 accessToken 없음");
    return;
  }

  const session = {
    accessToken,
    tokenType,
    expiresIn,
    tokenUpdatedAt: Date.now(),
  };

  localStorage.setItem(KEY, JSON.stringify(session));

  window.location.replace("/#/"); // ⬅ 이게 중요
}
