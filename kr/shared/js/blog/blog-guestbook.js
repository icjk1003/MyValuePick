/* kr/shared/js/blog/blog-guestbook.js */

window.BlogGuestbookManager = {
    targetNick: null, // 현재 방문 중인 블로그 주인 닉네임

    async init() {
        console.log("Blog Guestbook Init");
        
        // 대상 블로그 닉네임 파악 (URL 파라미터 우선, 없으면 로그인 유저)
        const urlParams = new URLSearchParams(window.location.search);
        this.targetNick = urlParams.get('user') || localStorage.getItem("user_nick");

        this.bindEvents();
        await this.loadGuestbook();
    },

    bindEvents() {
        // 1. 글자 수 카운팅 및 유효성 검사 (인라인 스타일 대신 클래스 사용)
        const input = document.getElementById("guestInput");
        const countEl = document.getElementById("guestCharCount");
        const btnSave = document.getElementById("btnSaveGuest");

        if (input && countEl) {
            input.addEventListener("input", (e) => {
                const len = e.target.value.length;
                countEl.textContent = len;
                if(len > 300) {
                    countEl.classList.add("over-limit"); // CSS에서 제어
                    if(btnSave) btnSave.disabled = true;
                } else {
                    countEl.classList.remove("over-limit");
                    if(btnSave) btnSave.disabled = false;
                }
            });
        }

        // 2. 등록 버튼 클릭 (비동기 처리)
        if (btnSave) {
            btnSave.onclick = () => this.saveGuestbook();
        }
    },

    async loadGuestbook() {
        const listContainer = document.getElementById("guestbookList");
        const emptyState = document.getElementById("guestbookEmpty");
        const totalCount = document.getElementById("totalGuestCount");

        if (!listContainer) return;

        // UI 초기화 (로딩 상태)
        listContainer.innerHTML = '<div class="loading-msg">방명록을 불러오는 중입니다...</div>';
        if(emptyState) emptyState.classList.add('hidden');

        try {
            // 서버에서 방명록 데이터 비동기 로드
            const guests = await this.apiGetGuestbooks(this.targetNick);
            
            // 최신순 정렬
            guests.sort((a, b) => new Date(b.date) - new Date(a.date));

            if (guests.length > 0) {
                if(totalCount) totalCount.textContent = guests.length;
                listContainer.innerHTML = guests.map(item => this.createGuestItem(item)).join('');
            } else {
                if(totalCount) totalCount.textContent = 0;
                listContainer.innerHTML = '';
                if(emptyState) emptyState.classList.remove('hidden');
            }
        } catch (error) {
            console.error("방명록 로딩 실패:", error);
            listContainer.innerHTML = '<div class="error-msg">방명록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</div>';
        }
    },

    async saveGuestbook() {
        const input = document.getElementById("guestInput");
        const btnSave = document.getElementById("btnSaveGuest");
        if (!input) return;

        const content = input.value.trim();
        if (!content) {
            alert("내용을 입력해주세요.");
            return;
        }

        const myNick = localStorage.getItem("user_nick");
        if (!myNick) {
            alert("로그인 후 이용할 수 있습니다.");
            return;
        }
        
        const myImg = localStorage.getItem("user_profile_img") || null;

        try {
            if(btnSave) btnSave.disabled = true;

            // 서버로 방명록 데이터 전송 (비동기)
            await this.apiAddGuestbook(this.targetNick, myNick, myImg, content);
            
            // alert("방명록이 등록되었습니다."); // 잦은 알림창 방지를 위해 생략 가능
            
            // 입력창 초기화
            input.value = "";
            const countEl = document.getElementById("guestCharCount");
            if(countEl) {
                countEl.textContent = "0";
                countEl.classList.remove("over-limit");
            }
            
            // 리스트 비동기 새로고침
            await this.loadGuestbook(); 

        } catch (error) {
            console.error("방명록 등록 실패:", error);
            alert("방명록을 등록하지 못했습니다.");
        } finally {
            if(btnSave) btnSave.disabled = false;
        }
    },

    async deleteGuestbook(id) {
        if(!confirm("정말 이 방명록을 삭제하시겠습니까?")) return;

        try {
            // 서버에 삭제 요청 (비동기)
            await this.apiDeleteGuestbook(id);
            // 리스트 비동기 다시 로드
            await this.loadGuestbook();
        } catch (error) {
            console.error("방명록 삭제 실패:", error);
            alert("삭제에 실패했습니다. 권한을 확인해주세요.");
        }
    },

    createGuestItem(item) {
        const myNick = localStorage.getItem("user_nick");
        
        // 프로필 이미지가 없으면 기본 아바타 (첫 글자)
        const imgTag = item.writerImg 
            ? `<img src="${this.escapeHtml(item.writerImg)}" alt="img">` 
            : `<div class="default-avatar">${this.escapeHtml(item.writer.charAt(0))}</div>`;

        // 삭제 권한: 방명록 작성자 본인이거나, 현재 블로그 주인장일 때
        const isOwnerOrWriter = (myNick === item.writer || myNick === this.targetNick);
        const deleteBtn = isOwnerOrWriter 
            ? `<button type="button" class="btn-delete-mini" onclick="BlogGuestbookManager.deleteGuestbook('${item.id}')">삭제</button>` 
            : '';

        // 날짜 포맷 (YYYY.MM.DD HH:mm)
        const dateObj = new Date(item.date);
        const dateStr = `${dateObj.getFullYear()}.${String(dateObj.getMonth()+1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

        return `
            <div class="guest-item">
                <div class="guest-profile">
                    ${imgTag}
                </div>
                <div class="guest-content-box">
                    <div class="guest-meta">
                        <span class="writer-name">${this.escapeHtml(item.writer)}</span>
                        <span class="write-date">${dateStr}</span>
                        ${deleteBtn}
                    </div>
                    <div class="guest-text">
                        ${this.escapeHtml(item.content).replace(/\n/g, '<br>')}
                    </div>
                </div>
            </div>
        `;
    },

    /* ==========================================
       비동기 API 통신 래퍼 (실제 DB 연동 대비용 Mock)
       ========================================== */
    async apiGetGuestbooks(targetBlogNick) {
        return new Promise(resolve => {
            setTimeout(() => {
                const data = JSON.parse(localStorage.getItem("MOCK_GUESTBOOK") || "[]");
                resolve(data.filter(g => g.targetBlog === targetBlogNick));
            }, 150);
        });
    },

    async apiAddGuestbook(targetBlogNick, writerNick, writerImg, content) {
        return new Promise(resolve => {
            setTimeout(() => {
                const data = JSON.parse(localStorage.getItem("MOCK_GUESTBOOK") || "[]");
                const newItem = {
                    id: "gb_" + Date.now(),
                    targetBlog: targetBlogNick,
                    writer: writerNick,
                    writerImg: writerImg,
                    content: content,
                    date: new Date().toISOString()
                };
                data.push(newItem);
                localStorage.setItem("MOCK_GUESTBOOK", JSON.stringify(data));
                resolve(newItem);
            }, 200);
        });
    },

    async apiDeleteGuestbook(id) {
        return new Promise(resolve => {
            setTimeout(() => {
                let data = JSON.parse(localStorage.getItem("MOCK_GUESTBOOK") || "[]");
                data = data.filter(g => String(g.id) !== String(id));
                localStorage.setItem("MOCK_GUESTBOOK", JSON.stringify(data));
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