/* kr/shared/js/blog/blog-post.js */

window.BlogPostManager = {
    init: function() {
        console.log("Blog Post Init");
        this.bindEvents();
        this.loadPosts();
    },

    bindEvents: function() {
        // 검색 버튼 및 엔터키
        const searchInput = document.getElementById("postSearchInput");
        const btnSearch = document.getElementById("btnPostSearch");
        const sortFilter = document.getElementById("postSortFilter");

        if (btnSearch) {
            btnSearch.onclick = () => this.loadPosts();
        }
        if (searchInput) {
            searchInput.addEventListener("keyup", (e) => {
                if (e.key === "Enter") this.loadPosts();
            });
        }
        // 정렬 변경 시 자동 재조회
        if (sortFilter) {
            sortFilter.onchange = () => this.loadPosts();
        }
    },

    loadPosts: function() {
        const listContainer = document.getElementById("blogPostList");
        const emptyState = document.getElementById("blogPostEmpty");
        const totalCountEl = document.getElementById("totalPostCount");
        const pagination = document.getElementById("blogPostPagination");

        // 로딩 상태 표시
        listContainer.innerHTML = '<div class="loading-spinner"></div>';
        emptyState.classList.add("hidden");
        pagination.classList.add("hidden");

        // [더미 데이터]
        const dummyPosts = [
            {
                id: 10,
                title: "삼성전자 3분기 실적 발표와 향후 주가 전망",
                desc: "메모리 반도체 업황의 회복세가 뚜렷하게 나타나고 있습니다. HBM 관련 매출 비중이 늘어나면서...",
                category: "종목분석",
                date: "2024.10.08",
                views: 1250,
                comments: 15,
                thumb: "" // 이미지 없음
            },
            {
                id: 9,
                title: "미국 국채 금리 상승, 증시에 미칠 영향은?",
                desc: "10년물 국채 금리가 다시 4%를 돌파했습니다. 고금리 환경이 지속될 경우 성장주 중심의 조정이 예상됩니다.",
                category: "시황",
                date: "2024.10.06",
                views: 890,
                comments: 8,
                thumb: "https://via.placeholder.com/150?text=Chart" // 썸네일 예시
            },
            {
                id: 8,
                title: "초보자를 위한 ETF 투자 가이드 (S&P500, 나스닥)",
                desc: "개별 종목 선정이 어렵다면 시장 전체를 사는 ETF 투자가 정답일 수 있습니다. 연금저축 계좌를 활용한...",
                category: "투자공부",
                date: "2024.10.03",
                views: 2100,
                comments: 32,
                thumb: ""
            },
            {
                id: 7,
                title: "2차전지 섹터, 바닥은 어디인가?",
                desc: "리튬 가격 하락과 전기차 수요 둔화로 인해 2차전지 관련주들의 주가가 부진합니다. 기술적 반등 위치를...",
                category: "섹터분석",
                date: "2024.09.29",
                views: 1540,
                comments: 20,
                thumb: ""
            },
            {
                id: 6,
                title: "10월 증시 일정 캘린더 정리",
                desc: "주요 경제 지표 발표 일정과 기업 실적 발표일을 정리해 보았습니다. FOMC 의사록 공개일 체크 필수.",
                category: "정보",
                date: "2024.09.25",
                views: 600,
                comments: 2,
                thumb: ""
            }
        ];

        // 렌더링 시뮬레이션
        setTimeout(() => {
            if (dummyPosts.length > 0) {
                if (totalCountEl) totalCountEl.textContent = dummyPosts.length;
                listContainer.innerHTML = dummyPosts.map(post => this.createPostItem(post)).join('');
                pagination.classList.remove("hidden");
                
                // 페이지네이션 그리기 (예시)
                pagination.innerHTML = `
                    <button class="page-btn active">1</button>
                    <button class="page-btn">2</button>
                    <button class="page-btn">3</button>
                `;
            } else {
                if (totalCountEl) totalCountEl.textContent = 0;
                listContainer.innerHTML = '';
                emptyState.classList.remove("hidden");
            }
        }, 300);
    },

    createPostItem: function(post) {
        // 썸네일이 있으면 레이아웃이 바뀜
        const hasThumb = post.thumb ? 'has-thumb' : '';
        const thumbHtml = post.thumb 
            ? `<div class="post-thumb"><img src="${post.thumb}" alt="thumb"></div>` 
            : '';

        return `
            <div class="blog-post-item ${hasThumb}" onclick="location.href='javascript:void(0)'"> ${thumbHtml}
                <div class="post-info">
                    <div class="post-meta-top">
                        <span class="category-badge">${post.category}</span>
                        <span class="post-date">${post.date}</span>
                    </div>
                    <h3 class="post-title">${post.title}</h3>
                    <p class="post-desc">${post.desc}</p>
                    <div class="post-meta-bottom">
                        <span class="stat">조회 ${post.views.toLocaleString()}</span>
                        <span class="stat">댓글 ${post.comments}</span>
                    </div>
                </div>
            </div>
        `;
    }
};