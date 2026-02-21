/* kr/shared/js/post-core.js */

// 전역 네임스페이스 정의 (다른 모듈들이 여기에 붙음)
window.PostManager = window.PostManager || {};

// [Core] 설정 및 데이터 공유
window.PostManager.postId = null;
window.PostManager.currentUser = null;

window.PostManager.init = function() {
    // 1. URL 파라미터 파싱
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id') || params.get('no');
    
    if (!idParam) {
        alert("잘못된 접근입니다.");
        location.href = '/kr/html/board.html';
        return;
    }
    
    this.postId = parseInt(idParam);
    
    // 2. 로그인 정보 로드
    this.checkUserStatus();

    // 3. 각 모듈 초기화 (순차 실행)
    if (this.View && typeof this.View.init === 'function') {
        this.View.init();
    }
    
    if (this.Comments && typeof this.Comments.init === 'function') {
        this.Comments.init();
    }
    
    if (this.Board && typeof this.Board.init === 'function') {
        this.Board.init();
    }

    console.log(`[PostManager] Initialized for Post ID: ${this.postId}`);
};

// 로그인 상태 체크 (모듈들이 공유할 정보 설정)
window.PostManager.checkUserStatus = function() {
    const isLoggedIn = localStorage.getItem("is_logged_in") === "true";
    if (isLoggedIn) {
        this.currentUser = {
            id: localStorage.getItem("user_id"),
            nick: localStorage.getItem("user_nick")
        };
    } else {
        this.currentUser = null;
    }
};

// [공통 헬퍼] 게시글 데이터 가져오기 (MOCK_DB 또는 LocalStorage)
window.PostManager.getPostData = function(id) {
    if (typeof MOCK_DB === 'undefined') {
        console.error("[PostManager] MOCK_DB not loaded.");
        return null;
    }

    // 1. MOCK_DB에서 검색
    let post = MOCK_DB.POSTS.find(p => p.no === id || p.id === id);
    
    // 2. 없으면 LocalStorage에서 검색
    if (!post) {
        const localPosts = JSON.parse(localStorage.getItem("posts") || "[]");
        post = localPosts.find(p => p.id === id || p.no === id);
    }
    
    return post;
};

// 실행 진입점
document.addEventListener("DOMContentLoaded", () => {
    window.PostManager.init();
});