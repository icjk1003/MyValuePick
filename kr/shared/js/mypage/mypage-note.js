/* kr/shared/js/mypage/mypage-note.js */

/**
 * [My Page Note Module]
 * 쪽지함 (목록, 읽기, 쓰기, 삭제, 보관) 기능을 관리하는 모듈 (비동기 API 연동 완료)
 */
class MyPageNoteManager {
    constructor() {
        // DOM Elements 캐싱
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

        // State 초기화: localStorage에서 저장된 탭 불러오기
        const savedTab = localStorage.getItem("mypage_note_tab") || 'inbox';

        this.state = {
            currentTab: savedTab,
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

    async init() {
        await this.initMockData();
        this.bindEvents();
        await this.updateBadge();
        
        // 초기 로드 시 저장된 탭으로 화면 전환 수행
        this.switchTab(this.state.currentTab);
    }

    // 초기 더미 쪽지 데이터 생성 (서버 초기화 시뮬레이션)
    async initMockData() {
        return new Promise((resolve) => {
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
            resolve();
        });
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

    // 탭 전환 로직
    switchTab(tabName) {
        this.state.currentTab = tabName;
        
        // 탭 상태를 localStorage에 저장
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

        // 영역 표시 제어 (인라인 스타일 대신 클래스 사용)
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

    // [변경] 목록 비동기 렌더링
    async renderList() {
        const myNick = localStorage.getItem("user_nick");
        
        // 로딩 UI 표시
        this.els.tbody.innerHTML = `<tr><td colspan="4" class="text-center loading-msg" style="padding: 40px 0;">쪽지를 불러오는 중입니다...</td></tr>`;
        this.els.emptyMsg.classList.add('hidden');
        this.els.pagination.innerHTML = "";

        try {
            // 서버에서 데이터 로드 시뮬레이션
            let msgs = await this.apiGetNotes();

            let filtered = [];
            if (this.state.currentTab === 'inbox') {
                filtered = msgs.filter(m => m.box === 'inbox' && m.receiver === myNick);
            } else if (this.state.currentTab === 'sent') {
                filtered = msgs.filter(m => m.box === 'sent' && m.sender === myNick);
            } else if (this.state.currentTab === 'archive') {
                filtered = msgs.filter(m => m.box === 'archive' && (m.receiver === myNick || m.sender === myNick));
            }

            // 검색어 필터링
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
                this.els.checkAll.checked = false;
                return;
            }

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

            // 이벤트 재바인딩
            this.els.tbody.querySelectorAll('.msg-row').forEach(row => {
                row.addEventListener('click', (e) => {
                    if(e.target.tagName === 'INPUT') return;
                    this.openMessage(row.dataset.id);
                });
            });

            this.els.checkAll.checked = false;
            this.renderPagination(totalPages);

        } catch (error) {
            console.error(error);
            this.els.tbody.innerHTML = `<tr><td colspan="4" class="text-center error-msg" style="padding: 40px 0;">쪽지를 불러오지 못했습니다.</td></tr>`;
        }
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

    // [변경] 쪽지 열람 (비동기 읽음 처리 연동)
    async openMessage(id) {
        try {
            const msgs = await this.apiGetNotes();
            const msg = msgs.find(m => String(m.id) === String(id));

            if (!msg) {
                alert("삭제되거나 없는 쪽지입니다.");
                return;
            }

            this.state.currentViewId = id;

            // 서버 측 읽음 처리 동기화
            if (msg.box === 'inbox' && !msg.read) {
                await this.apiMarkAsRead(id);
                this.updateBadge(); // 뱃지 수 비동기 갱신
            }

            this.els.listArea.classList.add('hidden');
            this.els.viewArea.classList.remove('hidden');
            this.triggerAnim(this.els.viewArea);

            const senderText = this.state.currentTab === 'sent' ? `받는사람: ${msg.receiver}` : `보낸사람: ${msg.sender}`;
            this.els.viewSender.textContent = senderText;
            this.els.viewDate.textContent = new Date(msg.date).toLocaleString();
            this.els.viewBody.textContent = msg.content;

            // 버튼 표시 여부 클래스로 제어
            if (this.state.currentTab === 'sent') {
                this.els.btnViewReply.classList.add('hidden');
            } else {
                this.els.btnViewReply.classList.remove('hidden');
            }

            if (msg.box === 'archive') {
                this.els.btnViewArchive.classList.add('hidden');
            } else {
                this.els.btnViewArchive.classList.remove('hidden');
            }

        } catch (error) {
            alert("쪽지를 열람하는 중 오류가 발생했습니다.");
        }
    }

    backToList() {
        this.els.viewArea.classList.add('hidden');
        this.els.listArea.classList.remove('hidden');
        this.renderList();
        this.triggerAnim(this.els.listArea);
        this.state.currentViewId = null;
    }

    // [변경] 비동기 쪽지 전송
    async sendMessage() {
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

        try {
            if (this.els.btnWriteSend) this.els.btnWriteSend.disabled = true;
            
            // DB_API 송신 요청 시뮬레이션
            await this.apiSendNote(myNick, receiver, content);
            
            alert("쪽지를 성공적으로 보냈습니다.");
            this.switchTab('sent');
            
        } catch (error) {
            console.error(error);
            alert("쪽지 전송에 실패했습니다.");
        } finally {
            if (this.els.btnWriteSend) this.els.btnWriteSend.disabled = false;
        }
    }

    // [변경] 일괄 처리 비동기 연동
    async handleBulkAction(action) {
        const checkboxes = document.getElementsByName('msgCheck');
        const ids = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);

        if (action === 'reply') {
            if (ids.length === 0) return alert("답장할 쪽지를 선택해주세요.");
            if (ids.length > 1) return alert("답장은 한 번에 한 명에게만 보낼 수 있습니다.");
            this.openReplyForm(ids[0]);
            return;
        }

        if (ids.length === 0) return alert("선택된 쪽지가 없습니다.");

        try {
            if (action === 'delete') {
                if (!confirm(`선택한 ${ids.length}개의 쪽지를 삭제하시겠습니까?`)) return;
                await this.apiBulkDelete(ids);
                alert("삭제되었습니다.");
            } 
            else if (action === 'archive') {
                await this.apiBulkArchive(ids);
                alert(`${ids.length}개의 쪽지를 보관함으로 이동했습니다.`);
            }
            else if (action === 'report') {
                // 신고 처리 API 호출 (Mock)
                alert(`선택한 ${ids.length}개의 쪽지를 신고 접수했습니다.`);
            }

            this.renderList();
            this.updateBadge();
            
        } catch (error) {
            alert("요청을 처리하는 중 오류가 발생했습니다.");
        }
    }

    async openReplyForm(msgId) {
        const msgs = await this.apiGetNotes();
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

    async deleteFromView() {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        await this.apiBulkDelete([this.state.currentViewId]);
        this.backToList();
        this.updateBadge();
    }

    async archiveFromView() {
        await this.apiBulkArchive([this.state.currentViewId]);
        alert("보관함으로 이동되었습니다.");
        this.backToList();
    }

    // [변경] 상단 네비게이션 뱃지 업데이트 (비동기 처리)
    async updateBadge() {
        const myNick = localStorage.getItem("user_nick");
        try {
            const msgs = await this.apiGetNotes();
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
        } catch (error) {
            console.error("뱃지 업데이트 실패", error);
        }
    }

    /* ==========================================
       비동기 API 통신 래퍼 (실제 DB 연동 대비용)
       ========================================== */
    async apiGetNotes() {
        return new Promise(resolve => {
            setTimeout(() => {
                const msgs = JSON.parse(localStorage.getItem("MOCK_MESSAGES") || "[]");
                resolve(msgs);
            }, 100);
        });
    }

    async apiMarkAsRead(id) {
        return new Promise(resolve => {
            setTimeout(() => {
                let msgs = JSON.parse(localStorage.getItem("MOCK_MESSAGES") || "[]");
                const msg = msgs.find(m => String(m.id) === String(id));
                if (msg) msg.read = true;
                localStorage.setItem("MOCK_MESSAGES", JSON.stringify(msgs));
                resolve(true);
            }, 50);
        });
    }

    async apiSendNote(sender, receiver, content) {
        return new Promise(resolve => {
            setTimeout(() => {
                let msgs = JSON.parse(localStorage.getItem("MOCK_MESSAGES") || "[]");
                const newId = Date.now();

                // 보낸 쪽지함 저장
                msgs.push({
                    id: newId, sender, receiver, content, 
                    date: new Date().toISOString(), read: true, box: "sent"
                });
                // 받은 쪽지함 저장 (상대방)
                msgs.push({
                    id: newId + "_r", sender, receiver, content, 
                    date: new Date().toISOString(), read: false, box: "inbox"
                });

                localStorage.setItem("MOCK_MESSAGES", JSON.stringify(msgs));
                resolve(true);
            }, 200);
        });
    }

    async apiBulkDelete(ids) {
        return new Promise(resolve => {
            setTimeout(() => {
                let msgs = JSON.parse(localStorage.getItem("MOCK_MESSAGES") || "[]");
                msgs = msgs.filter(m => !ids.includes(String(m.id)));
                localStorage.setItem("MOCK_MESSAGES", JSON.stringify(msgs));
                resolve(true);
            }, 100);
        });
    }

    async apiBulkArchive(ids) {
        return new Promise(resolve => {
            setTimeout(() => {
                let msgs = JSON.parse(localStorage.getItem("MOCK_MESSAGES") || "[]");
                msgs.forEach(m => {
                    if (ids.includes(String(m.id))) m.box = 'archive';
                });
                localStorage.setItem("MOCK_MESSAGES", JSON.stringify(msgs));
                resolve(true);
            }, 100);
        });
    }

    /* ==========================================
       유틸리티
       ========================================== */
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