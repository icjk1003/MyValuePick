/* shared/js/auth.js - FINAL (Home 이동) */

document.addEventListener("DOMContentLoaded", () => {
  // 1. 로그인 버튼 연결 (클릭 시)
  const btnLogin = document.getElementById("btnLoginSubmit");
  if (btnLogin) {
    btnLogin.addEventListener("click", (e) => {
      e.preventDefault(); // 폼 제출(새로고침) 방지
      loginProcess();
    });
    
    // 엔터키 처리 (비번 입력창에서 엔터 치면 로그인)
    const pwInput = document.getElementById("loginPw");
    if(pwInput) {
      pwInput.addEventListener("keypress", (e) => {
        if(e.key === "Enter") { 
          e.preventDefault(); 
          loginProcess(); 
        }
      });
    }
  }

  // 2. 회원가입 버튼 연결
  const btnRegister = document.getElementById("btnRegisterSubmit");
  if (btnRegister) {
    btnRegister.addEventListener("click", (e) => {
      e.preventDefault(); // 폼 제출 방지
      registerProcess();
    });
  }
});

// ==========================================
// [기능 1] 로그인 프로세스
// ==========================================
function loginProcess() {
  const idInput = document.getElementById("loginId");
  const pwInput = document.getElementById("loginPw");
  if (!idInput || !pwInput) return;

  const id = idInput.value.trim();
  const pw = pwInput.value.trim();

  if (!id) { alert("아이디를 입력해주세요."); idInput.focus(); return; }
  if (!pw) { alert("비밀번호를 입력해주세요."); pwInput.focus(); return; }

  // 1. 샘플 계정 확인 (user / 1234)
  const isSampleUser = (id === "user" && pw === "1234");

  // 2. 방금 회원가입한 계정 확인
  const savedId = localStorage.getItem("registered_id");
  const savedPw = localStorage.getItem("registered_pw");
  const savedNick = localStorage.getItem("registered_nick");

  const isRegisteredUser = (savedId && id === savedId && pw === savedPw);

  // 로그인 성공 처리
  if (isSampleUser || isRegisteredUser) {
    const nickName = isRegisteredUser ? savedNick : "개미투자자";

    localStorage.setItem("is_logged_in", "true");
    localStorage.setItem("user_id", id);
    localStorage.setItem("user_nick", nickName);

    alert(`반갑습니다, ${nickName}님!`);
    
    // [수정] home.html로 이동 (있으시니까 여기로!)
    location.replace("home.html"); 

  } else {
    alert("아이디 또는 비밀번호가 일치하지 않습니다.");
    pwInput.value = "";
    pwInput.focus();
  }
}


// ==========================================
// [기능 2] 회원가입 프로세스
// ==========================================
function registerProcess() {
  const id = document.getElementById("regId").value.trim();
  const pw = document.getElementById("regPw").value.trim();
  const pwConfirm = document.getElementById("regPwConfirm").value.trim();
  const nick = document.getElementById("regNick").value.trim();

  // 유효성 검사
  if (!id) { alert("아이디를 입력해주세요."); return; }
  if (id.length < 4) { alert("아이디는 4글자 이상이어야 합니다."); return; }
  
  if (!pw) { alert("비밀번호를 입력해주세요."); return; }
  if (pw.length < 4) { alert("비밀번호는 4글자 이상이어야 합니다."); return; }

  if (pw !== pwConfirm) { alert("비밀번호가 일치하지 않습니다."); return; }
  
  if (!nick) { alert("닉네임을 입력해주세요."); return; }

  // 가입 처리
  localStorage.setItem("registered_id", id);
  localStorage.setItem("registered_pw", pw);
  localStorage.setItem("registered_nick", nick);

  alert("회원가입이 완료되었습니다!\n로그인 페이지로 이동합니다.");
  
  // 로그인 페이지로 이동
  location.href = "login.html";
}


// ==========================================
// [기능 3] 로그아웃 (공통)
// ==========================================
function logout() {
  if(confirm("로그아웃 하시겠습니까?")) {
    localStorage.removeItem("is_logged_in");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_nick");
    
    // 로그아웃 후 홈으로 이동
    location.href = "home.html";
  }
}