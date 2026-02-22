/* kr/shared/js/account/account-login.js */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".login-form");
  const idInput = document.getElementById("loginId");

  // [New] 아이디 입력창 포커스 UX
  // 클릭하면 이메일 형식을 안내하고, 벗어나면 다시 아이디로 변경
  if (idInput) {
      idInput.addEventListener("focus", () => {
          idInput.placeholder = "이메일 (예: user@email.com)";
      });

      idInput.addEventListener("blur", () => {
          // 입력된 값이 없을 때만 원래대로 복구
          if (idInput.value === "") {
              idInput.placeholder = "아이디";
          }
      });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const pwInput = document.getElementById("loginPw");
    
    const id = idInput.value.trim();
    const pw = pwInput.value.trim();

    // 1. 관리자(Root) 계정 백도어 체크
    if (id === "root" && pw === "root") {
        alert("관리자(Root) 권한으로 로그인합니다.");
        
        // 관리자 세션 설정
        localStorage.setItem("is_logged_in", "true");
        localStorage.setItem("user_id", "root");
        localStorage.setItem("user_nick", "관리자");
        localStorage.setItem("user_email", "root@admin.com");
        localStorage.setItem("user_role", "admin");

        // [변경됨] account 폴더 안에서 실행되므로 상위 폴더의 home.html로 이동
        location.replace("../home.html");
        return;
    }

    // 2. 일반 로그인 유효성 검사 (이메일 형식 체크)
    if (!validateEmail(id)) {
        alert("아이디는 이메일 형식으로 입력해주세요.\n(예: user@email.com)");
        idInput.focus();
        return;
    }

    // [변경됨] 비밀번호 8자~64자 보안 규격 적용
    if (pw.length < 8 || pw.length > 64) {
        alert("비밀번호는 8자 이상 64자 이하입니다. 다시 확인해주세요.");
        pwInput.focus();
        return;
    }

    // 3. 일반 로그인 시도 (Mock Logic)
    const registeredEmail = localStorage.getItem("user_email");
    const registeredPw = localStorage.getItem("user_pw");

    // (간이 로그인 로직)
    if (registeredEmail && registeredEmail === id) {
        if (registeredPw && registeredPw !== pw) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }
    }

    // 로그인 성공 처리
    alert(`${id}님 환영합니다!`);
    localStorage.setItem("is_logged_in", "true");
    
    // 닉네임이 없으면 이메일 앞자리로 생성
    if (!localStorage.getItem("user_nick")) {
        localStorage.setItem("user_nick", id.split('@')[0]);
    }
    
    // 이메일 정보 갱신
    localStorage.setItem("user_email", id);

    // [변경됨] account 폴더 안에서 실행되므로 상위 폴더의 home.html로 이동
    location.replace("../home.html");
  });
});

// 이메일 정규식 검사 함수
// 추후 account-auth.js 로 이동하여 공통 관리하는 것을 권장합니다.
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}