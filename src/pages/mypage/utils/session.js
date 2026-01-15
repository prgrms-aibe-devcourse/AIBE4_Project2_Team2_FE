// src/pages/mypage/utils/session.js
/*
  세션 사용자 동기화 유틸
  - /members/me 응답(me)을 로컬 세션(mm_session)에 병합 저장
  - 저장 후 mm:session-updated 이벤트 발행
  - 기존 세션이 없으면 아무 동작도 하지 않음
*/

const KEY = "mm_session";

/*
  세션의 user를 me 기준으로 병합 갱신
  - me에 값이 있으면 me 우선, 없으면 기존 세션 값 유지
*/
export function syncSessionUser(me) {
  const session = readSession();
  if (!session) return;

  const src = me && typeof me === "object" ? me : {};
  const prevUser =
    session?.user && typeof session.user === "object" ? session.user : {};

  const next = {
    ...session,
    user: {
      ...prevUser,
      memberId: src.memberId ?? prevUser.memberId,
      name: src.name ?? prevUser.name,
      nickname: src.nickname ?? prevUser.nickname,
      email: src.email ?? prevUser.email,
      username: src.username ?? prevUser.username,
      profileImageUrl: src.profileImageUrl ?? prevUser.profileImageUrl,
      status: src.status ?? prevUser.status,
      university: src.university ?? prevUser.university,
      major: src.major ?? prevUser.major,
      role: src.role ?? prevUser.role,
      authProvider: src.authProvider ?? prevUser.authProvider,
    },
  };

  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(
      new CustomEvent("mm:session-updated", { detail: next })
    );
  } catch {}
}

/*
  로컬 세션 조회
*/
function readSession() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
