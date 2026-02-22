/* kr/shared/js/mypage/mypage-core.js */

/**
 * [My Page Core Module]
 * 마이페이지의 전반적인 상태 관리, 라우팅, 초기화를 담당
 */
document.addEventListener("DOMContentLoaded", () => {
    // 1. 로그인 여부 확인
    const isLogged = localStorage.getItem("is_logged_in");
    
    if (!isLogged || isLogged !== "true") {
        alert("로그인이 필요합니다.");
        // [변경됨] 새 아키텍처 구조의 로그인 페이지로 강제 이동
        location.replace("../account/account-login.html");
        return;
    }

    // 2. 마이페이지 컨트롤러 초기화
    initMyPageController();
});

function initMyPageController() {
    // [Init 1] 사이드바 프로필 정보 로드
    loadSidebarProfile();

    // [Init 2] URL 파라미터를 기반으로 초기 섹션(탭) 설정
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section') || 'edit'; // 기본값: 내 정보 수정
    const tab = urlParams.get('tab');   // 쪽지함 내부 탭 (inbox 등)
    const msgId = urlParams.get('id');  // 쪽지 상세 ID

    // 섹션 전환 실행
    showMypageSection(section, false);

    // [Init 3] 쪽지함 상세 진입 처리 (딥링크 지원)
    if (section === 'messages') {
        if (tab && window.MyPageNoteManager) {
            window.MyPageNoteManager.switchTab(tab);
        }
        if (msgId && window.MyPageNoteManager) {
            // 데이터 로드 타이밍 확보를 위해 지연 실행
            setTimeout(() => window.MyPageNoteManager.openMessage(msgId), 100);
        }
    }
}

/**
 * 사이드바 프로필(이미지, 닉네임, 이메일) 렌더링
 */
function loadSidebarProfile() {
    const myNick = localStorage.getItem("user_nick") || "Guest";
    const myEmail = localStorage.getItem("user_email") || "이메일 없음";
    
    // 텍스트 설정
    const nickEl = document.getElementById("myNickDisplay");
    const emailEl = document.getElementById("myEmailDisplay");
    
    if (nickEl) nickEl.textContent = myNick;
    if (emailEl) emailEl.textContent = myEmail;

    // 프로필 이미지 설정 (window.getProfileImage가 common.js에 있다면 사용)
    const imgEl = document.getElementById("myProfileImg");
    if (imgEl) {
        const storedImg = localStorage.getItem("user_img");
        // 저장된 이미지가 있으면 사용, 없으면 더미 이미지
        imgEl.src = storedImg || "https://via.placeholder.com/150?text=User";
    }
}

/**
 * 섹션 전환 (Router 역할)
 * @param {string} type - 섹션 ID (edit, messages, posts, comments, social)
 * @param {boolean} updateHistory - URL 히스토리 변경 여부
 */
window.showMypageSection = function(type, updateHistory = true) {
    // 1. 모든 섹션 숨김 & 메뉴 비활성화
    document.querySelectorAll('.mypage-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.mypage-menu a').forEach(el => el.classList.remove('active'));

    // 2. 타겟 섹션 활성화
    const targetSec = document.getElementById(`section-${type}`);
    const targetMenu = document.getElementById(`menu-${type}`);

    if (targetSec) targetSec.classList.remove('hidden');
    if (targetMenu) targetMenu.classList.add('active');

    // 3. 모듈별 데이터 렌더링 (Lazy Load / Re-render)
    if (type === 'posts' && window.MyPagePostManager) {
        window.MyPagePostManager.render();
    }
    if (type === 'comments' && window.MyPageCommentsManager) {
        window.MyPageCommentsManager.render();
    }
    if (type === 'social' && window.MyPageSocialManager) {
        window.MyPageSocialManager.init(); // 상태 최신화
    }

    // 4. URL 히스토리 업데이트
    if (updateHistory) {
        const url = new URL(window.location);
        url.searchParams.set('section', type);
        
        // 섹션 변경 시 하위 파라미터(쪽지함 탭 등) 정리
        if (type !== 'messages') {
            url.searchParams.delete('tab');
            url.searchParams.delete('id');
        }
        window.history.pushState({}, '', url);
    }
};

/**
 * 로그아웃
 */
window.logout = function() {
    if (confirm("로그아웃 하시겠습니까?")) {
        // [보안] 세션 관련 데이터 모두 삭제 (ID, Role, Tier 등)
        localStorage.removeItem("is_logged_in");
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_role");
        localStorage.removeItem("user_tier");
        
        alert("로그아웃 되었습니다.");
        // [변경됨] 상위 폴더의 홈 화면으로 이동
        location.replace("../home.html");
    }
};