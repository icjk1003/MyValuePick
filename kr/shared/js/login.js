/* shared/js/login.js */

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

        location.replace("home.html");
        return;
    }

    // 2. 일반 로그인 유효성 검사 (이메일 형식 체크)
    if (!validateEmail(id)) {
        alert("아이디는 이메일 형식으로 입력해주세요.\n(예: user@email.com)");
        idInput.focus();
        return;
    }

    if (pw.length < 4) {
        alert("비밀번호를 확인해주세요.");
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

    location.replace("home.html");
  });
});

// 이메일 정규식 검사 함수
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}