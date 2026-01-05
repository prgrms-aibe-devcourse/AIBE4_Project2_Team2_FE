const KEY = "mm_session";
const USERS_KEY = "mm_users";

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
  return Boolean(s && s.token);
}

export function login({ userId, password }) {
  const users = readUsers();
  const u = users.find((x) => x.userId === userId);
  if (!u) return { ok: false, message: "아이디 또는 비밀번호가 올바르지 않다" };
  if (u.password !== password) return { ok: false, message: "아이디 또는 비밀번호가 올바르지 않다" };

  const session = {
    token: `mock-${Date.now()}`,
    userId: u.userId,
    nickname: u.nickname,
    major: u.major,
  };

  localStorage.setItem(KEY, JSON.stringify(session));
  return { ok: true, session };
}

export function logout() {
  localStorage.removeItem(KEY);
}

export function signup({ userId, password, nickname, major }) {
  const id = String(userId || "").trim();
  const pw = String(password || "");
  const nick = String(nickname || "").trim();
  const mj = String(major || "").trim();

  if (!id) return { ok: false, message: "아이디를 입력해라" };
  if (pw.length < 8) return { ok: false, message: "비밀번호는 8자 이상이어야 한다" };
  if (!nick) return { ok: false, message: "닉네임을 입력해라" };
  if (!mj) return { ok: false, message: "소속/전공 정보를 입력해라" };

  const users = readUsers();
  if (users.some((x) => x.userId === id)) return { ok: false, message: "이미 존재하는 아이디다" };

  users.push({ userId: id, password: pw, nickname: nick, major: mj });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  return { ok: true };
}

function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return seedUsers();
    
    let users = JSON.parse(raw);
    if (!Array.isArray(users)) return seedUsers();

    const managerExists = users.some(u => u.userId === 'manager');
    if (!managerExists) {
      users.push({ userId: "manager", password: "adminpass", nickname: "매니저", major: "관리자" });
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
    
    return users;
  } catch {
    return seedUsers();
  }
}

function seedUsers() {
  const seeded = [
    { userId: "student123", password: "password123", nickname: "공감학생", major: "고려대생" },
    { userId: "manager", password: "adminpass", nickname: "매니저", major: "관리자" },
  ];
  localStorage.setItem(USERS_KEY, JSON.stringify(seeded));
  return seeded;
}
