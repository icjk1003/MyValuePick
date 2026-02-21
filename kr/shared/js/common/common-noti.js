/* =========================================
   [알림] 알림 센터 시스템 및 데이터 제어
   ========================================= */

/**
 * 1. 전역 클릭 이벤트 (알림창 외부 클릭 시 닫기)
 * - 문서 전체에 클릭 이벤트를 걸어, 알림 버튼이나 드롭다운 외부를 클릭하면 창을 닫습니다.
 */
document.addEventListener('click', (e) => {
    const notiBtn = document.getElementById("notiBtnWrap");
    const dropdown = document.getElementById("notiDropdown");
    
    // 드롭다운이 열려있고, 클릭한 타겟이 알림 버튼 영역 내부에 속하지 않을 경우
    if (notiBtn && dropdown && dropdown.classList.contains('show')) {
        if (!notiBtn.contains(e.target)) {
            dropdown.classList.remove('show');
            notiBtn.classList.remove('active');
        }
    }
});

/**
 * 2. 알림 초기 데이터 세팅 (Mock Data)
 * - 실제 서버 통신 전, 로컬 스토리지에 더미 알림 데이터를 생성합니다.
 * - 로그인 시 레이아웃 JS(common-layout.js)에서 호출됩니다.
 */
function initNotifications() {
    if (!localStorage.getItem('my_notifications')) {
        const initialData = [
            // 쪽지 알림 추가 (link 파라미터 중요: section=messages&id=쪽지ID)
            { 
                id: 999, 
                type: 'message', 
                user: '운영자', 
                text: '환영합니다! 첫 쪽지를 확인해보세요.', 
                time: new Date().toISOString(), 
                link: '/kr/html/mypage/mypage.html?section=messages&id=welcome_msg' 
            },
            // 일반 댓글 알림
            { 
                id: 1, 
                type: 'reply', 
                user: '주식고수', 
                text: '댓글을 남겼습니다.', 
                time: new Date().toISOString(), 
                link: '/kr/html/post/post.html?id=1#cmt-0' 
            }
        ];
        localStorage.setItem('my_notifications', JSON.stringify(initialData));
        
        // 쪽지 더미 데이터 초기화 (최초 1회)
        if(!localStorage.getItem("MOCK_MESSAGES")) {
            const welcomeMsg = [{
                id: "welcome_msg",
                sender: "운영자",
                receiver: "me",
                content: "MyValuePick에 오신 것을 환영합니다.\n즐거운 커뮤니티 활동 되세요!",
                date: new Date().toISOString(),
                read: false,
                box: "inbox" // inbox, sent, archive
            }];
            localStorage.setItem("MOCK_MESSAGES", JSON.stringify(welcomeMsg));
        }
    }
}

/**
 * 3. 알림 데이터 로드 및 UI 렌더링
 * - 로컬 스토리지에서 알림 데이터를 읽어와 드롭다운 리스트에 렌더링합니다.
 * - 읽지 않은 알림 개수에 따라 빨간색 뱃지(Badge) 노출 여부를 결정합니다.
 */
function loadNotifications() {
    const listContainer = document.getElementById("notiList");
    const badge = document.getElementById("notiBadge");
    if (!listContainer) return;

    // 로컬 스토리지에서 알림 목록 파싱
    const notis = JSON.parse(localStorage.getItem('my_notifications') || '[]');

    // 알림이 1개라도 있으면 뱃지 표시
    if (badge) {
        badge.style.display = notis.length > 0 ? "block" : "none";
    }

    if (notis.length === 0) {
        listContainer.innerHTML = `<div class="noti-empty">새로운 알림이 없습니다.</div>`;
    } else {
        // 데이터 맵핑 및 HTML 생성 (common-utils.js의 formatBoardDate 활용)
        listContainer.innerHTML = notis.map(n => `
            <div class="noti-item unread" onclick="handleNotiClick(${n.id}, '${n.link}')">
                <div class="noti-content">
                    <div class="noti-msg">
                        ${n.type === 'message' ? '💌 ' : ''}<strong>${n.user}</strong>: ${n.text}
                    </div>
                    <div class="noti-time">${typeof formatBoardDate === 'function' ? formatBoardDate(n.time, true) : n.time}</div>
                </div>
            </div>
        `).join("");
    }
}

/**
 * 4. 개별 알림 클릭 이벤트 처리
 * - 알림 클릭 시 해당 알림을 로컬스토리지 목록에서 제거(읽음 처리)하고 연결된 링크로 이동합니다.
 * @param {number} id - 알림 고유 ID
 * @param {string} link - 이동할 페이지 URL
 */
window.handleNotiClick = function(id, link) {
    let notis = JSON.parse(localStorage.getItem('my_notifications') || '[]');
    // 클릭한 알림을 제외한 나머지 데이터만 다시 저장
    notis = notis.filter(n => n.id !== id);
    localStorage.setItem('my_notifications', JSON.stringify(notis));
    
    location.href = link;
};

/**
 * 5. 알림 모두 읽음 처리
 * - 모든 알림을 비우고 리스트 UI를 즉시 갱신합니다.
 */
window.markAllRead = function() {
    localStorage.setItem('my_notifications', '[]');
    loadNotifications();
};