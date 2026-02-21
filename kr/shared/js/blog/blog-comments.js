/* kr/shared/js/blog/blog-comments.js */

window.BlogCommentsManager = {
    /**
     * 초기화 함수 (페이지 로드 시 호출)
     */
    init: function() {
        console.log("Blog Comments Manager Init");
        this.loadComments();
    },

    /**
     * 댓글 데이터 로드
     */
    loadComments: function() {
        const listContainer = document.getElementById("blogCommentList");
        const emptyState = document.getElementById("blogCommentEmpty");
        const countEl = document.getElementById("totalCommentCount");
        const pagination = document.getElementById("blogCommentPagination");

        // UI 초기화
        listContainer.innerHTML = '';
        emptyState.classList.add('hidden');
        if(pagination) pagination.classList.add('hidden');

        // [더미 데이터] 실제 서버 API 연동 시 fetch로 대체
        // 예: fetch('/api/user/comments')...
        const dummyData = [
            {
                id: 101,
                postTitle: "2024년 하반기 반도체 섹터 전망 분석글",
                postUrl: "javascript:void(0)", // 실제 링크: post-view.html?id=...
                content: "좋은 분석 감사합니다! 특히 HBM 관련 내용이 인상 깊네요. 혹시 관련주 리스트도 공유 가능하실까요?",
                date: "2024.10.05 14:30",
                replyCount: 2
            },
            {
                id: 102,
                postTitle: "미국 금리 인하 시점 예측과 투자 전략",
                postUrl: "javascript:void(0)",
                content: "저도 동의합니다. 11월 전에는 움직임이 있을 것 같네요.",
                date: "2024.10.01 09:15",
                replyCount: 0
            },
            {
                id: 103,
                postTitle: "초보자를 위한 재무제표 보는 법 (PER, PBR)",
                postUrl: "javascript:void(0)",
                content: "스크랩해갑니다. 유익한 정보 감사합니다.",
                date: "2024.09.28 18:20",
                replyCount: 1
            },
            {
                id: 104,
                postTitle: "오늘의 증시 요약 (코스피/코스닥)",
                postUrl: "javascript:void(0)",
                content: "오늘 장은 정말 힘들었네요 ㅠㅠ 내일은 반등하길...",
                date: "2024.09.25 16:00",
                replyCount: 5
            }
        ];

        // 데이터 렌더링
        setTimeout(() => { // 로딩 효과 연출을 위한 지연
            if (dummyData.length > 0) {
                listContainer.innerHTML = dummyData.map(item => this.createCommentItem(item)).join('');
                if(countEl) countEl.textContent = dummyData.length;
            } else {
                emptyState.classList.remove('hidden');
                if(countEl) countEl.textContent = 0;
            }
        }, 300);
    },

    /**
     * 개별 댓글 HTML 생성
     */
    createCommentItem: function(item) {
        return `
            <div class="blog-comment-item" onclick="location.href='${item.postUrl}'">
                <div class="comment-head">
                    <span class="target-post">📄 ${item.postTitle}</span>
                    <span class="meta-date">${item.date}</span>
                </div>
                <div class="comment-body">
                    ${item.content}
                </div>
                <div class="comment-foot">
                    <span class="reply-badge ${item.replyCount > 0 ? 'active' : ''}">
                        답글 ${item.replyCount}
                    </span>
                </div>
            </div>
        `;
    }
};