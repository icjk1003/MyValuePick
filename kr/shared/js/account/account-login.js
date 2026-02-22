/* kr/shared/js/account/account-login.js */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".login-form");
  const idInput = document.getElementById("loginId");

  // [기능 1] 아이디 입력창 포커스 UX
  if (idInput) {
      idInput.addEventListener("focus", () => {
          idInput.placeholder = "이메일 (예: user@email.com)";
      });

      idInput.addEventListener("blur", () => {
          if (idInput.value === "") {
              idInput.placeholder = "아이디";
          }
      });
  }

  // [기능 2] 폼 제출 및 로그인 검증
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const pwInput = document.getElementById("loginPw");
    const id = idInput.value.trim();
    const pw = pwInput.value.trim();

    // =========================================
    // 1. 관리자(Admin) 계정 백도어 예외 처리
    // =========================================
    if ((id === "root" || id === "admin") && pw === "123") {
        alert("관리자 권한으로 로그인합니다.");
        
        // 관리자 전용 세션 및 고정 UID 설정
        localStorage.setItem("is_logged_in", "true");
        localStorage.setItem("user_uid", "ADMIN_MASTER_ID"); // 식별자
        localStorage.setItem("user_id", "admin");
        localStorage.setItem("user_nick", "관리자");
        localStorage.setItem("user_email", "admin@valuepick.com");
        localStorage.setItem("user_role", "admin");

        location.replace("../home.html");
        return; 
    }

    // =========================================
    // 2. 일반 사용자 로그인 유효성 검사 (Core 연동)
    // =========================================
    if (!AccountAuth.validateEmail(id)) {
        alert("아이디는 이메일 형식으로 입력해주세요.\n(예: user@email.com)");
        idInput.focus();
        return;
    }

    if (!AccountAuth.validatePassword(pw)) {
        alert("비밀번호는 8자 이상 64자 이하입니다. 다시 확인해주세요.");
        pwInput.focus();
        return;
    }

    // =========================================
    // 3. 로그인 데이터 검증 (Mock Logic)
    // =========================================
    const registeredEmail = localStorage.getItem("user_email");
    const registeredPw = localStorage.getItem("user_pw");

    if (registeredEmail && registeredEmail === id) {
        if (registeredPw && registeredPw !== pw) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }
    } else if (!registeredEmail || registeredEmail !== id) {
        // Mock 테스트 편의를 위해 일단 통과시키거나, 엄격하게 막을 수 있습니다.
        // 현재는 간이 로직이므로 비밀번호만 맞으면 넘어가는 형태를 유지합니다.
    }

    // 로그인 성공 처리
    alert(`${id.split('@')[0]}님 환영합니다!`);
    
    // UID가 없으면(구버전 가입자) 새로 발급하여 하위 호환성 유지
    if (!localStorage.getItem("user_uid")) {
        localStorage.setItem("user_uid", AccountAuth.generateUID());
    }

    localStorage.setItem("is_logged_in", "true");
    
    if (!localStorage.getItem("user_nick")) {
        localStorage.setItem("user_nick", id.split('@')[0]);
    }
    localStorage.setItem("user_email", id);

    location.replace("../home.html");
  });
});