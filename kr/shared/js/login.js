/* shared/js/login.js - 이메일 로그인 로직 */

document.addEventListener("DOMContentLoaded", () => {
  // 이미 로그인 상태라면 홈으로 이동
  if (localStorage.getItem("is_logged_in") === "true") {
    location.replace("home.html");
    return;
  }

  const btnLogin = document.getElementById("btnLoginSubmit");
  const inputEmail = document.getElementById("loginEmail"); // ID -> Email로 변경
  const inputPw = document.getElementById("loginPw");

  if (btnLogin) {
    btnLogin.addEventListener("click", () => {
      const email = inputEmail.value.trim();
      const pw = inputPw.value.trim();

      // 1. 빈 값 체크
      if (!email || !pw) {
        alert("이메일과 비밀번호를 모두 입력해주세요.");
        return;
      }

      // 2. 이메일 형식 체크 (간단 버전)
      if (!email.includes("@")) {
        alert("올바른 이메일 형식이 아닙니다.");
        return;
      }

      // [임시] 테스트 계정 확인 (user@test.com / 1234)
      if (email === "user@test.com" && pw === "1234") {
        loginSuccess(email, "홍길동"); // 닉네임 예시
      } else {
        // 실제라면 서버로 전송하겠지만, 여기선 테스트 계정 안내
        alert("이메일 또는 비밀번호가 일치하지 않습니다.\n(테스트 계정: user@test.com / 1234)");
      }
    });
  }
  
  // 엔터키 로그인 지원
  inputPw?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") btnLogin.click();
  });
});

function loginSuccess(email, nick) {
  localStorage.setItem("is_logged_in", "true");
  // [중요] user_id 키를 삭제하고 user_email을 사용합니다.
  localStorage.setItem("user_email", email); 
  localStorage.setItem("user_nick", nick);
  
  alert(`반갑습니다, ${nick}님!`);
  location.replace("home.html");
}