/* login.js - 로그인 페이지 전용 스크립트 */

document.addEventListener("DOMContentLoaded", () => {
  // 이미 로그인 상태라면 홈으로 이동
  if (localStorage.getItem("is_logged_in") === "true") {
    location.replace("home.html");
    return;
  }

  const btnLogin = document.getElementById("btnLoginSubmit");
  const inputId = document.getElementById("loginId");
  const inputPw = document.getElementById("loginPw");

  if (btnLogin) {
    btnLogin.addEventListener("click", () => {
      const id = inputId.value.trim();
      const pw = inputPw.value.trim();

      if (!id || !pw) {
        alert("아이디와 비밀번호를 모두 입력해주세요.");
        return;
      }

      // [임시] 테스트 계정 확인
      if (id === "user" && pw === "1234") {
        loginSuccess(id, "홍길동"); // 닉네임 예시
      } else {
        alert("아이디 또는 비밀번호가 일치하지 않습니다.\n(테스트 계정: user / 1234)");
      }
    });
  }
  
  // 엔터키 로그인 지원
  inputPw?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") btnLogin.click();
  });
});

function loginSuccess(id, nick) {
  localStorage.setItem("is_logged_in", "true");
  localStorage.setItem("user_id", id);
  localStorage.setItem("user_nick", nick);
  alert(`반갑습니다, ${nick}님!`);
  location.replace("home.html");
}