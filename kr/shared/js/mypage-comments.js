/**
 * [My Page Comment Module]
 * 내 댓글 목록을 관리하고 렌더링하는 모듈
 */
class MyPageComments {
    constructor() {
        this.container = document.getElementById("myCommentsList");
        this.statusEl = document.getElementById("comments-status");
        
        // 초기화
        if (this.container) {
            this.init();
        }
    }

    init() {
        // 데이터 로드 및 렌더링 실행
        this.render();
    }

    /**
     * 댓글 데이터를 가져오고 HTML을 렌더링합니다.
     */
    render() {
        const myNick = localStorage.getItem("user_nick");

        // 1. 로그인 체크 (방어 코드)
        if (!myNick) {
            this.showEmpty("로그인 정보가 없습니다.");
            return;
        }

        // 2. 데이터 추출 (기존 로직 유지)
        const myComments = this.fetchMyComments(myNick);

        // 3. 렌더링
        if (myComments.length === 0) {
            this.showEmpty("작성한 댓글이 없습니다.");
            return;
        }

        this.container.innerHTML = myComments.map(c => this.createItemHTML(c)).join("");
    }

    /**
     * MOCK_DB에서 내 댓글을 필터링하여 가져옵니다.
     * (추후 실제 API 호출로 대체될 부분)
     */
    fetchMyComments(myNick) {
        const myComments = [];
        
        if (typeof MOCK_DB !== 'undefined' && MOCK_DB.POSTS) {
            MOCK_DB.POSTS.forEach(post => {
                if (post.commentList && Array.isArray(post.commentList)) {
                    post.commentList.forEach(cmt => {
                        if (cmt.writer === myNick) {
                            myComments.push({
                                ...cmt,
                                postTitle: post.title,
                                postId: post.no
                            });
                        }
                    });
                }
            });
        }
        
        // 최신순 정렬 (날짜가 있다면)
        myComments.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        return myComments;
    }

    /**
     * 개별 댓글 아이템 HTML 생성
     */
    createItemHTML(c) {
        // 날짜 포맷팅 (common.js의 함수 활용, 없으면 원본 사용)
        const dateStr = window.formatBoardDate ? window.formatBoardDate(c.date) : c.date;

        return `
        <a href="post.html?id=${c.postId}" class="my-item">
            <span class="my-item-title">${this.escapeHtml(c.content)}</span>
            <div class="my-item-meta">
                <span class="origin-post-link">원문: ${this.escapeHtml(c.postTitle)}</span>
                <span class="date">${dateStr}</span>
            </div>
        </a>
        `;
    }

    /**
     * 빈 상태 메시지 출력
     */
    showEmpty(message) {
        this.container.innerHTML = `<div class="empty-msg">${message}</div>`;
    }

    /**
     * XSS 방지를 위한 간단한 이스케이프 유틸
     */
    escapeHtml(text) {
        if (!text) return "";
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// [모듈 실행]
// 메인 mypage.js에서 탭이 전환될 때 인스턴스를 생성하거나,
// 여기서 전역 객체에 할당하여 외부에서 호출할 수 있게 합니다.
window.MyPageCommentsManager = new MyPageComments();