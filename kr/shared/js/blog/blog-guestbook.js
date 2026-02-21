/* kr/shared/js/blog/blog-guestbook.js */

window.BlogGuestbookManager = {
    init: function() {
        console.log("Blog Guestbook Init");
        this.bindEvents();
        this.loadGuestbook();
    },

    bindEvents: function() {
        // 1. 글자 수 카운팅
        const input = document.getElementById("guestInput");
        const countEl = document.getElementById("guestCharCount");
        const btnSave = document.getElementById("btnSaveGuest");

        if (input && countEl) {
            input.addEventListener("input", (e) => {
                const len = e.target.value.length;
                countEl.textContent = len;
                if(len > 300) {
                    countEl.style.color = "red";
                    btnSave.disabled = true;
                } else {
                    countEl.style.color = "#888";
                    btnSave.disabled = false;
                }
            });
        }

        // 2. 등록 버튼 클릭
        if (btnSave) {
            btnSave.onclick = () => this.saveGuestbook();
        }
    },

    loadGuestbook: function() {
        const listContainer = document.getElementById("guestbookList");
        const emptyState = document.getElementById("guestbookEmpty");
        const totalCount = document.getElementById("totalGuestCount");

        // UI 초기화
        listContainer.innerHTML = '';
        emptyState.classList.add('hidden');

        // [더미 데이터]
        const dummyData = [
            {
                id: 1,
                writer: "지나가던개미",
                writerImg: "", // 없으면 기본 이미지
                content: "블로그 디자인이 너무 깔끔하네요! 주식 정보 잘 보고 갑니다. 혹시 템플릿 정보 공유 가능하실까요?",
                date: "2024.10.06 18:22",
                isOwner: false
            },
            {
                id: 2,
                writer: "성투기원",
                writerImg: "https://via.placeholder.com/40?text=S",
                content: "어제 올려주신 분석글 덕분에 수익 실현했습니다. 감사합니다!",
                date: "2024.10.05 09:10",
                isOwner: false
            },
            {
                id: 3,
                writer: "Admin", // 본인(주인장) 등판 예시
                writerImg: "https://via.placeholder.com/40?text=A",
                content: "방문해주셔서 감사합니다. 자주 소통해요 :)",
                date: "2024.10.04 22:00",
                isOwner: true // 삭제 권한 등 테스트용
            }
        ];

        setTimeout(() => {
            if (dummyData.length > 0) {
                if(totalCount) totalCount.textContent = dummyData.length;
                listContainer.innerHTML = dummyData.map(item => this.createGuestItem(item)).join('');
            } else {
                if(totalCount) totalCount.textContent = 0;
                emptyState.classList.remove('hidden');
            }
        }, 300);
    },

    saveGuestbook: function() {
        const input = document.getElementById("guestInput");
        const content = input.value.trim();

        if (!content) {
            alert("내용을 입력해주세요.");
            return;
        }

        // [TODO] 서버 전송 로직
        alert("방명록이 등록되었습니다. (Demo)");
        
        // 입력창 초기화
        input.value = "";
        document.getElementById("guestCharCount").textContent = "0";
        
        // 리스트 새로고침 (여기서는 데모로 reload)
        this.loadGuestbook(); 
    },

    deleteGuestbook: function(id) {
        if(confirm("정말 이 방명록을 삭제하시겠습니까?")) {
            // [TODO] 삭제 API 호출
            alert(`방명록(ID:${id})이 삭제되었습니다.`);
            // DOM에서 제거하거나 리스트 다시 로드
            this.loadGuestbook();
        }
    },

    createGuestItem: function(item) {
        // 프로필 이미지가 없으면 기본 아이콘 사용
        const imgSrc = item.writerImg || "/kr/shared/img/default_profile.png"; 
        // 실제로는 onerror 처리 등이 필요할 수 있음
        const imgTag = item.writerImg 
            ? `<img src="${item.writerImg}" alt="img">` 
            : `<div class="default-avatar">${item.writer.charAt(0)}</div>`;

        // 삭제 버튼 (본인 글이거나 주인장일 때 표시)
        // 여기서는 isOwner 플래그가 있거나, 현재 로그인한 유저 로직에 따름
        const deleteBtn = item.isOwner 
            ? `<button type="button" class="btn-delete-mini" onclick="BlogGuestbookManager.deleteGuestbook(${item.id})">삭제</button>` 
            : '';

        return `
            <div class="guest-item">
                <div class="guest-profile">
                    ${imgTag}
                </div>
                <div class="guest-content-box">
                    <div class="guest-meta">
                        <span class="writer-name">${item.writer}</span>
                        <span class="write-date">${item.date}</span>
                        ${deleteBtn}
                    </div>
                    <div class="guest-text">
                        ${item.content.replace(/\n/g, '<br>')}
                    </div>
                </div>
            </div>
        `;
    }
};