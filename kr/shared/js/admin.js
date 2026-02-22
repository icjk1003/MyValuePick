/* kr/shared/js/admin.js */

document.addEventListener("DOMContentLoaded", () => {
    // 1. 관리자 권한 체크 (보안)
    const userUid = localStorage.getItem("user_uid"); // [수정] user_id -> user_uid로 식별자 통일
    const userRole = localStorage.getItem("user_role");
    
    // 권한이 admin이 아니면 접근 차단
    if (userRole !== 'admin') {
        alert("관리자 권한이 없습니다. 관리자 계정으로 로그인해주세요.");
        location.replace("/kr/html/home.html"); // [수정] 절대 경로로 수정하여 404 에러 방지
        return;
    }

    // 2. 탭 전환 기능
    initTabs();

    // 3. 각 섹션별 데이터 로드 및 기능 초기화
    initCalendarForm();
    loadPostList();
    loadReportList();
    loadUserList();
});

// 탭 전환 로직
function initTabs() {
    const buttons = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.admin-section');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 버튼 활성화 스타일
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 섹션 표시
            const targetId = btn.getAttribute('data-target');
            sections.forEach(sec => sec.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
        });
    });
}

// ----------------------------------------------------
// 1. 증시 캘린더 이벤트 업로드
// ----------------------------------------------------
function initCalendarForm() {
    const form = document.getElementById('calendarForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const date = document.getElementById('calDate').value;
        const type = document.getElementById('calType').value;
        const title = document.getElementById('calTitle').value;
        
        if(!date || !title) return;

        // 실제로는 DB에 저장해야 하지만, 여기선 Mock 처리
        alert(`[이벤트 등록 완료]\n날짜: ${date}\n구분: ${type}\n제목: ${title}`);
        
        // 입력창 초기화
        form.reset();
    });
}

// ----------------------------------------------------
// 2. 게시글 관리 (Mock Data)
// ----------------------------------------------------
function loadPostList() {
    const tbody = document.getElementById('postListBody');
    // MOCK_DB가 있다면 사용, 없으면 더미 데이터 사용
    const posts = (typeof MOCK_DB !== 'undefined' && MOCK_DB.POSTS) ? MOCK_DB.POSTS : [
        { no: 10, title: "삼성전자 전망 분석", writer: "ant123", date: "2024-05-20" },
        { no: 9, title: "오늘장 요약입니다", writer: "profitKing", date: "2024-05-19" },
        { no: 8, title: "배당주 추천 좀 해주세요", writer: "newbie", date: "2024-05-18" },
    ];

    tbody.innerHTML = posts.map(post => `
        <tr>
            <td>${post.no}</td>
            <td>${post.title}</td>
            <td>${post.writer}</td>
            <td>${post.date}</td>
            <td>
                <button class="btn-small btn-view" onclick="window.open('/kr/html/post/post.html?id=${post.no}')">보기</button>
                <button class="btn-small btn-delete" onclick="deletePost(${post.no})">삭제</button>
            </td>
        </tr>
    `).join('');
}

window.deletePost = function(no) {
    if(confirm(`${no}번 게시글을 삭제하시겠습니까?`)) {
        // DB 삭제 로직 호출
        alert("게시글이 삭제되었습니다.");
        // 화면 갱신 (리로드 또는 DOM 제거)
        loadPostList(); 
    }
};

// ----------------------------------------------------
// 3. 신고 관리 (Mock Data)
// ----------------------------------------------------
function loadReportList() {
    const tbody = document.getElementById('reportListBody');
    const reports = [
        { type: "게시글", content: "광고성 도배글입니다...", reason: "스팸/홍보", reporter: "user1", status: "pending" },
        { type: "댓글", content: "욕설이 너무 심해요", reason: "욕설/비하", reporter: "user2", status: "pending" },
    ];

    tbody.innerHTML = reports.map((rep, idx) => `
        <tr id="rep-row-${idx}">
            <td>${rep.type}</td>
            <td>${rep.content}</td>
            <td>${rep.reason}</td>
            <td>${rep.reporter}</td>
            <td><span class="badge pending">대기중</span></td>
            <td>
                <button class="btn-small btn-blind" onclick="processReport(${idx}, 'blind')">블라인드</button>
                <button class="btn-small btn-delete" onclick="processReport(${idx}, 'delete')">삭제</button>
            </td>
        </tr>
    `).join('');
}

window.processReport = function(idx, action) {
    const actionName = action === 'blind' ? '블라인드' : '삭제';
    if(confirm(`해당 항목을 ${actionName} 처리하시겠습니까?`)) {
        alert(`정상적으로 ${actionName} 처리되었습니다.`);
        document.getElementById(`rep-row-${idx}`).remove();
    }
};

// ----------------------------------------------------
// 4. 회원 관리 (Mock Data)
// ----------------------------------------------------
function loadUserList() {
    const tbody = document.getElementById('userListBody');
    const users = [
        { id: "user@email.com", nick: "ant123", joinDate: "2023-12-01", status: "active" },
        { id: "bad@email.com", nick: "spammer", joinDate: "2024-01-15", status: "banned" },
        { id: "new@email.com", nick: "newbie", joinDate: "2024-05-01", status: "active" },
    ];

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.nick}</td>
            <td>${user.joinDate}</td>
            <td>
                <span class="badge ${user.status === 'active' ? 'active' : 'banned'}">
                    ${user.status === 'active' ? '정상' : '정지'}
                </span>
            </td>
            <td>
                ${user.status === 'active' 
                    ? `<button class="btn-small btn-ban" onclick="banUser('${user.nick}')">영구 정지</button>`
                    : `<button class="btn-small btn-view" onclick="unbanUser('${user.nick}')">정지 해제</button>`
                }
            </td>
        </tr>
    `).join('');
}

window.banUser = function(nick) {
    if(confirm(`${nick} 회원을 영구 정지하시겠습니까?`)) {
        alert("회원이 정지 처리되었습니다.");
        loadUserList(); // 목록 갱신 (실제론 DB 업데이트 후)
    }
};

window.unbanUser = function(nick) {
    if(confirm(`${nick} 회원의 정지를 해제하시겠습니까?`)) {
        alert("정지가 해제되었습니다.");
        loadUserList();
    }
};