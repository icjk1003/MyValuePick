/* kr/shared/js/post-mention.js */

window.PostManager = window.PostManager || {};

window.PostManager.Mention = {
    mentionList: [],
    isMentionMode: false,
    mentionStartIndex: -1,
    currentInput: null, 

    init: function() {
        if (!document.getElementById("mentionDropdown")) {
            const dd = document.createElement("div");
            dd.id = "mentionDropdown";
            document.body.appendChild(dd);
            
            document.addEventListener("click", (e) => {
                if (!e.target.closest("#mentionDropdown")) {
                    this.closeDropdown();
                }
            });
        }
    },

    attachEvents: function(inputEl) {
        if (!inputEl) return;
        this.init();

        inputEl.addEventListener("keyup", (e) => this.handleKeyup(e, inputEl));
        inputEl.addEventListener("keydown", (e) => this.handleKeydown(e));
        inputEl.addEventListener("click", () => this.checkCursorPosition(inputEl));
    },

    updateList: function(comments) {
        const nicknames = new Set();
        if (window.PostManager.View && window.PostManager.View.postAuthorId) {
             const authorName = document.getElementById("postWriter")?.textContent;
             if (authorName) nicknames.add(authorName);
        }
        comments.forEach(c => {
            if (c.userId && c.writer) nicknames.add(c.writer);
        });
        this.mentionList = Array.from(nicknames);
    },

    checkCursorPosition: function(inputEl) {
        const selection = window.getSelection();
        if (!selection.rangeCount || !this.isMentionMode) return;
    },

    handleKeyup: function(e, inputEl) {
        this.currentInput = inputEl;

        if (["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(e.key)) return;

        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const node = selection.anchorNode;

        // 텍스트가 없거나 노드가 사라진 경우 처리
        if (!node || (node.nodeType === Node.TEXT_NODE && node.textContent.trim() === '')) {
             // 필요 시 추가 로직
        }
        
        if (inputEl.textContent === "") {
            this.closeDropdown();
            return;
        }

        if (node.nodeType !== Node.TEXT_NODE) {
            this.closeDropdown();
            return;
        }

        const text = node.textContent;
        const cursor = selection.anchorOffset;
        
        const leftText = text.substring(0, cursor);
        const lastAt = leftText.lastIndexOf("@");
        
        if (lastAt === -1) { 
            this.closeDropdown(); 
            return; 
        }

        if (lastAt > 0) {
            const charBefore = text[lastAt - 1];
            if (charBefore !== ' ' && charBefore !== '\u00A0' && charBefore !== '\n') {
                this.closeDropdown();
                return;
            }
        }

        const query = leftText.substring(lastAt + 1);
        if (query.includes(' ')) { 
            this.closeDropdown(); 
            return; 
        }

        const matches = this.mentionList.filter(nick => 
            nick.toLowerCase().includes(query.toLowerCase())
        );

        if (matches.length > 0) {
            this.isMentionMode = true;
            this.mentionStartIndex = lastAt;
            const rect = range.getBoundingClientRect();
            this.showDropdown(matches, rect);
        } else {
            this.closeDropdown();
        }
    },

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
            const next = Math.min(activeIndex + 1, items.length - 1);
            this.updateActiveItem(items, next);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            const prev = Math.max(activeIndex - 1, 0); 
            this.updateActiveItem(items, prev);
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (activeIndex > -1) {
                items[activeIndex].click(); // click 이벤트 트리거
            } else if (items.length > 0) {
                items[0].click();
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

    showDropdown: function(list, rect) {
        const dropdown = document.getElementById("mentionDropdown");
        dropdown.innerHTML = "";
        dropdown.scrollTop = 0;

        list.forEach((nick, idx) => {
            const div = document.createElement("div");
            div.className = "mention-item" + (idx === 0 ? " active" : "");
            div.innerHTML = `<span class="mention-avatar">${nick.charAt(0)}</span> ${nick}`;
            
            // [수정 1] click 대신 mousedown 사용 (포커스 유지)
            // mousedown은 blur보다 먼저 발생하므로 입력창 포커스가 유지됨
            div.addEventListener("mousedown", (e) => {
                e.preventDefault(); // 기본 동작 방지 (포커스 이동 막기)
                this.insertMention(nick);
            });
            
            // 키보드 엔터 지원을 위해 click도 유지하되 로직 중복 방지
            div.addEventListener("click", (e) => {
               // mousedown에서 처리 안 된 경우(키보드 등) 대비
               // 이미 mousedown으로 처리됐으면 닫혀있으므로 문제없음
               if(this.isMentionMode) this.insertMention(nick);
            });

            dropdown.appendChild(div);
        });

        dropdown.style.top = (rect.bottom + window.scrollY + 5) + "px";
        dropdown.style.left = (rect.left + window.scrollX) + "px";
        dropdown.style.display = "block";
    },

    // [수정 2] 멘션 삽입 후 커서 처리 개선 (한글 깨짐 방지)
    insertMention: function(nick) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const node = selection.anchorNode;
        const text = node.textContent;
        const cursor = selection.anchorOffset;

        const start = text.lastIndexOf("@", cursor - 1);

        if (start !== -1) {
            // 1. 기존 텍스트(@쿼리) 삭제
            const deleteRange = document.createRange();
            deleteRange.setStart(node, start);
            deleteRange.setEnd(node, cursor);
            deleteRange.deleteContents();

            // 2. 멘션 태그 생성
            const span = document.createElement("span");
            span.className = "mention-tag";
            span.contentEditable = "false"; 
            span.innerText = "@" + nick;

            // 3. 태그 뒤 공백 생성
            const space = document.createTextNode("\u00A0"); // nbsp

            // 4. 삽입 (태그 + 공백)
            deleteRange.insertNode(space);
            deleteRange.insertNode(span);

            // 5. 커서를 공백 노드의 '끝'으로 이동
            // 이렇게 해야 다음 입력이 공백 뒤의 새로운 텍스트로 인식됨
            const newRange = document.createRange();
            newRange.setStart(space, 1); // 공백 텍스트노드의 1번째 위치 (글자 뒤)
            newRange.setEnd(space, 1);
            newRange.collapse(true);
            
            selection.removeAllRanges();
            selection.addRange(newRange);
        }

        this.closeDropdown();
        
        if (this.currentInput) {
            this.currentInput.focus();
        }
    },

    closeDropdown: function() {
        const dropdown = document.getElementById("mentionDropdown");
        if (dropdown) dropdown.style.display = "none";
        this.isMentionMode = false;
    }
};