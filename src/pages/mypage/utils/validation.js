// src/pages/mypage/utils/validation.js
export function validateProfileUpdate(payload, me) {
  const fieldErrors = {};

  const nicknameMsg = getNicknameRuleMessage(payload.nickname);
  if (nicknameMsg) fieldErrors.nickname = nicknameMsg;

  if (payload.university != null && String(payload.university).length > 20) {
    fieldErrors.university = "대학교명은 20자 이하입니다.";
  }
  if (payload.major != null && String(payload.major).length > 20) {
    fieldErrors.major = "학과명은 20자 이하입니다.";
  }

  const currentPassword = String(payload.currentPassword || "").trim();
  const newPassword = String(payload.newPassword || "").trim();
  const newPasswordConfirm = String(payload.newPasswordConfirm || "").trim();

  const isLocal = isLikelyLocalUser(me);
  const hasAnyPwdInput = Boolean(
    currentPassword || newPassword || newPasswordConfirm
  );

  // 소셜 계정: 비밀번호 관련 입력이 조금이라도 있으면 금지
  if (!isLocal) {
    if (hasAnyPwdInput) {
      if (currentPassword) {
        fieldErrors.currentPassword =
          "소셜 계정은 현재 비밀번호를 입력할 수 없습니다.";
      }
      if (newPassword) {
        fieldErrors.newPassword = "소셜 계정은 비밀번호를 변경할 수 없습니다.";
      }
      if (newPasswordConfirm) {
        fieldErrors.newPasswordConfirm =
          "소셜 계정은 비밀번호를 변경할 수 없습니다.";
      }
    }

    const ok = Object.keys(fieldErrors).length === 0;
    return { ok, fieldErrors, message: ok ? "" : "입력값을 확인해 주세요." };
  }

  // 로컬 계정: 비밀번호 변경은 선택
  // 단, 변경을 시도했다면(current/new/confirm 중 하나라도 입력) 세 값 모두 필요
  if (hasAnyPwdInput) {
    if (!currentPassword) {
      fieldErrors.currentPassword = "현재 비밀번호가 필요합니다.";
    } else {
      const curErr = getPasswordRuleMessage(currentPassword);
      if (curErr) fieldErrors.currentPassword = curErr;
    }

    if (!newPassword) {
      fieldErrors.newPassword = "새 비밀번호가 필요합니다.";
    } else {
      const newErr = getPasswordRuleMessage(newPassword);
      if (newErr) fieldErrors.newPassword = newErr;
    }

    if (!newPasswordConfirm) {
      fieldErrors.newPasswordConfirm = "새 비밀번호 확인이 필요합니다.";
    } else if (newPassword && newPassword !== newPasswordConfirm) {
      fieldErrors.newPasswordConfirm = "새 비밀번호가 일치하지 않습니다.";
    }

    // 서버 규칙과 동일한 수준에서 미리 차단
    if (currentPassword && newPassword && currentPassword === newPassword) {
      fieldErrors.newPassword = "새 비밀번호는 현재 비밀번호와 달라야 합니다.";
    }
  }

  const ok = Object.keys(fieldErrors).length === 0;
  return {
    ok,
    fieldErrors,
    message: ok ? "" : "입력값을 확인해 주세요.",
  };
}

export function getNicknameRuleMessage(nicknameRaw) {
  const v = String(nicknameRaw || "").trim();
  if (!v) return "닉네임은 필수입니다.";
  if (v.length < 2 || v.length > 20) return "닉네임은 2~20자입니다.";
  if (!/^[가-힣a-zA-Z0-9_-]{2,20}$/.test(v))
    return "닉네임 형식이 올바르지 않습니다.";
  return "";
}

export function getEmailRuleMessage(emailRaw) {
  const v = String(emailRaw || "").trim();
  if (!v) return "이메일은 필수입니다.";
  if (v.length > 255) return "이메일은 255자 이하입니다.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
    return "이메일 형식이 올바르지 않습니다.";
  return "";
}

export function getPasswordRuleMessage(passwordRaw) {
  const v = String(passwordRaw || "").trim();
  if (!v) return "";

  if (v.length < 8 || v.length > 20) {
    return "비밀번호는 8~20자입니다.";
  }

  if (
    !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(v)
  ) {
    return "비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.";
  }

  return "";
}

export function getNewPasswordConfirmMessage(newPasswordRaw, confirmRaw) {
  const pwd = String(newPasswordRaw || "").trim();
  const cfm = String(confirmRaw || "").trim();

  if (!pwd && !cfm) return "";
  if (!cfm) return "";
  return pwd === cfm ? "" : "새 비밀번호가 일치하지 않습니다.";
}

function isLikelyLocalUser(me) {
  const provider = me?.authProvider ?? null;

  if (provider) {
    return String(provider).toUpperCase() === "LOCAL";
  }

  const username = me?.username ?? "";
  const userStr = String(username).toLowerCase();
  if (
    userStr.startsWith("google_") ||
    userStr.startsWith("github_") ||
    userStr.startsWith("kakao_") ||
    userStr.startsWith("naver_")
  ) {
    return false;
  }

  return true;
}
