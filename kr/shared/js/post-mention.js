/* kr/shared/js/post-mention.js */

window.PostManager = window.PostManager || {};

window.PostManager.Mention = {
    mentionList: [],        // 멘션 가능한 닉네임 목록
    isMentionMode: false,   // 현재 멘션 모드인지 여부
    mentionStartIndex: -1,  // '@'가 시작된 위치 인덱스
    
    // [초기화] 드롭다운 DOM 생성
    init: function() {
        if (!document.getElementById("mentionDropdown")) {
            const dd = document.createElement("div");
            dd.id = "mentionDropdown";
            document.body.appendChild(dd);
            
            // 드롭다운 외부 클릭 시 닫기
            document.addEventListener("click", (e) => {
                if (!e.target.closest("#mentionDropdown")) {
                    this.closeDropdown();
                }
            });
        }
    },

    // 1. 이벤트 연결 (입력창 엘리먼트에 keyup, keydown 부착)
    attachEvents: function(inputEl) {
        if (!inputEl) return;
        this.init(); // 안전장치: 드롭다운 없으면 생성

        inputEl.addEventListener("keyup", (e) => this.handleKeyup(e));
        inputEl.addEventListener("keydown", (e) => this.handleKeydown(e));
    },

    // 2. 멘션 리스트 업데이트 (댓글 데이터 기반)
    updateList: function(comments) {
        const nicknames = new Set();
        
        // 게시글 작성자 (회원인 경우)
        if (window.PostManager.View && window.PostManager.View.postAuthorId) {
             const authorName = document.getElementById("postWriter")?.textContent;
             if (authorName) nicknames.add(authorName);
        }

        // 댓글 작성자들 (회원인 경우)
        comments.forEach(c => {
            if (c.userId && c.writer) { 
                nicknames.add(c.writer);
            }
        });
        
        this.mentionList = Array.from(nicknames);
    },

    // 3. 키 입력 감지 (@ 입력 확인)
    handleKeyup: function(e) {
        if (["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(e.key)) return;

        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const node = selection.anchorNode;

        // 텍스트 노드가 아니면 무시 (이미지나 태그 선택 등)
        if (node.nodeType !== Node.TEXT_NODE) return;

        const text = node.textContent;
        const cursor = selection.anchorOffset;
        
        // 커서 앞쪽 텍스트 분석
        const leftText = text.substring(0, cursor);
        const lastAt = leftText.lastIndexOf("@");
        
        // @가 없으면 종료
        if (lastAt === -1) { 
            this.closeDropdown(); 
            return; 
        }

        // @ 앞이 공백이나 줄바꿈이어야 함 (문장 중간의 이메일 등 방지)
        // 단, 문장 시작(index 0)이면 허용
        if (lastAt > 0) {
            const charBefore = text[lastAt - 1];
            if (charBefore !== ' ' && charBefore !== '\u00A0' && charBefore !== '\n') {
                this.closeDropdown();
                return;
            }
        }

        const query = leftText.substring(lastAt + 1);
        
        // 공백이 포함되면 멘션 모드 해제 (단, 닉네임에 공백 허용 정책이면 로직 수정 필요)
        if (query.includes(' ')) { 
            this.closeDropdown(); 
            return; 
        }

        // 매칭되는 닉네임 필터링
        const matches = this.mentionList.filter(nick => 
            nick.toLowerCase().includes(query.toLowerCase())
        );

        if (matches.length > 0) {
            this.isMentionMode = true;
            this.mentionStartIndex = lastAt; // 해당 노드 내에서의 인덱스
            
            // 드롭다운 위치 계산 (Range API 활용)
            const rect = range.getBoundingClientRect();
            this.showDropdown(matches, rect);
        } else {
            this.closeDropdown();
        }
    },

    // 4. 키보드 네비게이션 (화살표, 엔터)
    handleKeydown: function(e) {
        if (!this.isMentionMode) return;
        
        const dropdown = document.getElementById("mentionDropdown");
        if (!dropdown || dropdown.style.display === "none") return;

        const items = dropdown.querySelectorAll(".mention-item");
        let activeIndex = -1;
        items.forEach((item, idx) => { 
            if (item.classList.contains("active")) activeIndex = idx; 
        });

        if (e.key === "ArrowDown") {
            e.preventDefault();
            const next = (activeIndex + 1) % items.length;
            this.updateActiveItem(items, next);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            const prev = (activeIndex - 1 + items.length) % items.length;
            this.updateActiveItem(items, prev);
        } else if (e.key === "Enter") {
            e.preventDefault(); // 줄바꿈 방지
            if (activeIndex > -1) {
                items[activeIndex].click();
            } else if (items.length > 0) {
                items[0].click(); // 선택 안 했으면 첫 번째 자동 선택
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            this.closeDropdown();
        }
    },

    updateActiveItem: function(items, idx) {
        items.forEach(i => i.classList.remove("active"));
        if (items[idx]) {
            items[idx].classList.add("active");
            items[idx].scrollIntoView({ block: "nearest" });
        }
    },

    // 5. 드롭다운 표시
    showDropdown: function(list, rect) {
        const dropdown = document.getElementById("mentionDropdown");
        dropdown.innerHTML = "";

        list.forEach((nick, idx) => {
            const div = document.createElement("div");
            div.className = "mention-item" + (idx === 0 ? " active" : "");
            
            // 아바타 + 닉네임
            div.innerHTML = `
                <span class="mention-avatar">${nick.charAt(0)}</span>
                <span class="mention-nick">${nick}</span>
            `;
            
            // 클릭 시 멘션 삽입 (mousedown으로 하면 포커스 잃을 수 있어 click 사용하되 preventDefault 주의)
            div.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.insertMention(nick);
            };
            dropdown.appendChild(div);
        });

        // 위치 보정 (커서 바로 아래)
        // scrollY를 더해줘야 전체 문서 기준 위치가 잡힘
        dropdown.style.top = (rect.bottom + window.scrollY + 5) + "px";
        dropdown.style.left = (rect.left + window.scrollX) + "px";
        dropdown.style.display = "block";
    },

    // 6. 멘션 삽입 (파란색 태그 생성)
    insertMention: function(nick) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const node = selection.anchorNode;
        const text = node.textContent;
        const cursor = selection.anchorOffset;

        // 현재 커서 기준 뒤쪽에서 @ 찾기
        // (handleKeyup에서 저장한 mentionStartIndex가 있지만, 안전을 위해 다시 탐색)
        const start = text.lastIndexOf("@", cursor - 1);

        if (start !== -1) {
            // A. 기존 텍스트(@입력값) 삭제
            const deleteRange = document.createRange();
            deleteRange.setStart(node, start);
            deleteRange.setEnd(node, cursor);
            deleteRange.deleteContents();

            // B. 멘션 태그 생성
            // contenteditable="false"로 설정하여 백스페이스 시 한 번에 지워지게 함
            const span = document.createElement("span");
            span.className = "mention-tag";
            span.contentEditable = "false"; 
            span.innerText = "@" + nick;

            // C. 태그 뒤에 공백 추가 (이어쓰기 편하도록)
            const space = document.createTextNode("\u00A0"); 

            // D. 삽입
            deleteRange.insertNode(space);
            deleteRange.insertNode(span);

            // E. 커서를 공백 뒤로 이동
            const newRange = document.createRange();
            newRange.setStartAfter(space);
            newRange.setEndAfter(space);
            selection.removeAllRanges();
            selection.addRange(newRange);
        }

        this.closeDropdown();
        
        // 입력창에 포커스 유지 (혹시 잃었을 경우 대비)
        const inputDiv = document.querySelector(".comment-input-div");
        if(inputDiv) inputDiv.focus();
    },

    closeDropdown: function() {
        const dropdown = document.getElementById("mentionDropdown");
        if (dropdown) dropdown.style.display = "none";
        this.isMentionMode = false;
    }
};