/**
 * [My Page Note Module]
 * 쪽지함 (목록, 읽기, 쓰기, 삭제, 보관) 기능을 관리하는 모듈
 */
class MyPageNoteManager {
    constructor() {
        // [기존 DOM Elements 캐싱 코드 동일]
        this.els = {
            listArea: document.getElementById('msgListArea'),
            viewArea: document.getElementById('msgViewArea'),
            writeArea: document.getElementById('msgWriteArea'),
            tbody: document.getElementById('msgListBody'),
            emptyMsg: document.getElementById('msgEmpty'),
            pagination: document.getElementById('msgPagination'),
            tabButtons: document.querySelectorAll('.msg-tab-btn'),
            checkAll: document.getElementById('checkAllMsg'),
            searchType: document.getElementById('msgSearchType'),
            searchInput: document.getElementById('msgSearchKeyword'),
            btnSearch: document.getElementById('btnMsgSearch'),
            viewSender: document.getElementById('viewSender'),
            viewDate: document.getElementById('viewDate'),
            viewBody: document.getElementById('viewBody'),
            btnBack: document.getElementById('btnBackToList'),
            btnViewReply: document.getElementById('btnViewReply'),
            btnViewDelete: document.getElementById('btnViewDelete'),
            btnViewArchive: document.getElementById('btnViewArchive'),
            inputReceiver: document.getElementById('msgReceiver'),
            inputContent: document.getElementById('msgContent'),
            btnWriteSend: document.getElementById('btnWriteSend'),
            btnWriteCancel: document.getElementById('btnWriteCancel'),
            actionButtons: document.querySelectorAll('.btn-action[data-action]')
        };

        // [수정] State 초기화: localStorage에서 저장된 탭 불러오기
        const savedTab = localStorage.getItem("mypage_note_tab") || 'inbox';

        this.state = {
            currentTab: savedTab, // 저장된 탭 적용
            currentPage: 1,
            itemsPerPage: 10,
            searchKeyword: '',
            searchType: 'all',
            currentViewId: null
        };

        // 초기화
        if (this.els.listArea) {
            this.init();
        }
    }

    init() {
        this.initMockData();
        this.bindEvents();
        this.updateBadge();
        
        // [추가] 초기 로드 시 저장된 탭으로 화면 전환 수행
        this.switchTab(this.state.currentTab);
    }

    // ... [initMockData, bindEvents 기존 코드 동일] ...
    initMockData() {
        if (!localStorage.getItem("MOCK_MESSAGES")) {
            const myNick = localStorage.getItem("user_nick") || "User";
            const welcomeMsg = [{
                id: "welcome_" + Date.now(),
                sender: "운영자",
                receiver: myNick,
                content: "MyValuePick에 오신 것을 환영합니다.\n즐거운 커뮤니티 활동 되세요!",
                date: new Date().toISOString(),
                read: false,
                box: "inbox"
            }];
            localStorage.setItem("MOCK_MESSAGES", JSON.stringify(welcomeMsg));
        }
    }

    bindEvents() {
        // 탭 전환
        this.els.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });

        // 검색
        const handleSearch = () => {
            this.state.searchKeyword = this.els.searchInput.value.trim();
            this.state.searchType = this.els.searchType.value;
            this.state.currentPage = 1;
            this.renderList();
        };
        if(this.els.btnSearch) this.els.btnSearch.addEventListener('click', handleSearch);
        if(this.els.searchInput) this.els.searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') handleSearch();
        });

        // 체크박스 전체 선택
        if(this.els.checkAll) {
            this.els.checkAll.addEventListener('change', (e) => {
                const checkboxes = document.getElementsByName('msgCheck');
                checkboxes.forEach(cb => cb.checked = e.target.checked);
            });
        }

        // 일괄 작업
        this.els.actionButtons.forEach(btn => {
            if(btn.closest('#msgViewArea')) return; 
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleBulkAction(action);
            });
        });

        // 읽기/쓰기 화면 이벤트
        if(this.els.btnBack) this.els.btnBack.addEventListener('click', () => this.backToList());
        if(this.els.btnViewReply) this.els.btnViewReply.addEventListener('click', () => this.replyFromView());
        if(this.els.btnViewDelete) this.els.btnViewDelete.addEventListener('click', () => this.deleteFromView());
        if(this.els.btnViewArchive) this.els.btnViewArchive.addEventListener('click', () => this.archiveFromView());
        if(this.els.btnWriteSend) this.els.btnWriteSend.addEventListener('click', () => this.sendMessage());
        if(this.els.btnWriteCancel) this.els.btnWriteCancel.addEventListener('click', () => this.switchTab('inbox'));
    }

    // [수정] 탭 전환 로직: 상태 저장 추가
    switchTab(tabName) {
        this.state.currentTab = tabName;
        
        // [추가] 탭 상태를 localStorage에 저장
        localStorage.setItem("mypage_note_tab", tabName);
        
        // 검색 초기화
        this.state.currentPage = 1;
        this.state.searchKeyword = "";
        if(this.els.searchInput) this.els.searchInput.value = "";

        // UI 탭 활성화
        this.els.tabButtons.forEach(btn => {
            if (btn.dataset.tab === tabName) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        // 영역 표시 제어
        this.els.listArea.classList.add('hidden');
        this.els.viewArea.classList.add('hidden');
        this.els.writeArea.classList.add('hidden');

        if (tabName === 'write') {
            this.els.writeArea.classList.remove('hidden');
            this.triggerAnim(this.els.writeArea);
            if(this.els.inputReceiver) this.els.inputReceiver.value = '';
            if(this.els.inputContent) this.els.inputContent.value = '';
        } else {
            this.els.listArea.classList.remove('hidden');
            this.renderList();
            this.triggerAnim(this.els.listArea);
        }
    }

    // ... [이하 renderList, openMessage 등 나머지 메소드는 기존과 동일] ...
    
    // 4. 목록 렌더링
    renderList() {
        const myNick = localStorage.getItem("user_nick");
        let msgs = JSON.parse(localStorage.getItem("MOCK_MESSAGES") || "[]");

        let filtered = [];
        if (this.state.currentTab === 'inbox') {
            filtered = msgs.filter(m => m.box === 'inbox' && m.receiver === myNick);
        } else if (this.state.currentTab === 'sent') {
            filtered = msgs.filter(m => m.box === 'sent' && m.sender === myNick);
        } else if (this.state.currentTab === 'archive') {
            filtered = msgs.filter(m => m.box === 'archive' && (m.receiver === myNick || m.sender === myNick));
        }

        if (this.state.searchKeyword) {
            const kw = this.state.searchKeyword.toLowerCase();
            filtered = filtered.filter(m => {
                const sender = (m.sender || "").toLowerCase();
                const content = (m.content || "").toLowerCase();
                if (this.state.searchType === 'sender') return sender.includes(kw);
                if (this.state.searchType === 'content') return content.includes(kw);
                return sender.includes(kw) || content.includes(kw);
            });
        }

        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (filtered.length === 0) {
            this.els.tbody.innerHTML = "";
            this.els.emptyMsg.classList.remove('hidden');
            this.els.pagination.innerHTML = "";
            this.els.checkAll.checked = false;
            return;
        }
        this.els.emptyMsg.classList.add('hidden');

        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / this.state.itemsPerPage);
        
        if (this.state.currentPage > totalPages) this.state.currentPage = totalPages;
        if (this.state.currentPage < 1) this.state.currentPage = 1;

        const startIndex = (this.state.currentPage - 1) * this.state.itemsPerPage;
        const pageItems = filtered.slice(startIndex, startIndex + this.state.itemsPerPage);

        this.els.tbody.innerHTML = pageItems.map(m => {
            const isUnread = (!m.read && this.state.currentTab === 'inbox');
            const senderDisplay = this.state.currentTab === 'sent' 
                ? `<span class="badge-sent">To</span> ${m.receiver}` 
                : m.sender;

            return `
            <tr class="msg-row ${isUnread ? 'unread' : ''}" data-id="${m.id}">
                <td class="check-col">
                    <input type="checkbox" name="msgCheck" value="${m.id}">
                </td>
                <td>${senderDisplay}</td>
                <td class="td-content">
                    <div class="msg-content-preview">${this.escapeHtml(m.content)}</div>
                </td>
                <td>${new Date(m.date).toLocaleDateString()}</td>
            </tr>
            `;
        }).join("");

        this.els.tbody.querySelectorAll('.msg-row').forEach(row => {
            row.addEventListener('click', (e) => {
                if(e.target.tagName === 'INPUT') return;
                this.openMessage(row.dataset.id);
            });
        });

        this.els.checkAll.checked = false;
        this.renderPagination(totalPages);
    }

    renderPagination(totalPages) {
        if (totalPages <= 1) {
            this.els.pagination.innerHTML = "";
            return;
        }

        let html = "";
        html += `<button class="page-btn prev" ${this.state.currentPage === 1 ? 'disabled' : ''}>&lt;</button>`;
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="page-btn num ${i === this.state.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        html += `<button class="page-btn next" ${this.state.currentPage === totalPages ? 'disabled' : ''}>&gt;</button>`;

        this.els.pagination.innerHTML = html;

        this.els.pagination.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('prev')) this.state.currentPage--;
                else if (btn.classList.contains('next')) this.state.currentPage++;
                else this.state.currentPage = parseInt(btn.dataset.page);
                this.renderList();
            });
        });
    }

    openMessage(id) {
        const msgs = JSON.parse(localStorage.getItem("MOCK_MESSAGES") || "[]");
        const msg = msgs.find(m => String(m.id) === String(id));

        if (!msg) {
            alert("삭제되거나 없는 쪽지입니다.");
            return;
        }

        this.state.currentViewId = id;

        if (msg.box === 'inbox' && !msg.read) {
            msg.read = true;
            localStorage.setItem("MOCK_MESSAGES", JSON.stringify(msgs));
            this.updateBadge();
        }

        this.els.listArea.classList.add('hidden');
        this.els.viewArea.classList.remove('hidden');
        this.triggerAnim(this.els.viewArea);

        const senderText = this.state.currentTab === 'sent' ? `받는사람: ${msg.receiver}` : `보낸사람: ${msg.sender}`;
        this.els.viewSender.textContent = senderText;
        this.els.viewDate.textContent = new Date(msg.date).toLocaleString();
        this.els.viewBody.textContent = msg.content;

        this.els.btnViewReply.style.display = (this.state.currentTab === 'sent') ? 'none' : 'flex';
        this.els.btnViewArchive.style.display = (msg.box === 'archive') ? 'none' : 'flex';
    }

    backToList() {
        this.els.viewArea.classList.add('hidden');
        this.els.listArea.classList.remove('hidden');
        this.renderList();
        this.triggerAnim(this.els.listArea);
        this.state.currentViewId = null;
    }

    sendMessage() {
        const receiver = this.els.inputReceiver.value.trim();
        const content = this.els.inputContent.value.trim();
        const myNick = localStorage.getItem("user_nick");

        if (!receiver || !content) {
            alert("받는 사람과 내용을 모두 입력해주세요.");
            return;
        }
        if (receiver === myNick) {
            alert("자신에게는 쪽지를 보낼 수 없습니다.");
            return;
        }

        const msgs = JSON.parse(localStorage.getItem("MOCK_MESSAGES") || "[]");
        const newId = Date.now();

        msgs.push({
            id: newId,
            sender: myNick,
            receiver: receiver,
            content: content,
            date: new Date().toISOString(),
            read: true,
            box: "sent"
        });

        msgs.push({
            id: newId + "_r",
            sender: myNick,
            receiver: receiver,
            content: content,
            date: new Date().toISOString(),
            read: false,
            box: "inbox"
        });

        localStorage.setItem("MOCK_MESSAGES", JSON.stringify(msgs));
        alert("쪽지를 보냈습니다.");
        this.switchTab('sent');
    }

    handleBulkAction(action) {
        const checkboxes = document.getElementsByName('msgCheck');
        const ids = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);

        if (action === 'reply') {
            if (ids.length === 0) return alert("답장할 쪽지를 선택해주세요.");
            if (ids.length > 1) return alert("답장은 한 번에 한 명에게만 보낼 수 있습니다.");
            this.openReplyForm(ids[0]);
            return;
        }

        if (ids.length === 0) return alert("선택된 쪽지가 없습니다.");

        let msgs = JSON.parse(localStorage.getItem("MOCK_MESSAGES") || "[]");

        if (action === 'delete') {
            if (!confirm(`선택한 ${ids.length}개의 쪽지를 삭제하시겠습니까?`)) return;
            msgs = msgs.filter(m => !ids.includes(String(m.id)));
            localStorage.setItem("MOCK_MESSAGES", JSON.stringify(msgs));
            alert("삭제되었습니다.");
        } 
        else if (action === 'archive') {
            let count = 0;
            msgs.forEach(m => {
                if (ids.includes(String(m.id))) {
                    m.box = 'archive';
                    count++;
                }
            });
            localStorage.setItem("MOCK_MESSAGES", JSON.stringify(msgs));
            alert(`${count}개의 쪽지를 보관함으로 이동했습니다.`);
        }
        else if (action === 'report') {
            alert(`선택한 ${ids.length}개의 쪽지를 신고 접수했습니다.`);
        }

        this.renderList();
        this.updateBadge();
    }

    openReplyForm(msgId) {
        const msgs = JSON.parse(localStorage.getItem("MOCK_MESSAGES") || "[]");
        const targetMsg = msgs.find(m => String(m.id) === String(msgId));
        
        if (targetMsg) {
            this.switchTab('write');
            const myNick = localStorage.getItem("user_nick");
            const replyTo = (targetMsg.sender === myNick) ? targetMsg.receiver : targetMsg.sender;
            this.els.inputReceiver.value = replyTo;
        }
    }

    replyFromView() {
        if (this.state.currentViewId) this.openReplyForm(this.state.currentViewId);
    }

    deleteFromView() {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        this.processDelete([this.state.currentViewId]);
        this.backToList();
    }

    archiveFromView() {
        this.processArchive([this.state.currentViewId]);
        this.backToList();
    }

    processDelete(ids) {
        let msgs = JSON.parse(localStorage.getItem("MOCK_MESSAGES") || "[]");
        msgs = msgs.filter(m => !ids.includes(String(m.id)));
        localStorage.setItem("MOCK_MESSAGES", JSON.stringify(msgs));
        this.updateBadge();
    }

    processArchive(ids) {
        let msgs = JSON.parse(localStorage.getItem("MOCK_MESSAGES") || "[]");
        msgs.forEach(m => {
            if (ids.includes(String(m.id))) m.box = 'archive';
        });
        localStorage.setItem("MOCK_MESSAGES", JSON.stringify(msgs));
        alert("보관함으로 이동되었습니다.");
    }

    updateBadge() {
        const myNick = localStorage.getItem("user_nick");
        const msgs = JSON.parse(localStorage.getItem("MOCK_MESSAGES") || "[]");
        const unreadCount = msgs.filter(m => m.box === 'inbox' && m.receiver === myNick && !m.read).length;
        
        const badge = document.getElementById('msgBadge');
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }

    triggerAnim(el) {
        el.classList.remove('anim-fade');
        void el.offsetWidth;
        el.classList.add('anim-fade');
    }

    escapeHtml(text) {
        if (!text) return "";
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
}

// [모듈 실행]
window.MyPageNoteManager = new MyPageNoteManager();