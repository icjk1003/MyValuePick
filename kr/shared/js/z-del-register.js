/* kr/shared/js/register.js */

document.addEventListener("DOMContentLoaded", () => {
    // 폼 제출 방지 및 이벤트 바인딩
    const registerBtn = document.getElementById("btnRegister") || document.querySelector(".btn-register");

    if (registerBtn) {
        registerBtn.addEventListener("click", (e) => {
            e.preventDefault();
            handleRegister();
        });
    }
});

// [핵심] 비동기 API(DB_API)를 통한 회원가입 처리
async function handleRegister() {
    const emailInput = document.getElementById("emailInput");
    const passwordInput = document.getElementById("passwordInput");
    const passwordConfirmInput = document.getElementById("passwordConfirmInput");
    const nicknameInput = document.getElementById("nicknameInput");
    const termsCheckbox = document.getElementById("termsAgree");

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value.trim() : "";
    const passwordConfirm = passwordConfirmInput ? passwordConfirmInput.value.trim() : "";
    const nickname = nicknameInput ? nicknameInput.value.trim() : "";

    // 1. 프론트엔드 유효성 검사 (Validation)
    if (!email) {
        alert("이메일을 입력해주세요.");
        if (emailInput) emailInput.focus();
        return;
    }
    
    // 이메일 형식 정규식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("유효한 이메일 주소를 입력해주세요.");
        if (emailInput) emailInput.focus();
        return;
    }

    if (!password) {
        alert("비밀번호를 입력해주세요.");
        if (passwordInput) passwordInput.focus();
        return;
    }

    if (password.length < 4) {
        alert("비밀번호는 최소 4자 이상이어야 합니다.");
        if (passwordInput) passwordInput.focus();
        return;
    }

    if (password !== passwordConfirm) {
        alert("비밀번호가 일치하지 않습니다.");
        if (passwordConfirmInput) passwordConfirmInput.focus();
        return;
    }

    if (!nickname) {
        alert("닉네임을 입력해주세요.");
        if (nicknameInput) nicknameInput.focus();
        return;
    }

    if (termsCheckbox && !termsCheckbox.checked) {
        alert("이용약관 및 개인정보 취급방침에 동의해주세요.");
        return;
    }

    try {
        // 2. 서버(DB_API)에 회원가입 데이터 전송
        // 중복된 이메일이 있다면 catch 블록으로 에러가 떨어집니다.
        const newUser = await DB_API.register({
            email: email,
            password: password,
            nickname: nickname
        });

        // 3. 회원가입 성공 처리
        alert(`환영합니다, ${newUser.nickname}님! 회원가입이 성공적으로 완료되었습니다.\n로그인 페이지로 이동합니다.`);
        
        // 가입 성공 후 로그인 페이지로 리다이렉트
        window.location.href = "/kr/html/login.html"; 

    } catch (error) {
        // 4. 회원가입 실패 처리 (예: 이미 존재하는 이메일)
        console.error("회원가입 실패:", error);
        alert(error.message || "회원가입 처리 중 문제가 발생했습니다. 다시 시도해주세요.");
        
        // 이메일 중복 에러일 경우 이메일 입력창 비우고 포커스
        if (error.message.includes("이메일") && emailInput) {
            emailInput.value = "";
            emailInput.focus();
        }
    }
}