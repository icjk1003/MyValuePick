/* kr/shared/js/account/account-login.js */

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".login-form");
    const idInput = document.getElementById("loginId");

    // [기능 1] 아이디 입력창 포커스 UX
    if (idInput) {
        idInput.addEventListener("focus", () => {
            idInput.placeholder = "이메일 (예: user@email.com)";
        });

        idInput.addEventListener("blur", () => {
            if (idInput.value === "") {
                idInput.placeholder = "아이디";
            }
        });
    }

    // [기능 2] 폼 제출 및 DB 연동 로그인 검증
    // 비동기 API 통신을 위해 async 속성 추가
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const pwInput = document.getElementById("loginPw");
        const id = idInput.value.trim();
        const pw = pwInput.value.trim();

        // =========================================
        // 1. 일반 사용자 로그인 유효성 검사
        // =========================================
        if (!AccountAuth.validateEmail(id)) {
            alert("아이디는 이메일 형식으로 입력해주세요.\n(예: user@email.com)");
            idInput.focus();
            return;
        }

        if (!AccountAuth.validatePassword(pw)) {
            alert("비밀번호는 8자 이상 64자 이하입니다. 다시 확인해주세요.");
            pwInput.focus();
            return;
        }

        // =========================================
        // 2. 로그인 데이터 검증 및 세션 부여 (DB_API 연동)
        // =========================================
        try {
            // 제출 버튼 임시 비활성화 (중복 클릭 방지)
            const submitBtn = form.querySelector('button[type="submit"]');
            if(submitBtn) submitBtn.disabled = true;

            // data.js에 정의된 DB_API를 통해 로그인 검증 수행
            // MOCK_DB에서 회원정보(일반 유저 및 최고 관리자 모두)를 확인하고 가져옵니다.
            const user = await DB_API.login(id, pw);

            // 로그인 성공 시 세션 정보 등록
            const tier = localStorage.getItem("user_tier") || "free"; 
            
            // DB에서 가져온 고유 ID, 이메일, 닉네임, 권한(role)을 세션에 셋업
            setLoginSession(user.id, user.email, user.nickname, user.role, tier);
            
            // 알림창 메시지 분기 처리
            let welcomeMsg = `${user.nickname}님 환영합니다!`;
            if (user.role === 'admin') welcomeMsg += " (관리자)";
            
            alert(welcomeMsg);
            location.replace("../home.html");

        } catch (error) {
            // DB_API에서 일치하는 회원을 찾지 못해 던진 에러 메시지 출력
            console.error("로그인 실패:", error);
            alert(error.message || "아이디 또는 비밀번호가 일치하지 않습니다.");
            
            // 버튼 다시 활성화
            const submitBtn = form.querySelector('button[type="submit"]');
            if(submitBtn) submitBtn.disabled = false;
        }
    });
});

/**
 * 로그인 성공 시 세션 정보를 일괄 저장하는 헬퍼 함수
 * @param {string} id 고유 식별자 (user_id)
 * @param {string} email 이메일 (로그인 ID)
 * @param {string} nick 닉네임
 * @param {string} role 권한 ('admin' | 'user')
 * @param {string} tier 구독 등급 ('free' | 'pro' | 'premium')
 */
function setLoginSession(id, email, nick, role, tier) {
    localStorage.setItem("is_logged_in", "true");
    localStorage.setItem("user_id", id);
    localStorage.setItem("user_email", email);
    localStorage.setItem("user_nick", nick);
    localStorage.setItem("user_role", role);
    localStorage.setItem("user_tier", tier);
}