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

    // [기능 2] 폼 제출 및 로그인 검증
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const pwInput = document.getElementById("loginPw");
        const id = idInput.value.trim();
        const pw = pwInput.value.trim();

        // =========================================
        // 1. 최고 관리자 (Owner) 계정 셋업 및 백도어
        // =========================================
        // DB에 가입되어 있지 않아도, 이 계정은 최초 로그인 시 자동 가입 및 마스터 권한을 부여합니다.
        if (id === "icjk1003@gmail.com" && pw === "123123123") {
            const uid = localStorage.getItem("user_uid") || AccountAuth.generateUID();
            
            // 회원 데이터 강제 세팅 (Mock DB 역할)
            localStorage.setItem("user_pw", pw);
            
            // 세션 정보 등록 (role: admin, tier: premium)
            setLoginSession(uid, id, "마스터", "admin", "premium");
            
            alert("최고 관리자(Premium) 계정으로 접속합니다.");
            location.replace("../home.html");
            return; 
        }

        // 기존 시스템 관리자 백도어 (유지)
        if (id === "mvp_master_admin" && pw === "123") {
            setLoginSession("ADMIN_MASTER_ID", "admin@valuepick.com", "시스템 관리자", "admin", "premium");
            alert("시스템 관리자 권한으로 로그인합니다.");
            location.replace("../home.html");
            return; 
        }

        // =========================================
        // 2. 일반 사용자 로그인 유효성 검사
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
        // 3. 로그인 데이터 검증 및 세션 부여 (Mock Logic)
        // =========================================
        const registeredEmail = localStorage.getItem("user_email");
        const registeredPw = localStorage.getItem("user_pw");

        // 아이디와 비밀번호 일치 검사
        if (registeredEmail !== id || registeredPw !== pw) {
            alert("아이디 또는 비밀번호가 일치하지 않습니다.");
            return;
        }

        // 로그인 성공: 유저 정보 조회
        const registeredUid = localStorage.getItem("user_uid") || AccountAuth.generateUID();
        const registeredNick = localStorage.getItem("user_nick") || id.split('@')[0];
        
        // 권한(Role) 및 등급(Tier) 확인
        const role = AccountAuth.ADMIN_EMAILS.includes(id) ? "admin" : "user";
        const tier = localStorage.getItem("user_tier") || "free"; // 기본값 free

        // 세션 정보 등록
        setLoginSession(registeredUid, id, registeredNick, role, tier);
        
        // 알림창 메시지 분기 처리
        let welcomeMsg = `${registeredNick}님 환영합니다!`;
        if (role === 'admin') welcomeMsg += " (관리자)";
        
        alert(welcomeMsg);
        location.replace("../home.html");
    });
});

/**
 * 로그인 성공 시 세션 정보를 일괄 저장하는 헬퍼 함수
 * @param {string} uid 고유 식별자
 * @param {string} email 이메일 (로그인 ID)
 * @param {string} nick 닉네임
 * @param {string} role 권한 ('admin' | 'user')
 * @param {string} tier 구독 등급 ('free' | 'pro' | 'premium')
 */
function setLoginSession(uid, email, nick, role, tier) {
    localStorage.setItem("is_logged_in", "true");
    localStorage.setItem("user_uid", uid);
    localStorage.setItem("user_email", email);
    localStorage.setItem("user_nick", nick);
    localStorage.setItem("user_role", role);
    localStorage.setItem("user_tier", tier);
}