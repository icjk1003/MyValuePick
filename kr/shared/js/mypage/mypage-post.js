/**
 * [My Page Post Module]
 * 내가 쓴 게시글 목록을 관리하고 렌더링하는 모듈
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
            myNick: localStorage.getItem("user_nick")
        };

        // 초기화
        if (this.els.container) {
            this.init();
        }
    }

    init() {
        // 별도의 이벤트 바인딩이 필요 없으면 바로 렌더링 준비
        // 필요시 탭 전환 이벤트에서 render()를 호출하도록 설계됨
    }

    /**
     * 외부에서 호출 가능한 메인 렌더링 함수
     */
    render() {
        if (!this.state.myNick) {
            this.showEmpty();
            return;
        }

        const myPosts = this.fetchMyPosts();
        
        // 게시글 수 업데이트
        if (this.els.countDisplay) {
            this.els.countDisplay.textContent = myPosts.length;
        }

        if (myPosts.length === 0) {
            this.showEmpty();
            return;
        }

        this.els.emptyMsg.classList.add('hidden');
        
        // (옵션) 페이지네이션 로직이 필요하면 slice 적용
        // 현재는 전체 리스트 렌더링
        this.renderList(myPosts);
    }

    /**
     * 데이터 로드 (Mock DB)
     */
    fetchMyPosts() {
        // MOCK_DB가 로드되지 않았을 경우 대비
        const db = (typeof MOCK_DB !== 'undefined' && MOCK_DB.POSTS) ? MOCK_DB.POSTS : [];
        
        // 작성자 일치 필터링
        const filtered = db.filter(p => p.writer === this.state.myNick);

        // 최신순 정렬 (no가 클수록 최신이라고 가정, 또는 date 비교)
        filtered.sort((a, b) => b.no - a.no);

        return filtered;
    }

    /**
     * 리스트 HTML 생성 및 주입
     */
    renderList(posts) {
        this.els.container.innerHTML = posts.map(post => this.createItemHTML(post)).join("");
    }

    /**
     * 개별 아이템 HTML 생성
     */
    createItemHTML(post) {
        // 날짜 포맷팅 (common.js 함수 활용)
        const dateStr = window.formatBoardDate ? window.formatBoardDate(post.date) : post.date;
        
        // 숫자 포맷팅 (천단위 콤마)
        const views = post.views ? post.views.toLocaleString() : 0;
        const votes = post.votes ? post.votes.toLocaleString() : 0;

        return `
        <a href="/kr/html/post/post.html?id=${post.no}" class="my-item">
            <span class="my-item-title">${this.escapeHtml(post.title)}</span>
            <div class="my-item-meta">
                <span class="meta-tag">${post.tag || '일반'}</span>
                
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
        this.els.container.innerHTML = "";
        this.els.emptyMsg.classList.remove('hidden');
        if (this.els.countDisplay) this.els.countDisplay.textContent = 0;
    }

    escapeHtml(text) {
        if (!text) return "";
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }
}

// [모듈 실행]
// 전역 인스턴스 생성
window.MyPagePostManager = new MyPagePostManager();