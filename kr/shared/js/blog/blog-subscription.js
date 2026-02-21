/* kr/shared/js/blog/blog-subscription.js */

window.BlogSubscriptionManager = {
    init: function() {
        console.log("Blog Subscription Init");
        this.bindEvents();
        this.loadSubscriptions();
    },

    bindEvents: function() {
        const searchInput = document.getElementById("subSearchInput");
        const btnSearch = document.getElementById("btnSubSearch");

        if (btnSearch) {
            btnSearch.onclick = () => this.loadSubscriptions();
        }
        if (searchInput) {
            searchInput.addEventListener("keyup", (e) => {
                if (e.key === "Enter") this.loadSubscriptions();
            });
        }
    },

    loadSubscriptions: function() {
        const listContainer = document.getElementById("blogSubList");
        const emptyState = document.getElementById("blogSubEmpty");
        const totalCount = document.getElementById("totalSubCount");

        // 초기화
        listContainer.innerHTML = '<div class="loading-spinner"></div>';
        emptyState.classList.add("hidden");

        // [더미 데이터]
        const dummySubs = [
            {
                id: 101,
                nick: "가치투자연구소",
                bio: "기업의 본질적 가치를 분석합니다.",
                img: "https://via.placeholder.com/80?text=V",
                hasNew: true, // 새 글 여부
                postCount: 124
            },
            {
                id: 102,
                nick: "차트의신",
                bio: "기술적 분석과 트레이딩 전략 공유",
                img: "", // 이미지 없음 -> 기본 아바타
                hasNew: false,
                postCount: 89
            },
            {
                id: 103,
                nick: "배당주콜렉터",
                bio: "월 100만원 배당 받기 프로젝트 진행 중입니다. 함께 공부해요!",
                img: "https://via.placeholder.com/80?text=D",
                hasNew: true,
                postCount: 45
            },
            {
                id: 104,
                nick: "GlobalMacro",
                bio: "거시 경제와 환율 흐름 체크",
                img: "",
                hasNew: false,
                postCount: 210
            },
            {
                id: 105,
                nick: "주린이성장기",
                bio: "좌충우돌 투자 일지",
                img: "",
                hasNew: false,
                postCount: 12
            }
        ];

        // 렌더링
        setTimeout(() => {
            if (dummySubs.length > 0) {
                if(totalCount) totalCount.textContent = dummySubs.length;
                
                // 그리드 클래스 적용
                listContainer.className = "sub-list-grid"; 
                listContainer.innerHTML = dummySubs.map(item => this.createSubCard(item)).join('');
            } else {
                if(totalCount) totalCount.textContent = 0;
                listContainer.innerHTML = '';
                emptyState.classList.remove("hidden");
            }
        }, 300);
    },

    // 구독 취소 핸들러
    unsubscribe: function(id, nick) {
        if (confirm(`'${nick}' 님의 구독을 취소하시겠습니까?`)) {
            // [TODO] 서버 API 호출
            alert("구독이 취소되었습니다.");
            
            // UI에서 카드 제거 (리로드 없이)
            const card = document.getElementById(`sub-card-${id}`);
            if (card) {
                card.remove();
                
                // 카운트 감소
                const countEl = document.getElementById("totalSubCount");
                if(countEl) countEl.textContent = parseInt(countEl.textContent) - 1;

                // 0명이 되면 Empty State 표시
                const list = document.getElementById("blogSubList");
                if(list.children.length === 0) {
                    document.getElementById("blogSubEmpty").classList.remove("hidden");
                }
            }
        }
    },

    createSubCard: function(item) {
        // 이미지 처리
        const imgHtml = item.img 
            ? `<img src="${item.img}" alt="${item.nick}">` 
            : `<div class="default-avatar-large">${item.nick.charAt(0)}</div>`;

        // 새 글 뱃지
        const newBadge = item.hasNew 
            ? `<span class="badge-new">N</span>` 
            : '';

        return `
            <div class="sub-card" id="sub-card-${item.id}">
                <div class="card-top">
                    <div class="sub-profile-img">
                        ${imgHtml}
                        ${newBadge}
                    </div>
                    <h3 class="sub-nick" onclick="location.href='javascript:void(0)'">${item.nick}</h3>
                    <p class="sub-bio">${item.bio}</p>
                </div>
                <div class="card-mid">
                    <span class="stat-text">게시글 <strong>${item.postCount}</strong></span>
                </div>
                <div class="card-bot">
                    <button class="btn-visit" onclick="location.href='javascript:void(0)'">블로그 방문</button>
                    <button class="btn-unsub" onclick="BlogSubscriptionManager.unsubscribe(${item.id}, '${item.nick}')">구독중</button>
                </div>
            </div>
        `;
    }
};