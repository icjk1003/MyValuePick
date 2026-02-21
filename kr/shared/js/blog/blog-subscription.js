/* kr/shared/js/blog/blog-subscription.js */

window.BlogSubscriptionManager = {
    targetNick: null,

    async init() {
        console.log("Blog Subscription Init");
        
        // 대상 블로그 닉네임 파악 (URL 파라미터 우선, 없으면 로그인 유저)
        const urlParams = new URLSearchParams(window.location.search);
        this.targetNick = urlParams.get('user') || localStorage.getItem("user_nick");

        this.bindEvents();
        await this.loadSubscriptions();
    },

    bindEvents() {
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

    async loadSubscriptions() {
        const listContainer = document.getElementById("blogSubList");
        const emptyState = document.getElementById("blogSubEmpty");
        const totalCount = document.getElementById("totalSubCount");
        const searchInput = document.getElementById("subSearchInput");

        if (!listContainer) return;

        // UI 초기화 (로딩 상태)
        listContainer.className = ""; // 그리드 클래스 임시 제거
        listContainer.innerHTML = '<div class="loading-msg">구독 목록을 불러오는 중입니다...</div>';
        if (emptyState) emptyState.classList.add("hidden");

        try {
            // 1. 서버에서 구독 데이터 비동기 로드 (User, Post 조인 시뮬레이션)
            let subs = await this.apiGetSubscriptions(this.targetNick);

            // 2. 검색어 필터링 적용
            const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
            if (keyword) {
                subs = subs.filter(s => 
                    (s.nick && s.nick.toLowerCase().includes(keyword)) ||
                    (s.bio && s.bio.toLowerCase().includes(keyword))
                );
            }

            // 3. 렌더링
            if (subs.length > 0) {
                if (totalCount) totalCount.textContent = subs.length;
                
                // 그리드 레이아웃 클래스 적용
                listContainer.className = "sub-list-grid"; 
                listContainer.innerHTML = subs.map(item => this.createSubCard(item)).join('');
            } else {
                if (totalCount) totalCount.textContent = 0;
                listContainer.innerHTML = '';
                if (emptyState) emptyState.classList.remove("hidden");
            }
        } catch (error) {
            console.error("구독 목록 로딩 실패:", error);
            listContainer.innerHTML = '<div class="error-msg">구독 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</div>';
        }
    },

    // 비동기 구독 취소 핸들러
    async unsubscribe(targetId, targetNick) {
        if (!confirm(`'${targetNick}' 님의 구독을 취소하시겠습니까?`)) return;

        try {
            // 버튼 비활성화 (이중 클릭 방지)
            const card = document.getElementById(`sub-card-${targetId}`);
            if (card) {
                const btn = card.querySelector('.btn-unsub');
                if (btn) btn.disabled = true;
            }

            // [서버 API 통신] 구독 취소
            await this.apiUnsubscribe(targetId);
            
            // alert("구독이 취소되었습니다."); // 잦은 알림 방지

            // UI에서 카드 제거 (전체 리로드 방지하여 부드러운 UX 제공)
            if (card) {
                card.remove();
                
                // 카운트 동기화 감소
                const countEl = document.getElementById("totalSubCount");
                if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent || 0) - 1);

                // 목록이 비었으면 Empty State 표시
                const list = document.getElementById("blogSubList");
                if (list && list.children.length === 0) {
                    list.className = ""; // 그리드 해제
                    const emptyState = document.getElementById("blogSubEmpty");
                    if (emptyState) emptyState.classList.remove("hidden");
                }
            }

        } catch (error) {
            console.error("구독 취소 실패:", error);
            alert("구독 취소를 처리하지 못했습니다.");
            
            // 실패 시 버튼 원복
            const card = document.getElementById(`sub-card-${targetId}`);
            if (card) {
                const btn = card.querySelector('.btn-unsub');
                if (btn) btn.disabled = false;
            }
        }
    },

    createSubCard(item) {
        // 이미지 처리 (없으면 닉네임 첫 글자로 아바타 생성)
        const imgHtml = item.img 
            ? `<img src="${this.escapeHtml(item.img)}" alt="${this.escapeHtml(item.nick)}">` 
            : `<div class="default-avatar-large">${this.escapeHtml(item.nick.charAt(0))}</div>`;

        // 새 글 뱃지
        const newBadge = item.hasNew 
            ? `<span class="badge-new">N</span>` 
            : '';

        // 블로그 링크
        const blogUrl = `/kr/html/blog/blog.html?user=${encodeURIComponent(item.nick)}`;

        // 현재 로그인 유저와 블로그 주인이 같은지(내 블로그인지) 확인하여 구독취소 버튼 노출 여부 결정
        const isMyBlog = (this.targetNick === localStorage.getItem("user_nick"));
        const unsubBtn = isMyBlog 
            ? `<button class="btn-unsub" onclick="BlogSubscriptionManager.unsubscribe('${item.id}', '${this.escapeHtml(item.nick)}')">구독중</button>`
            : ``;

        return `
            <div class="sub-card" id="sub-card-${item.id}">
                <div class="card-top">
                    <div class="sub-profile-img clickable" onclick="location.href='${blogUrl}'">
                        ${imgHtml}
                        ${newBadge}
                    </div>
                    <h3 class="sub-nick clickable" onclick="location.href='${blogUrl}'">${this.escapeHtml(item.nick)}</h3>
                    <p class="sub-bio">${this.escapeHtml(item.bio)}</p>
                </div>
                <div class="card-mid">
                    <span class="stat-text">게시글 <strong>${item.postCount.toLocaleString()}</strong></span>
                </div>
                <div class="card-bot">
                    <button class="btn-visit" onclick="location.href='${blogUrl}'">블로그 방문</button>
                    ${unsubBtn}
                </div>
            </div>
        `;
    },

    /* ==========================================
       비동기 API 통신 래퍼 (실제 DB 연동 대비용 Mock)
       ========================================== */
    async apiGetSubscriptions(targetNick) {
        return new Promise(async (resolve) => {
            setTimeout(async () => {
                const mockDB = JSON.parse(localStorage.getItem("MOCK_DB_V5") || "{}");
                let userId = null;
                
                // 1. 현재 블로그 주인의 ID 찾기
                if (mockDB.USERS) {
                    const user = mockDB.USERS.find(u => u.nickname === targetNick);
                    if (user) userId = user.id;
                }
                if (!userId) userId = localStorage.getItem("user_id");

                // 2. 해당 유저가 팔로우(구독)하는 목록 필터링
                const subs = (mockDB.SUBSCRIPTIONS || []).filter(s => s.followerId === userId);
                const allUsers = mockDB.USERS || [];
                const allPosts = typeof DB_API !== 'undefined' ? await DB_API.getPosts() : (mockDB.POSTS || []);

                // 3. User 테이블 및 Post 테이블과 조인하여 필요한 정보 가공
                const enrichedSubs = subs.map(sub => {
                    const targetUser = allUsers.find(u => u.id === sub.targetId) || {};
                    // 해당 유저가 작성한 게시글 수 카운트
                    const postCount = allPosts.filter(p => p.writerId === sub.targetId || p.writer === targetUser.nickname).length;
                    
                    return {
                        id: sub.targetId, // 구독 대상의 userID
                        nick: targetUser.nickname || "알 수 없는 유저",
                        bio: targetUser.bio || "소개글이 없습니다.",
                        img: targetUser.profileImg || "",
                        hasNew: Math.random() > 0.7, // Mock: 30% 확률로 새 글 뱃지
                        postCount: postCount
                    };
                });

                // (테스트용) 구독 목록이 비어있고, 내 블로그일 경우 더미 데이터 제공
                if (enrichedSubs.length === 0 && targetNick === localStorage.getItem("user_nick")) {
                    enrichedSubs.push(
                        { id: "dummy_101", nick: "가치투자연구소", bio: "기업의 본질적 가치를 분석합니다.", img: "https://via.placeholder.com/80?text=V", hasNew: true, postCount: 124 },
                        { id: "dummy_102", nick: "차트의신", bio: "기술적 분석과 트레이딩 전략 공유", img: "", hasNew: false, postCount: 89 },
                        { id: "dummy_103", nick: "배당주콜렉터", bio: "월 100만원 배당 받기 프로젝트 진행 중", img: "https://via.placeholder.com/80?text=D", hasNew: true, postCount: 45 }
                    );
                }

                resolve(enrichedSubs);
            }, 250); // 네트워크 딜레이 시뮬레이션
        });
    },

    async apiUnsubscribe(targetId) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // DB_API의 공용 메서드가 있다면 활용
                if (typeof DB_API !== 'undefined' && DB_API.toggleSubscription) {
                    const currentUserId = localStorage.getItem("user_id");
                    DB_API.toggleSubscription(currentUserId, targetId);
                } else {
                    // MOCK_DB 직접 조작 (Fallback)
                    let mockDB = JSON.parse(localStorage.getItem("MOCK_DB_V5") || "{}");
                    const currentUserId = localStorage.getItem("user_id");
                    if (mockDB.SUBSCRIPTIONS) {
                        mockDB.SUBSCRIPTIONS = mockDB.SUBSCRIPTIONS.filter(s => !(s.followerId === currentUserId && s.targetId === targetId));
                        localStorage.setItem("MOCK_DB_V5", JSON.stringify(mockDB));
                    }
                }
                resolve(true);
            }, 150);
        });
    },

    // HTML XSS 방지 유틸리티
    escapeHtml(text) {
        if (!text) return "";
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};