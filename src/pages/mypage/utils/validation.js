// src/pages/mypage/utils/validation.js
/*
  프로필 수정 검증 로직
  - 닉네임 규칙 검증
  - 대학교/학과 길이 제한 검증
  - 로컬/소셜 계정에 따른 비밀번호 변경 가능 여부 검증
  - 비밀번호 변경 시 현재/새/확인 3종 필수 및 규칙 검증
*/

export function validateProfileUpdate(payload, me) {
  const fieldErrors = {};

  const p = payload && typeof payload === "object" ? payload : {};
  const profile = me && typeof me === "object" ? me : {};

  // 닉네임 규칙 검증
  const nicknameMsg = getNicknameRuleMessage(p.nickname);
  if (nicknameMsg) fieldErrors.nickname = nicknameMsg;

  // 대학교/학과 길이 제한 검증
  if (p.university != null && String(p.university).length > 20) {
    fieldErrors.university = "대학교명은 20자 이하입니다.";
  }
  if (p.major != null && String(p.major).length > 20) {
    fieldErrors.major = "학과명은 20자 이하입니다.";
  }

  // 비밀번호 입력값 정규화
  const currentPassword = String(p.currentPassword || "").trim();
  const newPassword = String(p.newPassword || "").trim();
  const newPasswordConfirm = String(p.newPasswordConfirm || "").trim();

  const isLocal = isLikelyLocalUser(profile);
  const hasAnyPwdInput = Boolean(
    currentPassword || newPassword || newPasswordConfirm
  );

  // 소셜 계정 처리: 비밀번호 관련 입력이 있으면 즉시 오류 처리
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

  // 로컬 계정 처리: 비밀번호 변경은 선택 사항, 입력이 시작되면 3종 필수
  if (hasAnyPwdInput) {
    // 현재 비밀번호
    if (!currentPassword) {
      fieldErrors.currentPassword = "현재 비밀번호가 필요합니다.";
    } else {
      const curErr = getPasswordRuleMessage(currentPassword);
      if (curErr) fieldErrors.currentPassword = curErr;
    }

    // 새 비밀번호
    if (!newPassword) {
      fieldErrors.newPassword = "새 비밀번호가 필요합니다.";
    } else {
      const newErr = getPasswordRuleMessage(newPassword);
      if (newErr) fieldErrors.newPassword = newErr;
    }

    // 새 비밀번호 확인
    if (!newPasswordConfirm) {
      fieldErrors.newPasswordConfirm = "새 비밀번호 확인이 필요합니다.";
    } else if (newPassword && newPassword !== newPasswordConfirm) {
      fieldErrors.newPasswordConfirm = "새 비밀번호가 일치하지 않습니다.";
    }

    // 현재 비밀번호와 새 비밀번호 동일 여부 검증
    if (currentPassword && newPassword && currentPassword === newPassword) {
      fieldErrors.newPassword = "새 비밀번호는 현재 비밀번호와 달라야 합니다.";
    }
  }

  const ok = Object.keys(fieldErrors).length === 0;
  return { ok, fieldErrors, message: ok ? "" : "입력값을 확인해 주세요." };
}

/*
  닉네임 규칙 메시지 반환
  - 비어 있으면 필수 메시지
  - 길이 2~20 제한
  - 한글/영문/숫자/_/-만 허용
*/
export function getNicknameRuleMessage(nicknameRaw) {
  const v = String(nicknameRaw || "").trim();
  if (!v) return "닉네임은 필수입니다.";
  if (v.length < 2 || v.length > 20) return "닉네임은 2~20자입니다.";
  if (!/^[가-힣a-zA-Z0-9_-]{2,20}$/.test(v))
    return "닉네임 형식이 올바르지 않습니다.";
  return "";
}

/*
  이메일 규칙 메시지 반환
*/
export function getEmailRuleMessage(emailRaw) {
  const v = String(emailRaw || "").trim();
  if (!v) return "이메일은 필수입니다.";
  if (v.length > 255) return "이메일은 255자 이하입니다.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
    return "이메일 형식이 올바르지 않습니다.";
  return "";
}

/*
  비밀번호 규칙 메시지 반환
  - 빈 값은 "검증 대상 아님"으로 처리(상위 로직에서 필수 여부 판단)
  - 8~20자
  - 영문/숫자/특수문자(@$!%*#?&) 포함
*/
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

/*
  새 비밀번호 확인 메시지 반환
  - 둘 다 비어 있으면 통과
  - confirm만 비어 있으면 상위에서 필수 처리 가능
*/
export function getNewPasswordConfirmMessage(newPasswordRaw, confirmRaw) {
  const pwd = String(newPasswordRaw || "").trim();
  const cfm = String(confirmRaw || "").trim();

  if (!pwd && !cfm) return "";
  if (!cfm) return "";
  return pwd === cfm ? "" : "새 비밀번호가 일치하지 않습니다.";
}

/*
  로컬 계정 추정 로직
  - authProvider가 있으면 LOCAL 여부로 판정
  - 없으면 username prefix로 소셜 계정 추정
*/
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
