/* shared/js/register.js */

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
    const msgBox = document.getElementById("idCheckMsg"); // 추가된 메시지 박스
    if (!idInput || !msgBox) return;

    // 포커스 UX
    idInput.addEventListener("focus", () => {
        idInput.placeholder = "이메일 (예: user@email.com)";
    });

    idInput.addEventListener("blur", () => {
        if (idInput.value === "") {
            idInput.placeholder = "아이디";
            msgBox.textContent = "";
            msgBox.className = "msg-mini";
        }
    });

    // 실시간 유효성 검사
    idInput.addEventListener("input", () => {
        const val = idInput.value.trim();
        if (val === "") {
            msgBox.textContent = "";
            msgBox.className = "msg-mini";
            return;
        }

        if (!validateEmail(val)) {
            msgBox.textContent = "올바른 이메일 형식이 아닙니다.";
            msgBox.className = "msg-mini error";
        } else {
            msgBox.textContent = "사용 가능한 이메일입니다.";
            msgBox.className = "msg-mini success";
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
            msgBox.textContent = "";
            msgBox.className = "msg-mini";
            return;
        }
        if (val.length < 2 || val.length > 10) {
            msgBox.textContent = "닉네임은 2~10자여야 합니다.";
            msgBox.className = "msg-mini error";
            return;
        }
        if (checkNicknameDuplicate(val)) {
            msgBox.textContent = "이미 사용 중인 닉네임입니다.";
            msgBox.className = "msg-mini error";
        } else {
            msgBox.textContent = "사용 가능한 닉네임입니다.";
            msgBox.className = "msg-mini success";
        }
    };
    input.addEventListener("input", runCheck);
}

// =========================================
// [기능 3] 비밀번호 실시간 검사 (통합 관리)
// =========================================
function initPasswordCheck() {
    const pwInput = document.getElementById("regPw");
    const pwCheckInput = document.getElementById("regPwCheck");
    
    // 비밀번호 필드 메시지 (길이 체크용)
    const pwMsg = document.getElementById("pwCheckMsg"); 
    // 비밀번호 확인 필드 메시지 (일치 여부용)
    const pwConfirmMsg = document.getElementById("pwCheckMsgConfirm");

    if (!pwInput || !pwCheckInput) return;

    // 1. 비밀번호 길이 체크
    pwInput.addEventListener("input", () => {
        const val = pwInput.value;
        if (val === "") {
            if(pwMsg) pwMsg.textContent = "";
            return;
        }
        if (val.length < 4) {
            if(pwMsg) { pwMsg.textContent = "4자 이상 입력해주세요."; pwMsg.className = "msg-mini error"; }
        } else {
            if(pwMsg) { pwMsg.textContent = "사용 가능한 비밀번호입니다."; pwMsg.className = "msg-mini success"; }
        }
        // 비밀번호가 바뀌면 확인창도 다시 체크
        checkMatch();
    });

    // 2. 비밀번호 일치 체크
    pwCheckInput.addEventListener("input", checkMatch);

    function checkMatch() {
        const pw = pwInput.value;
        const check = pwCheckInput.value;
        
        if (!pwConfirmMsg) return;

        if (check === "") {
            pwConfirmMsg.textContent = "";
            pwConfirmMsg.className = "msg-mini";
            return;
        }

        if (pw !== check) {
            pwConfirmMsg.textContent = "비밀번호가 일치하지 않습니다.";
            pwConfirmMsg.className = "msg-mini error";
        } else {
            pwConfirmMsg.textContent = "비밀번호가 일치합니다.";
            pwConfirmMsg.className = "msg-mini success";
        }
    }
}

// =========================================
// [기능 4] 회원가입 제출
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

        if (!validateEmail(id)) {
            alert("아이디는 이메일 형식으로 입력해주세요.");
            document.getElementById("regId").focus();
            return;
        }
        if (nick.length < 2 || nick.length > 10 || checkNicknameDuplicate(nick)) {
            alert("닉네임을 확인해주세요.");
            document.getElementById("regNick").focus();
            return;
        }
        if (pw.length < 4 || pw !== pwCheck) {
            alert("비밀번호를 확인해주세요.");
            document.getElementById("regPw").focus();
            return;
        }

        alert("회원가입이 완료되었습니다!\n로그인 페이지로 이동합니다.");
        location.replace("login.html");
    });
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function checkNicknameDuplicate(targetNick) {
    if (typeof MOCK_DB === 'undefined' || !MOCK_DB.POSTS) return false;
    const allWriters = new Set(MOCK_DB.POSTS.map(p => p.writer));
    MOCK_DB.POSTS.forEach(p => {
        if (p.commentList) p.commentList.forEach(c => allWriters.add(c.writer));
    });
    return allWriters.has(targetNick);
}