// src/pages/mypage/utils/session.js
const KEY = "mm_session";

export function syncSessionUser(me) {
  const session = readSession();
  if (!session) return;

  const next = {
    ...session,
    user: {
      ...(session.user || {}),
      memberId: me.memberId ?? session?.user?.memberId,
      name: me.name ?? session?.user?.name,
      nickname: me.nickname ?? session?.user?.nickname,
      email: me.email ?? session?.user?.email,
      username: me.username ?? session?.user?.username,
      profileImageUrl: me.profileImageUrl ?? session?.user?.profileImageUrl,
      status: me.status ?? session?.user?.status,
      university: me.university ?? session?.user?.university,
      major: me.major ?? session?.user?.major,
      role: me.role ?? session?.user?.role,
      authProvider: me.authProvider ?? session?.user?.authProvider,
    },
  };

  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(
      new CustomEvent("mm:session-updated", { detail: next })
    );
  } catch {}
}

function readSession() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
