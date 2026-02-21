/* =========================================
   [공통] 전역 모달 및 드롭다운 제어 (Modals & Dropdowns)
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
    
    /**
     * 1. 공통 드롭다운 및 모달 DOM HTML 문자열 정의
     * - 각 페이지마다 하드코딩하지 않고 JS를 통해 전역으로 한 번만 주입합니다.
     */
    const userDropdownHTML = `
        <div id="globalUserDropdown" class="user-dropdown">
            <div class="user-dropdown-header" id="dropdownUserName">닉네임</div>
            <button class="user-dropdown-item" id="btnOpenMsgModal">
                <span>쪽지 보내기</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            </button>
            <div class="user-dropdown-item">
                <span>게시글 개수</span>
                <span class="count" id="dropdownPostCount">0</span>
            </div>
            <div class="user-dropdown-item">
                <span>댓글 개수</span>
                <span class="count" id="dropdownCommentCount">0</span>
            </div>
            <a href="#" class="user-dropdown-item" id="dropdownBlogLink">
                <span>블로그 방문</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
        </div>
    `;

    const messageModalHTML = `
        <div id="globalMessageModal" class="message-modal-overlay">
            <div class="message-modal">
                <div class="message-modal-header">
                    <h3 class="message-modal-title">쪽지 보내기</h3>
                    <button class="btn-close-modal" id="btnCloseMsgModal">&times;</button>
                </div>
                <div class="message-modal-body">
                    <div class="msg-target-info">받는 사람: <strong id="msgTargetName">닉네임</strong></div>
                    <textarea class="message-textarea" id="msgContent" placeholder="보낼 쪽지 내용을 입력해주세요."></textarea>
                </div>
                <div class="message-modal-footer">
                    <button class="btn" id="btnCancelMsg">취소</button>
                    <button class="btn primary" id="btnSendMsg">보내기</button>
                </div>
            </div>
        </div>
    `;

    /**
     * 2. DOM 주입
     * - body 태그 마지막에 요소 주입하여 모든 페이지에 공통 적용
     */
    document.body.insertAdjacentHTML('beforeend', userDropdownHTML);
    document.body.insertAdjacentHTML('beforeend', messageModalHTML);

    const dropdown = document.getElementById('globalUserDropdown');
    const msgModal = document.getElementById('globalMessageModal');
    let currentTargetName = "";

    /**
     * 3. 닉네임 클릭 이벤트 (이벤트 위임 패턴)
     * - 페이지 내의 '.user-nick-clickable' 클래스를 가진 요소 클릭 시 드롭다운 표시
     */
    document.addEventListener('click', (e) => {
        const target = e.target.closest('.user-nick-clickable');
        
        if (target) {
            e.preventDefault();
            e.stopPropagation(); // 이벤트 버블링 방지

            // data 속성에서 유저 정보 파싱 (없으면 기본값 설정)
            currentTargetName = target.dataset.userName || target.innerText.trim();
            const postCount = target.dataset.postCount || "0";
            const commentCount = target.dataset.commentCount || "0";
            const blogUrl = target.dataset.blogUrl || "#";

            // 드롭다운 내 데이터 렌더링
            document.getElementById('dropdownUserName').innerText = currentTargetName;
            document.getElementById('dropdownPostCount').innerText = postCount;
            document.getElementById('dropdownCommentCount').innerText = commentCount;
            document.getElementById('dropdownBlogLink').href = blogUrl;

            // 드롭다운 위치 지정 (클릭한 닉네임 버튼 바로 밑에 표시되도록 절대 좌표 계산)
            const rect = target.getBoundingClientRect();
            dropdown.style.top = `${rect.bottom + window.scrollY + 8}px`;
            dropdown.style.left = `${rect.left + window.scrollX}px`;
            
            dropdown.classList.add('show');
            return;
        }

        // 드롭다운 외부를 클릭하면 드롭다운 닫기
        if (!e.target.closest('#globalUserDropdown') && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    });

    /**
     * 4. 쪽지 보내기 모달 제어 로직
     */
    // 모달 열기 버튼 이벤트
    document.getElementById('btnOpenMsgModal').addEventListener('click', () => {
        dropdown.classList.remove('show'); // 기존 열려있던 드롭다운 닫기
        document.getElementById('msgTargetName').innerText = currentTargetName; // 받는 사람 설정
        document.getElementById('msgContent').value = ""; // 쪽지 내용 초기화
        msgModal.classList.add('show'); // 팝업 열기
    });

    // 모달 닫기 공통 함수
    const closeMsgModal = () => msgModal.classList.remove('show');
    
    document.getElementById('btnCloseMsgModal').addEventListener('click', closeMsgModal);
    document.getElementById('btnCancelMsg').addEventListener('click', closeMsgModal);

    // 모달 바깥 어두운 배경(오버레이) 클릭 시 닫기
    msgModal.addEventListener('click', (e) => {
        if (e.target === msgModal) closeMsgModal();
    });

    /**
     * 5. 쪽지 전송 로직
     * - 향후 백엔드 API 연동을 위한 함수 스켈레톤
     */
    document.getElementById('btnSendMsg').addEventListener('click', () => {
        const content = document.getElementById('msgContent').value.trim();
        
        if (!content) {
            alert('쪽지 내용을 입력해주세요.');
            return;
        }
        
        // TODO: 백엔드 쪽지 전송 API 연동 위치
        
        alert(`${currentTargetName}님에게 쪽지를 성공적으로 보냈습니다.`);
        closeMsgModal();
    });
});