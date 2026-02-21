/* kr/shared/js/mypage/mypage-post.js */

/**
 * [My Page Post Module]
 * 내가 쓴 게시글 목록을 관리하고 렌더링하는 모듈 (비동기 DB_API 연동 완료)
 */
class MyPagePostManager {
    constructor() {
        // DOM Elements
        this.els = {
            container: document.getElementById("myPostsList"),
            emptyMsg: document.getElementById("posts-empty"),
            pagination: document.getElementById("posts-pagination"),
            countDisplay: document.getElementById("myPostCount")
        };

        // State
        this.state = {
            currentPage: 1,
            itemsPerPage: 10,
            userId: localStorage.getItem("user_id"),
            myNick: localStorage.getItem("user_nick")
        };

        // 초기화
        if (this.els.container) {
            this.init();
        }
    }

    init() {
        // 별도의 이벤트 바인딩이 필요 없으면 바로 렌더링 준비
        // mypage-core.js의 탭 전환 이벤트에서 render()를 호출하도록 설계됨
    }

    /**
     * [변경] 외부에서 호출 가능한 메인 렌더링 함수 (비동기 적용)
     */
    async render() {
        if (!this.state.userId && !this.state.myNick) {
            this.showEmpty();
            return;
        }

        try {
            // 통신 중 로딩 상태 표시
            if (this.els.container) {
                this.els.container.innerHTML = `<div class="loading-msg">게시글을 불러오는 중입니다...</div>`;
            }

            const myPosts = await this.fetchMyPosts();
            
            // 게시글 수 업데이트
            if (this.els.countDisplay) {
                this.els.countDisplay.textContent = myPosts.length;
            }

            if (myPosts.length === 0) {
                this.showEmpty();
                return;
            }

            if (this.els.emptyMsg) this.els.emptyMsg.classList.add('hidden');
            
            // (옵션) 페이지네이션 로직이 필요하면 slice 적용
            // 현재는 전체 리스트 렌더링
            this.renderList(myPosts);

        } catch (error) {
            console.error("내 게시글 목록 로딩 실패:", error);
            if (this.els.container) {
                this.els.container.innerHTML = `<div class="error-msg">게시글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</div>`;
            }
        }
    }

    /**
     * [변경] 비동기 데이터 로드 (DB_API 연동)
     */
    async fetchMyPosts() {
        // 1. 서버(DB_API)에서 전체 게시글 데이터를 비동기로 가져옵니다.
        // 실제 운영 환경에서는 서버 측 API에 userId를 파라미터로 넘겨 필터링된 데이터만 받아오도록 구성하는 것이 좋습니다.
        const allPosts = await DB_API.getPosts();
        
        // 2. 작성자 ID 또는 닉네임이 일치하는 항목만 필터링
        const filtered = allPosts.filter(p => 
            (p.writerId && p.writerId === this.state.userId) || 
            (p.writer && p.writer === this.state.myNick)
        );

        // 3. 최신순 정렬 (날짜 기준 내림차순)
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        return filtered;
    }

    /**
     * 리스트 HTML 생성 및 주입
     */
    renderList(posts) {
        if (!this.els.container) return;
        this.els.container.innerHTML = posts.map(post => this.createItemHTML(post)).join("");
    }

    /**
     * 개별 아이템 HTML 생성
     */
    createItemHTML(post) {
        // 날짜 포맷팅 (common.js 함수 활용 또는 폴백 적용)
        const dateStr = window.formatBoardDate ? window.formatBoardDate(post.date) : post.date.substring(0, 10);
        
        // 숫자 포맷팅 (천단위 콤마)
        const views = post.views ? post.views.toLocaleString() : 0;
        const votes = post.votes ? post.votes.toLocaleString() : 0;

        return `
        <a href="/kr/html/post/post.html?id=${post.id || post.no}" class="my-item">
            <span class="my-item-title">${this.escapeHtml(post.title)}</span>
            <div class="my-item-meta">
                <span class="meta-tag">${this.escapeHtml(post.tag || '일반')}</span>
                
                <div class="meta-stats">
                    <span class="stat-item" title="조회수">
                        👁️ ${views}
                    </span>
                    <span class="stat-item" title="추천수">
                        👍 ${votes}
                    </span>
                </div>

                <span class="meta-date">${dateStr}</span>
            </div>
        </a>
        `;
    }

    showEmpty() {
        if (this.els.container) this.els.container.innerHTML = "";
        if (this.els.emptyMsg) this.els.emptyMsg.classList.remove('hidden');
        if (this.els.countDisplay) this.els.countDisplay.textContent = 0;
    }

    escapeHtml(text) {
        if (!text) return "";
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }
}

// [모듈 실행]
// 전역 인스턴스 생성
window.MyPagePostManager = new MyPagePostManager();