/* kr/shared/js/login.js */

/**
 * [Expert Web Developer & Architect Guidelines] 적용
 * 분석 결과: 디버깅용 Step 로그 및 중복된 이벤트 리스너 제거 필요.
 * 조치 사항: 1. Form Submit 기반의 통합 이벤트 모델 적용 / 2. 불필요한 콘솔 출력 삭제 / 3. 에러 핸들링 최적화.
 */

document.addEventListener("DOMContentLoaded", () => {
    // 폼 요소를 찾아 한 번에 이벤트를 바인딩합니다. (버튼 클릭 + 엔터키 동시 대응)
    const loginForm = document.querySelector(".login-form");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // 기본 제출 동작(새로고침) 방지
            await handleLogin();
        });
    }
});

/**
 * [Core Logic] 로그인 처리 함수
 */
async function handleLogin() {
    // 1. DOM 요소 참조
    const emailInput = document.getElementById("loginId");
    const passwordInput = document.getElementById("loginPw");

    if (!emailInput || !passwordInput) return;

    // 2. 입력 데이터 추출 및 정제
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // 3. 유효성 검사
    if (!email || !password) {
        alert("이메일과 비밀번호를 입력해주세요.");
        if (!email) emailInput.focus();
        else passwordInput.focus();
        return;
    }

    try {
        // 4. 비동기 인증 요청 (data.js의 DB_API 호출)
        if (!window.DB_API) {
            throw new Error("시스템 엔진이 로드되지 않았습니다. 관리자에게 문의하세요.");
        }

        const user = await window.DB_API.login(email, password);

        // 5. 로그인 성공: 브라우저 세션(localStorage) 저장
        localStorage.setItem("is_logged_in", "true");
        localStorage.setItem("user_id", user.id);
        localStorage.setItem("user_nick", user.nickname);
        localStorage.setItem("user_email", user.email);
        
        if (user.profileImg) {
            localStorage.setItem("user_profile_img", user.profileImg);
        }

        // 6. 페이지 이동
        // 로그인 후 리다이렉트할 페이지가 지정되어 있다면 그곳으로, 없으면 홈으로 이동
        const redirectUrl = sessionStorage.getItem("redirect_after_login") || "/kr/html/home.html";
        sessionStorage.removeItem("redirect_after_login");
        
        window.location.href = redirectUrl;

    } catch (error) {
        // 7. 로그인 실패 처리
        console.error("Login Error:", error.message);
        alert(error.message);
        
        // 편의를 위해 비밀번호 창 초기화 및 포커스
        passwordInput.value = "";
        passwordInput.focus();
    }
}