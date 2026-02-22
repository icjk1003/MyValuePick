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
    // 버튼 활성화
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-target') === targetId);
    });

    // 콘텐츠 표시
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

        // [TODO] 향후 account-auth.js 의 공통 validateEmail(email) 함수로 유효성 검사 교체 권장

        // [Mock Logic] 테스트를 위해 특정 이메일만 성공 처리
        // 실제로는 서버 API를 호출해야 합니다.
        // 여기서는 로컬스토리지에 저장된 정보와 비교합니다.
        const storedEmail = localStorage.getItem('user_email');
        
        if (email === storedEmail || email === 'user@email.com') {
            // 성공 시 결과 표시
            resultText.textContent = localStorage.getItem('user_id') || 'ValuePicker123';
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
        const id = inputId.value.trim();
        const email = inputEmail.value.trim();

        if (!id || !email) {
            alert('아이디와 이메일을 모두 입력해주세요.');
            return;
        }

        // [Mock Logic]
        // [TODO] 향후 이메일 형식 검사 등은 account-auth.js 모듈을 활용하도록 개선
        if (id.length > 3 && email.includes('@')) {
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