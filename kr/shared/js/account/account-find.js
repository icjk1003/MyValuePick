/* kr/shared/js/account/account-find.js */

document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    initFindId();
    initFindPw();

    // URL 파라미터로 초기 탭 설정 (?type=pw)
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    if (type === 'pw') {
        switchTab('find-pw');
    }
});

// =========================================
// [기능 1] 탭 전환 기능
// =========================================
function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-target');
            switchTab(targetId);
        });
    });
}

function switchTab(targetId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-target') === targetId);
    });

    document.querySelectorAll('.find-content').forEach(content => {
        content.classList.toggle('active', content.id === targetId);
    });
}

// =========================================
// [기능 2] 아이디 찾기 로직 (Mock)
// =========================================
function initFindId() {
    const btn = document.getElementById('btnFindId');
    const input = document.getElementById('inputEmailForId');
    const resultArea = document.getElementById('resultAreaId');
    const resultText = document.getElementById('foundIdText');

    if (!btn || !input) return;

    btn.addEventListener('click', () => {
        const email = input.value.trim();

        if (!email) {
            alert('이메일을 입력해주세요.');
            input.focus();
            return;
        }

        // Core 모듈을 활용한 사전 검증
        if (!AccountAuth.validateEmail(email)) {
            alert('올바른 이메일 형식이 아닙니다.');
            input.focus();
            return;
        }

        // [Mock Logic] 로컬스토리지에 저장된 정보와 비교
        const storedEmail = localStorage.getItem('user_email');
        
        if (email === storedEmail || email === 'user@email.com') {
            resultText.textContent = localStorage.getItem('user_email') || 'user@email.com';
            resultArea.classList.remove('hidden');
            btn.classList.add('hidden'); // 버튼 숨김
            input.readOnly = true; // 수정 방지
        } else {
            alert('등록되지 않은 이메일입니다.');
        }
    });
}

// =========================================
// [기능 3] 비밀번호 찾기 로직 (Mock)
// =========================================
function initFindPw() {
    const btn = document.getElementById('btnFindPw');
    const inputId = document.getElementById('inputIdForPw');
    const inputEmail = document.getElementById('inputEmailForPw');
    const resultArea = document.getElementById('resultAreaPw');

    if (!btn || !inputId || !inputEmail) return;

    btn.addEventListener('click', () => {
        const id = inputId.value.trim(); // 아이디로 이메일을 사용하므로 사실상 이메일
        const email = inputEmail.value.trim(); // 가입 시 등록한 보조 이메일(또는 동일)

        if (!id || !email) {
            alert('아이디와 이메일을 모두 입력해주세요.');
            return;
        }

        // Core 모듈을 활용한 사전 검증
        if (!AccountAuth.validateEmail(email)) {
            alert('입력하신 이메일 형식이 올바르지 않습니다.');
            inputEmail.focus();
            return;
        }

        // [Mock Logic]
        if (id.length > 3 && email === localStorage.getItem('user_email')) {
            // 성공 시뮬레이션
            setTimeout(() => {
                resultArea.classList.remove('hidden');
                btn.classList.add('hidden');
                inputId.readOnly = true;
                inputEmail.readOnly = true;
            }, 500);
        } else {
            alert('정보가 일치하지 않습니다.');
        }
    });
}