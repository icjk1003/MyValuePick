/* register.js - 회원가입 페이지 전용 스크립트 */

document.addEventListener("DOMContentLoaded", () => {
  const btnJoin = document.getElementById("btnRegisterSubmit");
  
  if (btnJoin) {
    btnJoin.addEventListener("click", () => {
      const id = document.getElementById("regId").value.trim();
      const pw = document.getElementById("regPw").value.trim();
      const pwConfirm = document.getElementById("regPwConfirm").value.trim();
      const nick = document.getElementById("regNick").value.trim();

      // 1. 빈 값 체크
      if (!id || !pw || !pwConfirm || !nick) {
        alert("모든 필수 항목을 입력해주세요.");
        return;
      }

      // 2. 비밀번호 일치 체크
      if (pw !== pwConfirm) {
        alert("비밀번호가 일치하지 않습니다.");
        return;
      }

      // 3. 아이디 길이 체크 (예시)
      if (id.length < 4) {
        alert("아이디는 4글자 이상이어야 합니다.");
        return;
      }

      // [임시] 회원가입 성공 처리
      alert(`회원가입이 완료되었습니다!\n${nick}님 환영합니다.`);
      location.href = "login.html";
    });
  }
});