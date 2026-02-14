/* shared/js/register.js - 이메일 회원가입 로직 */

document.addEventListener("DOMContentLoaded", () => {
  const btnJoin = document.getElementById("btnRegisterSubmit");
  
  if (btnJoin) {
    btnJoin.addEventListener("click", () => {
      // [변경] 아이디 대신 이메일 가져오기
      const email = document.getElementById("regEmail").value.trim();
      const pw = document.getElementById("regPw").value.trim();
      const pwConfirm = document.getElementById("regPwConfirm").value.trim();
      const nick = document.getElementById("regNick").value.trim();

      // 1. 빈 값 체크
      if (!email || !pw || !pwConfirm || !nick) {
        alert("모든 필수 항목을 입력해주세요.");
        return;
      }

      // 2. [추가] 이메일 형식 체크
      if (!email.includes("@") || !email.includes(".")) {
        alert("올바른 이메일 주소를 입력해주세요.");
        return;
      }

      // 3. 비밀번호 일치 체크
      if (pw !== pwConfirm) {
        alert("비밀번호가 일치하지 않습니다.");
        return;
      }

      // 4. 닉네임 길이 체크 (선택)
      if (nick.length < 2) {
        alert("닉네임은 2글자 이상이어야 합니다.");
        return;
      }

      // [임시] 회원가입 성공 처리
      // 실제 서버가 있다면 여기서 중복 체크 API를 호출해야 함
      alert(`회원가입이 완료되었습니다!\n${nick}님 환영합니다.`);
      
      // 편의를 위해 가입한 이메일을 로컬스토리지에 임시 저장할 수도 있음 (선택사항)
      // localStorage.setItem("last_registered_email", email);

      location.href = "login.html";
    });
  }
});