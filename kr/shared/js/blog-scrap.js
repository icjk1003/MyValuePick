/* kr/shared/js/blog-scrap.js */

window.BlogScrapManager = {
    init: function() {
        console.log("Blog Scrap Init");
        this.bindEvents();
        this.loadScraps();
    },

    bindEvents: function() {
        const searchInput = document.getElementById("scrapSearchInput");
        const btnSearch = document.getElementById("btnScrapSearch");

        if (btnSearch) {
            btnSearch.onclick = () => this.loadScraps();
        }
        if (searchInput) {
            searchInput.addEventListener("keyup", (e) => {
                if (e.key === "Enter") this.loadScraps();
            });
        }
    },

    loadScraps: function() {
        const listContainer = document.getElementById("blogScrapList");
        const emptyState = document.getElementById("blogScrapEmpty");
        const totalCount = document.getElementById("totalScrapCount");
        const pagination = document.getElementById("blogScrapPagination");

        // 로딩 초기화
        listContainer.innerHTML = '<div class="loading-spinner"></div>';
        emptyState.classList.add("hidden");
        pagination.classList.add("hidden");

        // [더미 데이터]
        const dummyScraps = [
            {
                id: 101,
                originTitle: "워렌 버핏의 2024 주주서한 요약 번역",
                originWriter: "가치투자연구소",
                originDate: "2024.09.20",
                scrapDate: "2024.10.05",
                summary: "현금 비중 확대와 일본 상사 투자에 대한 버핏의 견해가 담겨있다. 필독!",
                link: "javascript:void(0)" 
            },
            {
                id: 102,
                originTitle: "반도체 공정 기초 : 전공정과 후공정의 이해",
                originWriter: "TechGuru",
                originDate: "2024.08.15",
                scrapDate: "2024.10.02",
                summary: "HBM 관련주 공부하기 전에 기초부터 다시 잡기 위해 스크랩함.",
                link: "javascript:void(0)"
            },
            {
                id: 103,
                originTitle: "FOMC 의사록 해석 및 향후 금리 시나리오",
                originWriter: "MacroView",
                originDate: "2024.09.28",
                scrapDate: "2024.09.30",
                summary: "", // 코멘트가 없는 경우
                link: "javascript:void(0)"
            },
            {
                id: 104,
                originTitle: "[공지] MyValuePick 서비스 점검 안내",
                originWriter: "운영자",
                originDate: "2024.09.10",
                scrapDate: "2024.09.12",
                summary: "서비스 점검 일정 확인용",
                link: "javascript:void(0)"
            }
        ];

        // 렌더링
        setTimeout(() => {
            if (dummyScraps.length > 0) {
                if (totalCount) totalCount.textContent = dummyScraps.length;
                listContainer.innerHTML = dummyScraps.map(item => this.createScrapItem(item)).join('');
                pagination.classList.remove("hidden");
                
                // 페이지네이션 예시
                pagination.innerHTML = `<button class="page-btn active">1</button>`;
            } else {
                if (totalCount) totalCount.textContent = 0;
                listContainer.innerHTML = '';
                emptyState.classList.remove("hidden");
            }
        }, 300);
    },

    createScrapItem: function(item) {
        // 코멘트(summary)가 있으면 표시, 없으면 숨김
        const summaryHtml = item.summary 
            ? `<p class="scrap-comment">"${item.summary}"</p>` 
            : '';

        return `
            <div class="scrap-item" onclick="location.href='${item.link}'">
                <div class="scrap-icon-col">
                    <span class="scrap-icon">📂</span>
                </div>
                <div class="scrap-content-col">
                    <h3 class="origin-title">${item.originTitle}</h3>
                    <div class="origin-meta">
                        <span class="writer">By. ${item.originWriter}</span>
                        <span class="divider">|</span>
                        <span class="date">작성일 ${item.originDate}</span>
                    </div>
                    ${summaryHtml}
                    <div class="scrap-date">스크랩: ${item.scrapDate}</div>
                </div>
                <div class="scrap-action-col">
                    <button class="btn-goto" title="원본 글로 이동">➔</button>
                </div>
            </div>
        `;
    }
};