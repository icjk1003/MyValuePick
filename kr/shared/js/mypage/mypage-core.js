/* shared/js/mypage/mypage-core.js */

/**
 * [My Page Core Module]
 * 마이페이지의 전반적인 상태 관리, 라우팅, 초기화를 담당 (비동기 DB_API 연동 완료)
 */
document.addEventListener("DOMContentLoaded", () => {
    // 1. 로그인 여부 확인 (userId 유무로 체크)
    const userId = localStorage.getItem("user_id");
    if (!userId) {
        alert("로그인이 필요합니다.");
        location.replace("/kr/html/account/account-login.html");
        return;
    }

    // 2. 마이페이지 컨트롤러 초기화
    initMyPageController();
});

function initMyPageController() {
    // [Init 1] 서버에서 최신 프로필 정보 로드 (비동기)
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
 * [변경] 서버(DB_API)에서 최신 유저 정보를 조회하여 사이드바에 렌더링
 */
async function loadSidebarProfile() {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;

    try {
        // DB_API를 통해 최신 회원 정보 가져오기
        const user = await DB_API.getUserProfile(userId);

        // 로컬 스토리지 정보 최신화 (다른 페이지에서 캐시로 사용하기 위함)
        localStorage.setItem("user_nick", user.nickname);
        localStorage.setItem("user_email", user.email);
        if (user.profileImg) {
            localStorage.setItem("user_profile_img", user.profileImg);
        }

        // 화면(DOM) 업데이트
        const nickEl = document.getElementById("myNickDisplay");
        const emailEl = document.getElementById("myEmailDisplay");
        const imgEl = document.getElementById("myProfileImg");
        
        if (nickEl) nickEl.textContent = user.nickname;
        if (emailEl) emailEl.textContent = user.email;
        if (imgEl) imgEl.src = user.profileImg || "https://via.placeholder.com/150?text=User";

    } catch (error) {
        console.error("유저 정보를 불러오는 중 오류 발생:", error);
        
        // 네트워크 에러 시 기존 로컬 스토리지에 저장된 데이터로 폴백(Fallback) 렌더링
        const myNick = localStorage.getItem("user_nick") || "Guest";
        const myEmail = localStorage.getItem("user_email") || "이메일 없음";
        const myImg = localStorage.getItem("user_profile_img") || "https://via.placeholder.com/150?text=User";

        const nickEl = document.getElementById("myNickDisplay");
        const emailEl = document.getElementById("myEmailDisplay");
        const imgEl = document.getElementById("myProfileImg");

        if (nickEl) nickEl.textContent = myNick;
        if (emailEl) emailEl.textContent = myEmail;
        if (imgEl) imgEl.src = myImg;
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
    // 각 하위 매니저들도 추후 비동기 연동 방식으로 동작하도록 준비
    if (type === 'posts' && window.MyPagePostManager) {
        window.MyPagePostManager.render();
    }
    if (type === 'comments' && window.MyPageCommentsManager) {
        window.MyPageCommentsManager.render();
    }
    if (type === 'social' && window.MyPageSocialManager) {
        window.MyPageSocialManager.init(); 
    }
    // Info(edit)와 Messages(note)는 내부 상태를 관리하므로 자체 초기화 이용

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
 * [변경] 로그아웃 시 관련된 모든 세션 데이터 삭제
 */
window.logout = function() {
    if (confirm("로그아웃 하시겠습니까?")) {
        // 로그인/유저 관련 스토리지 데이터 모두 클리어
        localStorage.removeItem("is_logged_in");
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_nick");
        localStorage.removeItem("user_email");
        localStorage.removeItem("user_profile_img");
        
        alert("로그아웃 되었습니다.");
        location.replace("/kr/html/home.html");
    }
};