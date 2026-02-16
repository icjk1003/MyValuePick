/* shared/js/mypage.js */

let cropper = null;
let currentMsgTab = 'inbox'; 

document.addEventListener("DOMContentLoaded", () => {
    const isLogged = localStorage.getItem("is_logged_in");
    if (!isLogged) {
        alert("로그인이 필요합니다.");
        location.replace("login.html");
        return;
    }
    initMyPage();
});

function initMyPage() {
    const myNick = localStorage.getItem("user_nick");
    const myEmail = localStorage.getItem("user_email");

    // 1. 텍스트 정보 세팅
    const emailDisplay = document.getElementById("myEmailDisplay");
    const emailInput = document.getElementById("myEmailInput");

    if (emailDisplay) emailDisplay.textContent = myEmail || "이메일 정보 없음";
    if (emailInput) emailInput.value = myEmail || "";

    document.getElementById("myNickDisplay").textContent = myNick || "닉네임 없음";
    document.getElementById("myNickInput").value = myNick || "";

    // 2. 프로필 이미지 세팅
    const currentImgUrl = window.getProfileImage ? window.getProfileImage(myNick) : "";
    const profileImg = document.getElementById("myProfileImg");
    if (profileImg) profileImg.src = currentImgUrl;

    // 3. 기능 초기화
    initBioSection(myNick);
    initImageCropper(myNick);
    initNicknameRealtimeCheck(myNick);
    initSocialLinking();
    initWithdrawal();
    initPasswordCheck();

    // 4. 쪽지함 초기화
    initMessageBox();

    // 5. URL 파라미터 복구 (새로고침 시 상태 유지)
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section');
    const tab = urlParams.get('tab');
    const msgId = urlParams.get('id');

    if (section) {
        showMypageSection(section, false); // 히스토리 추가 없이 전환

        if (section === 'messages') {
            if (tab) {
                switchMsgTab(tab, false);
            }
            if (msgId) {
                // 데이터 로드 안정성을 위해 지연 실행
                setTimeout(() => openMessage(msgId, false), 100);
            }
        }
    } else {
        // 기본값: 내 정보 관리
        showMypageSection('edit', false);
    }

    // 6. 전체 정보 저장 버튼
    document.getElementById("btnSaveMyInfo")?.addEventListener("click", () => {
        const newNick = document.getElementById("myNickInput").value.trim();
        const currentNick = localStorage.getItem("user_nick");
        const newPw = document.getElementById("myPwInput").value;
        const newPwCheck = document.getElementById("myPwCheckInput").value;

        // 비밀번호 변경 로직
        if (newPw !== "") {
            if (newPw.length < 4) {
                alert("비밀번호는 최소 4자 이상이어야 합니다.");
                return;
            }
            if (newPw !== newPwCheck) {
                alert("비밀번호가 일치하지 않습니다.");
                document.getElementById("myPwCheckInput").focus();
                return;
            }
        }

        // 닉네임 변경 로직
        if (newNick !== currentNick) {
            if (newNick.length < 2 || newNick.length > 10) {
                alert("닉네임은 2자 이상 10자 이하로 설정해주세요.");
                return;
            }
            if (checkNicknameDuplicate(newNick)) {
                alert("이미 사용 중인 닉네임입니다.");
                return;
            }
            updateUserContentNickname(currentNick, newNick);
            localStorage.setItem("user_nick", newNick);
        }

        alert("회원 정보가 수정되었습니다.");
        location.reload();
    });
}

// =========================================
// [기능] 섹션 전환 (URL 상태 관리)
// =========================================
window.showMypageSection = function(type, updateHistory = true) {
    // 1. UI 전환
    document.querySelectorAll('.mypage-content').forEach(sec => sec.classList.add('hidden'));
    document.querySelectorAll('.mypage-menu a').forEach(a => a.classList.remove('active'));

    const targetSec = document.getElementById(`section-${type}`);
    const targetMenu = document.getElementById(`menu-${type}`);
    
    if (targetSec) targetSec.classList.remove('hidden');
    if (targetMenu) targetMenu.classList.add('active');

    // 2. 섹션별 렌더링
    if (type === 'posts') renderMyPosts();
    if (type === 'comments') renderMyComments();
    if (type === 'social') initSocialLinking();
    if (type === 'messages') {
        renderMessageList();
        // 쪽지함 진입 시 애니메이션 효과
        triggerAnimation('msgListArea');
    }

    // 3. URL 업데이트
    if (updateHistory) {
        const url = new URL(window.location);
        url.searchParams.set('section', type);
        
        // 다른 섹션 이동 시 쪽지함 관련 파라미터 정리
        if (type !== 'messages') {
            url.searchParams.delete('tab');
            url.searchParams.delete('id');
        } else {
            // 쪽지함 초기 진입 시 탭 정보 등 초기화 (필요 시)
            url.searchParams.delete('tab');
            url.searchParams.delete('id');
        }
        
        window.history.pushState({}, '', url);
    }
};

// =========================================
// [기능] 애니메이션 헬퍼 (강제 리플로우)
// =========================================
function triggerAnimation(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        el.classList.remove('anim-fade');
        void el.offsetWidth; // 브라우저가 변경사항을 인지하도록 강제 리플로우(Reflow) 발생
        el.classList.add('anim-fade');
    }
}

// =========================================
// [기능] 쪽지함 로직
// =========================================
function initMessageBox() {
    if (!localStorage.getItem("MOCK_MESSAGES")) {
        const welcomeMsg = [{
            id: "welcome_" + Date.now(),
            sender: "운영자",
            receiver: localStorage.getItem("user_nick"),
            content: "MyValuePick에 오신 것을 환영합니다.\n즐거운 커뮤니티 활동 되세요!",
            date: new Date().toISOString(),
            read: false,
            box: "inbox"
        }];
        localStorage.setItem("MOCK_MESSAGES", JSON.stringify(welcomeMsg));
    }
    updateMsgBadge();
}

// 탭 전환
window.switchMsgTab = function(tabName, updateHistory = true) {
    currentMsgTab = tabName;

    // 1. 탭 버튼 스타일 업데이트
    document.querySelectorAll('.msg-tab-btn').forEach(btn => btn.classList.remove('active'));
    
    if (tabName !== 'write') {
        const btns = document.querySelectorAll('.msg-tab-btn');
        // 순서: 0:받은, 1:보낸, 2:보관 (HTML 순서 의존)
        const tabMap = { 'inbox': 0, 'sent': 1, 'archive': 2 };
        if (btns[tabMap[tabName]]) btns[tabMap[tabName]].classList.add('active');
    }

    // 2. 영역 전환 및 애니메이션
    const listArea = document.getElementById('msgListArea');
    const viewArea = document.getElementById('msgViewArea');
    const writeArea = document.getElementById('msgWriteArea');

    listArea.classList.add('hidden');
    viewArea.classList.add('hidden');
    writeArea.classList.add('hidden');

    if (tabName === 'write') {
        writeArea.classList.remove('hidden');
        triggerAnimation('msgWriteArea'); // 쓰기 영역 애니메이션
        
        // 입력창 초기화
        document.getElementById('msgReceiver').value = '';
        document.getElementById('msgContent').value = '';
    } else {
        listArea.classList.remove('hidden');
        renderMessageList();
        triggerAnimation('msgListArea'); // 리스트 영역 애니메이션 (탭 전환 시마다 발동)
    }

    // 3. URL 업데이트
    if (updateHistory) {
        const url = new URL(window.location);
        url.searchParams.set('section', 'messages');
        url.searchParams.set('tab', tabName);
        url.searchParams.delete('id'); // 탭 전환 시 보고 있던 쪽지 해제
        window.history.replaceState({}, '', url);
    }
};

// 목록 렌더링
function renderMessageList() {
    const tbody = document.getElementById('msgListBody');
    const emptyMsg = document.getElementById('msgEmpty');
    const checkAll = document.getElementById('checkAllMsg');
    
    if (checkAll) checkAll.checked = false; 

    if (!tbody) return;

    const myNick = localStorage.getItem("user_nick");
    let msgs = JSON.parse(localStorage.getItem("MOCK_MESSAGES") || "[]");

    // 필터링
    let filtered = [];
    if (currentMsgTab === 'inbox') {
        filtered = msgs.filter(m => m.box === 'inbox' && m.receiver === myNick);
    } else if (currentMsgTab === 'sent') {
        filtered = msgs.filter(m => m.box === 'sent' && m.sender === myNick);
    } else if (currentMsgTab === 'archive') {
        filtered = msgs.filter(m => m.box === 'archive' && (m.receiver === myNick || m.sender === myNick));
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) {
        tbody.innerHTML = "";
        if (emptyMsg) emptyMsg.classList.remove('hidden');
        return;
    }

    if (emptyMsg) emptyMsg.classList.add('hidden');

    tbody.innerHTML = filtered.map(m => `
        <tr class="msg-row ${(!m.read && currentMsgTab === 'inbox') ? 'unread' : ''}" onclick="openMessage('${m.id}')">
            <td onclick="event.stopPropagation()" class="check-col">
                <input type="checkbox" name="msgCheck" value="${m.id}">
            </td>
            <td>${currentMsgTab === 'sent' ? '<span class="badge-sent">To</span> ' + m.receiver : m.sender}</td>
            <td class="td-content">
                <div class="msg-content-preview">${m.content}</div>
            </td>
            <td>${new Date(m.date).toLocaleDateString()}</td>
        </tr>
    `).join("");
}

// 쪽지 읽기
window.openMessage = function(msgId, updateHistory = true) {
    const msgs = JSON.parse(localStorage.getItem("MOCK_MESSAGES") || "[]");
    const msg = msgs.find(m => m.id == msgId);

    if (!msg) {
        alert("삭제되거나 없는 쪽지입니다.");
        // URL 정리
        const url = new URL(window.location);
        if (url.searchParams.get('id') == msgId) {
            url.searchParams.delete('id');
            window.history.replaceState({}, '', url);
        }
        return;
    }

    // 읽음 처리
    if (msg.box === 'inbox' && !msg.read) {
        msg.read = true;
        localStorage.setItem("MOCK_MESSAGES", JSON.stringify(msgs));
        updateMsgBadge();
    }

    // 화면 전환
    document.getElementById('msgListArea').classList.add('hidden');
    document.getElementById('msgWriteArea').classList.add('hidden');
    document.getElementById('msgViewArea').classList.remove('hidden');

    // 애니메이션 실행
    triggerAnimation('msgViewArea');

    // 내용 채우기
    document.getElementById('viewSender').textContent = 
        currentMsgTab === 'sent' ? `받는사람: ${msg.receiver}` : `보낸사람: ${msg.sender}`;
    document.getElementById('viewDate').textContent = new Date(msg.date).toLocaleString();
    document.getElementById('viewBody').textContent = msg.content;

    // 버튼 제어
    const btnReply = document.getElementById('btnMsgReply');
    const btnDel = document.getElementById('btnMsgDelete');
    const btnArch = document.getElementById('btnMsgArchive');

    if (btnReply) {
        btnReply.onclick = () => {
            switchMsgTab('write');
            document.getElementById('msgReceiver').value = msg.sender;
        };
        btnReply.style.display = (currentMsgTab === 'sent') ? 'none' : 'flex'; // flex or inline-flex (CSS .btn-action display와 일치)
    }
    if (btnDel) {
        btnDel.onclick = () => {
            if (confirm("정말 삭제하시겠습니까?")) deleteMessage(msg.id, true);
        };
    }
    if (btnArch) {
        btnArch.onclick = () => archiveMessage(msg.id);
        btnArch.style.display = (msg.box === 'archive') ? 'none' : 'flex';
    }

    // URL 업데이트
    if (updateHistory) {
        const url = new URL(window.location);
        url.searchParams.set('id', msgId);
        window.history.pushState({}, '', url);
    }
};

window.backToMsgList = function() {
    document.getElementById('msgViewArea').classList.add('hidden');
    document.getElementById('msgListArea').classList.remove('hidden');
    
    renderMessageList();
    triggerAnimation('msgListArea'); // 목록으로 돌아올 때도 애니메이션

    const url = new URL(window.location);
    url.searchParams.delete('id');
    window.history.pushState({}, '', url);
};

// =========================================
// [기능] 체크박스 및 일괄 처리
// =========================================
window.toggleAllMessages = function(source) {
    const checkboxes = document.getElementsByName('msgCheck');
    checkboxes.forEach(cb => cb.checked = source.checked);
};

function getSelectedMsgIds() {
    const checkboxes = document.getElementsByName('msgCheck');
    const ids = [];
    checkboxes.forEach(cb => {
        if (cb.checked) ids.push(cb.value);
    });
    return ids;
}

window.handleBulkAction = function(action) {
    const ids = getSelectedMsgIds();
    if (ids.length === 0) {
        alert("선택된 쪽지가 없습니다.");
        return;
    }

    let msgs = JSON.parse(localStorage.getItem("MOCK_MESSAGES") || "[]");

    if (action === 'delete') {
        if (!confirm(`선택한 ${ids.length}개의 쪽지를 삭제하시겠습니까?`)) return;
        msgs = msgs.filter(m => !ids.includes(String(m.id)));
        localStorage.setItem("MOCK_MESSAGES", JSON.stringify(msgs));
        renderMessageList();
        updateMsgBadge();
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
        renderMessageList();
        alert(`${count}개의 쪽지를 보관함으로 이동했습니다.`);
    }
    else if (action === 'report') {
        alert(`선택한 ${ids.length}개의 쪽지를 신고 접수했습니다.`);
    }
    else if (action === 'reply') {
        if (ids.length > 1) {
            alert("답장은 한 번에 한 명에게만 보낼 수 있습니다.");
            return;
        }
        const targetId = ids[0];
        const targetMsg = msgs.find(m => String(m.id) === targetId);
        if (targetMsg) {
            switchMsgTab('write');
            const replyTo = (targetMsg.sender === localStorage.getItem("user_nick")) ? targetMsg.receiver : targetMsg.sender;
            document.getElementById('msgReceiver').value = replyTo;
        }
    }
};

// =========================================
// [기타] 쪽지 보내기/삭제/보관 함수들
// =========================================
window.sendDirectMessage = function() {
    const receiver = document.getElementById('msgReceiver').value.trim();
    const content = document.getElementById('msgContent').value.trim();
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

    // 1. Sent 저장
    msgs.push({
        id: newId,
        sender: myNick,
        receiver: receiver,
        content: content,
        date: new Date().toISOString(),
        read: true,
        box: "sent"
    });

    // 2. Inbox (Mock)
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
    switchMsgTab('sent');
};

window.deleteMessage = function(id, isFromView = false) {
    if (!isFromView && !confirm("삭제하시겠습니까?")) return;
    let msgs = JSON.parse(localStorage.getItem("MOCK_MESSAGES") || "[]");
    msgs = msgs.filter(m => m.id != id);
    localStorage.setItem("MOCK_MESSAGES", JSON.stringify(msgs));
    
    if (isFromView) {
        alert("삭제되었습니다.");
        backToMsgList();
    } else {
        renderMessageList();
    }
    updateMsgBadge();
};

window.archiveMessage = function(id) {
    let msgs = JSON.parse(localStorage.getItem("MOCK_MESSAGES") || "[]");
    const target = msgs.find(m => m.id == id);
    if (target) {
        target.box = 'archive';
        localStorage.setItem("MOCK_MESSAGES", JSON.stringify(msgs));
        alert("보관함으로 이동되었습니다.");
        backToMsgList();
    }
};

function updateMsgBadge() {
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

// [기존 유지] 회원정보 관련 로직
function initWithdrawal() {
    const btn = document.getElementById("btnWithdrawal");
    if (!btn) return;
    btn.addEventListener("click", () => {
        if (!confirm("정말로 탈퇴하시겠습니까?")) return;
        localStorage.clear();
        alert("탈퇴되었습니다.");
        location.replace("home.html");
    });
}
function initNicknameRealtimeCheck(currentNick) {
    const input = document.getElementById("myNickInput");
    const msgBox = document.getElementById("nickCheckMsg");
    if(!input || !msgBox) return;
    const runCheck = () => {
        const val = input.value.trim();
        if (val === currentNick) { msgBox.textContent = ""; return; }
        if (val === "") { msgBox.textContent = "변경할 닉네임을 입력해주세요."; msgBox.style.color = "var(--muted)"; return; }
        if (val.length < 2 || val.length > 10) { msgBox.textContent = "닉네임은 2~10자여야 합니다."; msgBox.style.color = "var(--bad)"; return; }
        if (checkNicknameDuplicate(val)) { msgBox.textContent = "이미 사용 중인 닉네임입니다."; msgBox.style.color = "var(--bad)"; }
        else { msgBox.textContent = "사용 가능한 닉네임입니다."; msgBox.style.color = "var(--good)"; }
    };
    input.addEventListener("focus", runCheck);
    input.addEventListener("input", runCheck);
}
function checkNicknameDuplicate(targetNick) {
    if (typeof MOCK_DB === 'undefined' || !MOCK_DB.POSTS) return false;
    const allWriters = new Set(MOCK_DB.POSTS.map(p => p.writer));
    MOCK_DB.POSTS.forEach(p => { if(p.commentList) p.commentList.forEach(c => allWriters.add(c.writer)); });
    return allWriters.has(targetNick);
}
function updateUserContentNickname(oldNick, newNick) {
    if (typeof MOCK_DB === 'undefined' || !MOCK_DB.POSTS) return;
    let updateCount = 0;
    MOCK_DB.POSTS.forEach(post => {
        if (post.writer === oldNick) { post.writer = newNick; updateCount++; }
        if (post.commentList) {
            post.commentList.forEach(comment => { if (comment.writer === oldNick) { comment.writer = newNick; updateCount++; } });
        }
    });
    if (updateCount > 0) localStorage.setItem("MOCK_POSTS_V3", JSON.stringify(MOCK_DB.POSTS));
}
function initImageCropper(myNick) {
    const fileInput = document.getElementById("profileUpload");
    const modal = document.getElementById("cropModal");
    const imageToCrop = document.getElementById("imageToCrop");
    const btnCancel = document.getElementById("btnCropCancel");
    const btnConfirm = document.getElementById("btnCropConfirm");
    const profileImgDisplay = document.getElementById("myProfileImg");

    fileInput?.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                imageToCrop.src = ev.target.result;
                modal.classList.remove("hidden");
                if (cropper) cropper.destroy();
                cropper = new Cropper(imageToCrop, { aspectRatio: 1, viewMode: 1, autoCropArea: 0.8 });
            };
            reader.readAsDataURL(file);
        }
        e.target.value = ''; 
    });
    if (btnCancel) btnCancel.addEventListener("click", () => { modal.classList.add("hidden"); if (cropper) cropper.destroy(); });
    if (btnConfirm) btnConfirm.addEventListener("click", () => {
        if (!cropper) return;
        const canvas = cropper.getCroppedCanvas({ width: 300, height: 300 });
        const croppedBase64 = canvas.toDataURL("image/png");
        uploadProfileImage(croppedBase64).then(() => {
            profileImgDisplay.src = croppedBase64;
            modal.classList.add("hidden");
            cropper.destroy();
        });
    });
}
function uploadProfileImage(base64Data) {
    return new Promise((resolve) => {
        localStorage.setItem("user_img", base64Data);
        setTimeout(() => resolve(true), 100);
    });
}
function initBioSection(nickName) {
    const bioInput = document.getElementById("myBioInput");
    const btnEdit = document.getElementById("btnEditBio");
    const btnSave = document.getElementById("btnSaveBio");
    const btnCancel = document.getElementById("btnCancelBio");
    if (!bioInput) return;
    let currentBio = localStorage.getItem("user_bio");
    if (!currentBio) { currentBio = `안녕하세요. ${nickName}입니다.`; localStorage.setItem("user_bio", currentBio); }
    bioInput.value = currentBio;
    const toggleEditMode = (isEdit) => {
        if (isEdit) {
            bioInput.readOnly = false; bioInput.classList.remove("input-readonly"); bioInput.classList.add("editable"); bioInput.focus();
            btnEdit.classList.add("hidden"); btnSave.classList.remove("hidden"); btnCancel.classList.remove("hidden");
        } else {
            bioInput.readOnly = true; bioInput.classList.add("input-readonly"); bioInput.classList.remove("editable");
            btnEdit.classList.remove("hidden"); btnSave.classList.add("hidden"); btnCancel.classList.add("hidden");
        }
    };
    btnEdit.addEventListener("click", () => { bioInput.dataset.original = bioInput.value; toggleEditMode(true); });
    btnCancel.addEventListener("click", () => { bioInput.value = bioInput.dataset.original; toggleEditMode(false); });
    btnSave.addEventListener("click", () => {
        const newBio = bioInput.value.trim();
        if (!newBio) { alert("자기소개글을 입력해주세요."); return; }
        localStorage.setItem("user_bio", newBio);
        currentBio = newBio; toggleEditMode(false);
    });
}
function renderMyPosts() {
    const container = document.getElementById("myPostsList");
    if (!container) return;
    const myNick = localStorage.getItem("user_nick");
    const myPosts = (typeof MOCK_DB !== 'undefined' ? MOCK_DB.POSTS : []).filter(p => p.writer === myNick);
    if (myPosts.length === 0) { container.innerHTML = `<div class="empty-msg">작성한 게시글이 없습니다.</div>`; return; }
    container.innerHTML = myPosts.map(p => `
        <a href="post.html?id=${p.no}" class="my-item">
            <span class="my-item-title">${p.title}</span>
            <div class="my-item-meta">
                <span>${p.tag}</span><span>조회 ${p.views}</span><span>추천 ${p.votes}</span>
                <span>${window.formatBoardDate ? window.formatBoardDate(p.date) : p.date}</span>
            </div>
        </a>
    `).join("");
}
function renderMyComments() {
    const container = document.getElementById("myCommentsList");
    if (!container) return;
    const myNick = localStorage.getItem("user_nick");
    const myComments = [];
    if (typeof MOCK_DB !== 'undefined' && MOCK_DB.POSTS) {
        MOCK_DB.POSTS.forEach(post => {
            if (post.commentList) {
                post.commentList.forEach(cmt => {
                    if (cmt.writer === myNick) myComments.push({ ...cmt, postTitle: post.title, postId: post.no });
                });
            }
        });
    }
    if (myComments.length === 0) { container.innerHTML = `<div class="empty-msg">작성한 댓글이 없습니다.</div>`; return; }
    container.innerHTML = myComments.map(c => `
        <a href="post.html?id=${c.postId}" class="my-item">
            <span class="my-item-title">${c.content}</span>
            <div class="my-item-meta">
                <span style="color:var(--primary)">원문: ${c.postTitle}</span>
                <span>${window.formatBoardDate ? window.formatBoardDate(c.date) : c.date}</span>
            </div>
        </a>
    `).join("");
}
function initSocialLinking() {
    const providers = ['google', 'naver', 'kakao', 'apple'];
    providers.forEach(provider => {
        const isLinked = localStorage.getItem(`social_link_${provider}`) === 'true';
        updateSocialUI(provider, isLinked);
    });
}
window.toggleSocial = function(provider) {
    const toggleEl = document.getElementById(`toggle-${provider}`);
    const isChecked = toggleEl.checked;
    updateSocialUI(provider, isChecked);
    if (isChecked) { localStorage.setItem(`social_link_${provider}`, 'true'); }
    else {
        if (confirm(`${provider} 연동을 해제하시겠습니까?`)) { localStorage.setItem(`social_link_${provider}`, 'false'); }
        else { toggleEl.checked = true; updateSocialUI(provider, true); }
    }
};
function updateSocialUI(provider, isLinked) {
    const toggleEl = document.getElementById(`toggle-${provider}`);
    const statusEl = document.getElementById(`status-${provider}`);
    if (toggleEl) toggleEl.checked = isLinked;
    if (statusEl) {
        if (isLinked) { statusEl.textContent = "연동 완료"; statusEl.classList.add("active"); }
        else { statusEl.textContent = "연동 안됨"; statusEl.classList.remove("active"); }
    }
}
function initPasswordCheck() {
    const pwInput = document.getElementById("myPwInput");
    const pwCheckInput = document.getElementById("myPwCheckInput");
    const msgBox = document.getElementById("pwCheckMsg");
    if (!pwInput || !pwCheckInput || !msgBox) return;
    const checkPw = () => {
        const pw = pwInput.value;
        const pwCheck = pwCheckInput.value;
        if (pw === "" && pwCheck === "") { msgBox.textContent = ""; msgBox.className = ""; return; }
        if (pw !== "" && pwCheck === "") { msgBox.textContent = "비밀번호 확인을 입력해주세요."; msgBox.className = "info"; return; }
        if (pw !== pwCheck) { msgBox.textContent = "비밀번호가 일치하지 않습니다."; msgBox.className = "error"; }
        else {
            if (pw.length < 4) { msgBox.textContent = "비밀번호가 너무 짧습니다 (4자 이상)."; msgBox.className = "error"; }
            else { msgBox.textContent = "비밀번호가 일치합니다."; msgBox.className = "success"; }
        }
    };
    pwInput.addEventListener("input", checkPw);
    pwCheckInput.addEventListener("input", checkPw);
}