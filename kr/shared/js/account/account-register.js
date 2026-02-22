/* kr/shared/js/account/account-register.js */

document.addEventListener("DOMContentLoaded", () => {
    initIdField();
    initNicknameCheck();
    initPasswordCheck();
    initSubmit();
});

// =========================================
// [기능 1] 아이디(이메일) 실시간 검사 & UX
// =========================================
function initIdField() {
    const idInput = document.getElementById("regId");
    const msgBox = document.getElementById("idCheckMsg"); 
    if (!idInput || !msgBox) return;

    // 포커스 UX
    idInput.addEventListener("focus", () => {
        idInput.placeholder = "이메일 (예: user@email.com)";
    });

    idInput.addEventListener("blur", () => {
        if (idInput.value === "") {
            idInput.placeholder = "아이디";
            AccountAuth.setMsg(msgBox, ""); // Core 모듈 활용
        }
    });

    // 실시간 유효성 검사
    idInput.addEventListener("input", () => {
        const val = idInput.value.trim();
        if (val === "") {
            AccountAuth.setMsg(msgBox, "");
            return;
        }

        // Core 모듈 활용
        if (!AccountAuth.validateEmail(val)) {
            AccountAuth.setMsg(msgBox, "올바른 이메일 형식이 아닙니다.", "error");
        } else {
            AccountAuth.setMsg(msgBox, "사용 가능한 이메일입니다.", "success");
        }
    });
}

// =========================================
// [기능 2] 닉네임 실시간 검사
// =========================================
function initNicknameCheck() {
    const input = document.getElementById("regNick");
    const msgBox = document.getElementById("nickCheckMsg");
    if (!input || !msgBox) return;

    const runCheck = () => {
        const val = input.value.trim();
        if (val === "") {
            AccountAuth.setMsg(msgBox, "");
            return;
        }
        if (!AccountAuth.validateNickname(val)) {
            AccountAuth.setMsg(msgBox, "닉네임은 2~10자여야 합니다.", "error");
            return;
        }
        if (AccountAuth.checkNicknameDuplicate(val)) {
            AccountAuth.setMsg(msgBox, "이미 사용 중인 닉네임입니다.", "error");
        } else {
            AccountAuth.setMsg(msgBox, "사용 가능한 닉네임입니다.", "success");
        }
    };
    input.addEventListener("input", runCheck);
}

// =========================================
// [기능 3] 비밀번호 실시간 검사 (보안 규격 적용)
// =========================================
function initPasswordCheck() {
    const pwInput = document.getElementById("regPw");
    const pwCheckInput = document.getElementById("regPwCheck");
    const pwMsg = document.getElementById("pwCheckMsg"); 
    const pwConfirmMsg = document.getElementById("pwCheckMsgConfirm");

    if (!pwInput || !pwCheckInput) return;

    pwInput.addEventListener("input", () => {
        const val = pwInput.value;
        if (val === "") {
            AccountAuth.setMsg(pwMsg, "");
            return;
        }
        
        if (!AccountAuth.validatePassword(val)) {
            AccountAuth.setMsg(pwMsg, "8자 이상 64자 이하로 입력해주세요.", "error");
        } else {
            AccountAuth.setMsg(pwMsg, "사용 가능한 비밀번호입니다.", "success");
        }
        checkMatch();
    });

    pwCheckInput.addEventListener("input", checkMatch);

    function checkMatch() {
        const pw = pwInput.value;
        const check = pwCheckInput.value;
        
        if (!pwConfirmMsg) return;

        if (check === "") {
            AccountAuth.setMsg(pwConfirmMsg, "");
            return;
        }

        if (pw !== check) {
            AccountAuth.setMsg(pwConfirmMsg, "비밀번호가 일치하지 않습니다.", "error");
        } else {
            AccountAuth.setMsg(pwConfirmMsg, "비밀번호가 일치합니다.", "success");
        }
    }
}

// =========================================
// [기능 4] 회원가입 제출 (UID 발급 및 데이터 저장)
// =========================================
function initSubmit() {
    const form = document.querySelector(".register-form");
    if (!form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const id = document.getElementById("regId").value.trim();
        const nick = document.getElementById("regNick").value.trim();
        const pw = document.getElementById("regPw").value;
        const pwCheck = document.getElementById("regPwCheck").value;

        // 최종 유효성 검사 (Core 모듈 활용)
        if (!AccountAuth.validateEmail(id)) {
            alert("아이디는 이메일 형식으로 입력해주세요.");
            document.getElementById("regId").focus();
            return;
        }
        if (!AccountAuth.validateNickname(nick) || AccountAuth.checkNicknameDuplicate(nick)) {
            alert("닉네임을 확인해주세요.");
            document.getElementById("regNick").focus();
            return;
        }
        if (!AccountAuth.validatePassword(pw) || pw !== pwCheck) {
            alert("비밀번호는 8자 이상 64자 이하이며, 재입력과 일치해야 합니다.");
            document.getElementById("regPw").focus();
            return;
        }

        // ==============================================
        // [핵심 아키텍처] UID 발급 및 소셜 확장성 데이터 저장
        // ==============================================
        
        // 1. 고유 식별자(NanoID) 발급
        const newUserUID = AccountAuth.generateUID();

        // 2. 소셜 연동 정보를 포함한 메타데이터 객체 생성
        const authData = {
            provider: "local",      // 가입 경로 (local, kakao, google 등)
            provider_id: newUserUID // 로컬 가입은 UID를 자체 고유키로 사용
        };

        // 3. Mock DB (로컬스토리지)에 저장
        localStorage.setItem("user_uid", newUserUID); // 불변 식별자
        localStorage.setItem("user_email", id);       // 가변 식별자 (로그인 ID)
        localStorage.setItem("user_nick", nick);
        localStorage.setItem("user_pw", pw);
        localStorage.setItem("user_auth", JSON.stringify(authData)); // 소셜 연동 대비

        alert("회원가입이 완료되었습니다!\n로그인 페이지로 이동합니다.");
        location.replace("account-login.html");
    });
}