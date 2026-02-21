/* kr/shared/js/login.js */

document.addEventListener("DOMContentLoaded", () => {
    // 폼 제출 방지 및 이벤트 바인딩
    const loginBtn = document.getElementById("btnLogin") || document.querySelector(".btn-login");
    const emailInput = document.getElementById("emailInput");
    const passwordInput = document.getElementById("passwordInput");

    if (loginBtn) {
        loginBtn.addEventListener("click", (e) => {
            e.preventDefault();
            handleLogin();
        });
    }

    // 비밀번호 입력창에서 엔터 키 입력 시 로그인 시도
    if (passwordInput) {
        passwordInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleLogin();
            }
        });
    }
});

// [핵심] 비동기 API(DB_API)를 통한 로그인 검증
async function handleLogin() {
    const emailInput = document.getElementById("emailInput");
    const passwordInput = document.getElementById("passwordInput");

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value.trim() : "";

    // 1. 유효성 검사 (프론트엔드 단)
    if (!email) {
        alert("이메일을 입력해주세요.");
        if (emailInput) emailInput.focus();
        return;
    }

    if (!password) {
        alert("비밀번호를 입력해주세요.");
        if (passwordInput) passwordInput.focus();
        return;
    }

    try {
        // 2. 서버(DB_API)에 로그인 요청
        // 일치하는 회원이 없으면 catch 블록으로 에러가 넘어갑니다.
        const user = await DB_API.login(email, password);
        
        // 3. 로그인 성공 시 클라이언트 세션(localStorage)에 정보 저장
        localStorage.setItem("is_logged_in", "true");
        localStorage.setItem("user_id", user.id);
        localStorage.setItem("user_nick", user.nickname);
        localStorage.setItem("user_email", user.email);
        
        if (user.profileImg) {
            localStorage.setItem("user_profile_img", user.profileImg);
        }

        alert(`환영합니다, ${user.nickname}님!`);
        
        // 4. 로그인 완료 후 페이지 이동 처리
        // 이전 페이지가 저장되어 있다면 그곳으로, 없다면 메인 홈으로 이동
        const redirectUrl = sessionStorage.getItem("redirect_after_login") || "/kr/html/home.html";
        sessionStorage.removeItem("redirect_after_login"); // 사용 후 제거
        window.location.href = redirectUrl;

    } catch (error) {
        // 5. 로그인 실패 처리 (비밀번호 틀림, 존재하지 않는 이메일 등)
        console.error("로그인 실패:", error);
        alert(error.message || "로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.");
        
        // 보안 및 편의성을 위해 비밀번호 입력창만 비우고 포커스
        if (passwordInput) {
            passwordInput.value = "";
            passwordInput.focus();
        }
    }
}