/* shared/js/mypage.js */

let cropper = null;
let currentMsgTab = 'inbox'; // [New] 현재 쪽지함 탭 상태 (inbox, sent, archive, write)

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

    // 3. 기존 기능 초기화
    initBioSection(myNick);
    initImageCropper(myNick);
    initNicknameRealtimeCheck(myNick);
    initSocialLinking();
    initWithdrawal();
    initPasswordCheck();

    // 4. [New] 쪽지함 기능 초기화
    initMessageBox();

    // 5. 전체 정보 저장 버튼
    document.getElementById("btnSaveMyInfo")?.addEventListener("click", () => {
        const newNick = document.getElementById("myNickInput").value.trim();
        const currentNick = localStorage.getItem("user_nick");

        // 비밀번호 유효성 검사
        const newPw = document.getElementById("myPwInput").value;
        const newPwCheck = document.getElementById("myPwCheckInput").value;

        if (newPw !== "") {
            if (newPw.length < 4) {
                alert("비밀번호는 최소 4자 이상이어야 합니다.");
                return;
            }
            if (newPw !== newPwCheck) {
                alert("비밀번호가 일치하지 않습니다. 다시 확인해주세요.");
                document.getElementById("myPwCheckInput").focus();
                return;
            }
            // 실제로는 여기서 비밀번호 변경 API 호출
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

    // 6. [New] URL 파라미터 체크 (알림 타고 들어왔을 때 처리)
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section');
    const msgId = urlParams.get('id');

    if (section === 'messages') {
        // 쪽지함 섹션 열기
        showMypageSection('messages');
        if (msgId) {
            // 특정 쪽지 바로 열기 (렌더링 후 실행)
            setTimeout(() => openMessage(msgId), 100);
        }
    } else if (section) {
        showMypageSection(section);
    }
}

// =========================================
// [New] 쪽지함 기능 로직 (Message Box Logic)
// =========================================

function initMessageBox() {
    // 초기 더미 데이터 생성 (없을 경우)
    if (!localStorage.getItem("MOCK_MESSAGES")) {
        const welcomeMsg = [{
            id: "welcome_" + Date.now(),
            sender: "운영자",
            receiver: localStorage.getItem("user_nick"),
            content: "MyValuePick에 오신 것을 환영합니다.\n즐거운 커뮤니티 활동 되세요!",
            date: new Date().toISOString(),
            read: false,
            box: "inbox" // inbox(받은), sent(보낸), archive(보관)
        }];
        localStorage.setItem("MOCK_MESSAGES", JSON.stringify(welcomeMsg));
    }
    
    // 배지 업데이트
    updateMsgBadge();
}

// 탭 전환 (HTML에서 onclick="switchMsgTab('sent')" 등으로 호출)
window.switchMsgTab = function(tabName) {
    currentMsgTab = tabName;

    // 탭 버튼 스타일 활성화
    document.querySelectorAll('.msg-tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // write 모드는 별도 버튼
    if (tabName !== 'write') {
        const btns = document.querySelectorAll('.msg-tab-btn');
        // 순서: 0:받은, 1:보낸, 2:보관 (HTML 구조에 따라 인덱스 조정 필요 혹은 data-tab 속성 권장)
        // 여기서는 텍스트 매칭이나 data 속성 없이 간단히 처리하기 위해 loop 사용
        // (실제 HTML에 onclick이 하드코딩 되어 있으므로, 클래스 제어는 아래처럼 조건부로)
        const tabMap = { 'inbox': 0, 'sent': 1, 'archive': 2 };
        if (btns[tabMap[tabName]]) btns[tabMap[tabName]].classList.add('active');
    }

    // 영역 전환
    const listArea = document.getElementById('msgListArea');
    const viewArea = document.getElementById('msgViewArea');
    const writeArea = document.getElementById('msgWriteArea');

    if (listArea) listArea.classList.add('hidden');
    if (viewArea) viewArea.classList.add('hidden');
    if (writeArea) writeArea.classList.add('hidden');

    if (tabName === 'write') {
        if (writeArea) {
            writeArea.classList.remove('hidden');
            // 입력창 초기화
            document.getElementById('msgReceiver').value = '';
            document.getElementById('msgContent').value = '';
        }
    } else {
        if (listArea) {
            listArea.classList.remove('hidden');
            renderMessageList();
        }
    }
};

// 목록 렌더링
function renderMessageList() {
    const tbody = document.getElementById('msgListBody');
    const emptyMsg = document.getElementById('msgEmpty');
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

    // 최신순 정렬
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) {
        tbody.innerHTML = "";
        if (emptyMsg) emptyMsg.classList.remove('hidden');
        return;
    }

    if (emptyMsg) emptyMsg.classList.add('hidden');

    tbody.innerHTML = filtered.map(m => `
        <tr class="msg-row ${(!m.read && currentMsgTab === 'inbox') ? 'unread' : ''}" onclick="openMessage('${m.id}')">
            <td>${currentMsgTab === 'sent' ? '받는이: ' + m.receiver : m.sender}</td>
            <td>
                <div class="msg-content-preview" style="text-align:left; max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    ${m.content}
                </div>
            </td>
            <td>${new Date(m.date).toLocaleDateString()}</td>
            <td>
                <button class="btn-small" onclick="event.stopPropagation(); deleteMessage('${m.id}')">삭제</button>
            </td>
        </tr>
    `).join("");
}

// 쪽지 읽기
window.openMessage = function(msgId) {
    const msgs = JSON.parse(localStorage.getItem("MOCK_MESSAGES") || "[]");
    const msg = msgs.find(m => m.id == msgId); // id 타입 비교 유연하게

    if (!msg) {
        alert("삭제되거나 존재하지 않는 쪽지입니다.");
        return;
    }

    // 읽음 처리 (받은 쪽지함인 경우)
    if (msg.box === 'inbox' && !msg.read) {
        msg.read = true;
        localStorage.setItem("MOCK_MESSAGES", JSON.stringify(msgs));
        updateMsgBadge();
    }

    // 화면 전환
    document.getElementById('msgListArea').classList.add('hidden');
    document.getElementById('msgWriteArea').classList.add('hidden');
    document.getElementById('msgViewArea').classList.remove('hidden');

    // 내용 채우기
    document.getElementById('viewSender').textContent = 
        currentMsgTab === 'sent' ? `받는사람: ${msg.receiver}` : `보낸사람: ${msg.sender}`;
    document.getElementById('viewDate').textContent = new Date(msg.date).toLocaleString();
    document.getElementById('viewBody').textContent = msg.content;

    // 버튼 이벤트 연결
    const btnReply = document.getElementById('btnMsgReply');
    const btnDel = document.getElementById('btnMsgDelete');
    const btnArch = document.getElementById('btnMsgArchive');

    if (btnReply) {
        btnReply.onclick = () => {
            switchMsgTab('write');
            document.getElementById('msgReceiver').value = msg.sender;
        };
        // 보낸 편지함에선 답장 버튼 숨김
        btnReply.style.display = (currentMsgTab === 'sent') ? 'none' : 'inline-block';
    }

    if (btnDel) {
        btnDel.onclick = () => {
            if (confirm("정말 삭제하시겠습니까?")) deleteMessage(msg.id, true);
        };
    }

    if (btnArch) {
        btnArch.onclick = () => archiveMessage(msg.id);
        // 이미 보관함이면 버튼 숨김
        btnArch.style.display = (msg.box === 'archive') ? 'none' : 'inline-block';
    }
};

// 목록으로 돌아가기
window.backToMsgList = function() {
    document.getElementById('msgViewArea').classList.add('hidden');
    document.getElementById('msgListArea').classList.remove('hidden');
    renderMessageList();
};

// 쪽지 보내기
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

    // Mock 전송 로직
    const msgs = JSON.parse(localStorage.getItem("MOCK_MESSAGES") || "[]");
    const newId = Date.now();

    // 1. 내 보낸 편지함에 저장
    msgs.push({
        id: newId,
        sender: myNick,
        receiver: receiver,
        content: content,
        date: new Date().toISOString(),
        read: true, // 보낸 건 이미 읽은 상태
        box: "sent"
    });

    // 2. 상대방 받은 편지함에 저장 (Mocking: 상대방 입장의 데이터도 생성해줘야 함)
    // 실제 서버라면 DB에 1건만 저장되겠지만, 로컬스토리지 Mock이므로 상대방이 로그인했을 때 보이도록 처리
    // 여기서는 간단히 'box: inbox' 데이터를 하나 더 만듭니다.
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

    alert("쪽지를 성공적으로 보냈습니다.");
    switchMsgTab('sent');
};

// 쪽지 삭제
window.deleteMessage = function(id, isFromView = false) {
    if (!isFromView && !confirm("삭제하시겠습니까?")) return;

    let msgs = JSON.parse(localStorage.getItem("MOCK_MESSAGES") || "[]");
    // 해당 ID의 메시지 삭제
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

// 쪽지 보관
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

// 배지(읽지 않은 쪽지 수) 업데이트
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


// =========================================
// [기존] 회원 탈퇴 로직
// =========================================
function initWithdrawal() {
    const btn = document.getElementById("btnWithdrawal");
    if (!btn) return;

    btn.addEventListener("click", () => {
        // 1차 확인
        if (!confirm("정말로 탈퇴하시겠습니까?\n탈퇴 시 모든 정보가 삭제되며 복구할 수 없습니다.")) {
            return;
        }

        // 2차 확인 (안전장치)
        if (!confirm("작성하신 게시글과 댓글은 자동으로 삭제되지 않습니다.\n정말 탈퇴하시겠습니까?")) {
            return;
        }

        // 데이터 삭제
        localStorage.removeItem("is_logged_in");
        localStorage.removeItem("user_nick");
        localStorage.removeItem("user_email");
        localStorage.removeItem("user_bio");
        localStorage.removeItem("user_img");

        // 연동 정보 삭제
        ['google', 'naver', 'kakao', 'apple'].forEach(p => localStorage.removeItem(`social_link_${p}`));

        alert("정상적으로 탈퇴되었습니다.\n이용해 주셔서 감사합니다.");
        location.replace("home.html");
    });
}

// [기존] 실시간 닉네임 체크
function initNicknameRealtimeCheck(currentNick) {
    const input = document.getElementById("myNickInput");
    const msgBox = document.getElementById("nickCheckMsg");
    if (!input || !msgBox) return;

    const runCheck = () => {
        const val = input.value.trim();
        if (val === currentNick) {
            msgBox.textContent = "";
            return;
        }
        if (val === "") {
            msgBox.textContent = "변경할 닉네임을 입력해주세요.";
            msgBox.style.color = "var(--muted)";
            return;
        }
        if (val.length < 2 || val.length > 10) {
            msgBox.textContent = "닉네임은 2~10자여야 합니다.";
            msgBox.style.color = "var(--bad)";
            return;
        }
        if (checkNicknameDuplicate(val)) {
            msgBox.textContent = "이미 사용 중인 닉네임입니다.";
            msgBox.style.color = "var(--bad)";
        } else {
            msgBox.textContent = "사용 가능한 닉네임입니다.";
            msgBox.style.color = "var(--good)";
        }
    };
    input.addEventListener("focus", runCheck);
    input.addEventListener("input", runCheck);
}

function checkNicknameDuplicate(targetNick) {
    if (typeof MOCK_DB === 'undefined' || !MOCK_DB.POSTS) return false;
    const allWriters = new Set(MOCK_DB.POSTS.map(p => p.writer));
    MOCK_DB.POSTS.forEach(p => {
        if (p.commentList) p.commentList.forEach(c => allWriters.add(c.writer));
    });
    return allWriters.has(targetNick);
}

function updateUserContentNickname(oldNick, newNick) {
    if (typeof MOCK_DB === 'undefined' || !MOCK_DB.POSTS) return;
    let updateCount = 0;
    MOCK_DB.POSTS.forEach(post => {
        if (post.writer === oldNick) {
            post.writer = newNick;
            updateCount++;
        }
        if (post.commentList) {
            post.commentList.forEach(comment => {
                if (comment.writer === oldNick) {
                    comment.writer = newNick;
                    updateCount++;
                }
            });
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
                cropper = new Cropper(imageToCrop, {
                    aspectRatio: 1,
                    viewMode: 1,
                    autoCropArea: 0.8
                });
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    });

    if (btnCancel) {
        btnCancel.addEventListener("click", () => {
            modal.classList.add("hidden");
            if (cropper) cropper.destroy();
        });
    }

    if (btnConfirm) {
        btnConfirm.addEventListener("click", () => {
            if (!cropper) return;
            const canvas = cropper.getCroppedCanvas({
                width: 300,
                height: 300
            });
            const croppedBase64 = canvas.toDataURL("image/png");
            uploadProfileImage(croppedBase64).then(() => {
                profileImgDisplay.src = croppedBase64;
                modal.classList.add("hidden");
                cropper.destroy();
            });
        });
    }
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
    if (!currentBio) {
        currentBio = `안녕하세요. ${nickName}입니다.`;
        localStorage.setItem("user_bio", currentBio);
    }
    bioInput.value = currentBio;

    const toggleEditMode = (isEdit) => {
        if (isEdit) {
            bioInput.readOnly = false;
            bioInput.classList.remove("input-readonly");
            bioInput.classList.add("editable");
            bioInput.focus();
            btnEdit.classList.add("hidden");
            btnSave.classList.remove("hidden");
            btnCancel.classList.remove("hidden");
        } else {
            bioInput.readOnly = true;
            bioInput.classList.add("input-readonly");
            bioInput.classList.remove("editable");
            btnEdit.classList.remove("hidden");
            btnSave.classList.add("hidden");
            btnCancel.classList.add("hidden");
        }
    };

    btnEdit.addEventListener("click", () => {
        bioInput.dataset.original = bioInput.value;
        toggleEditMode(true);
    });
    btnCancel.addEventListener("click", () => {
        bioInput.value = bioInput.dataset.original;
        toggleEditMode(false);
    });
    btnSave.addEventListener("click", () => {
        const newBio = bioInput.value.trim();
        if (!newBio) {
            alert("자기소개글을 입력해주세요.");
            return;
        }
        localStorage.setItem("user_bio", newBio);
        currentBio = newBio;
        toggleEditMode(false);
    });
}

function showMypageSection(type) {
    // 모든 콘텐츠 섹션 숨김
    document.querySelectorAll('.mypage-content').forEach(sec => sec.classList.add('hidden'));
    // 모든 메뉴 활성화 제거
    document.querySelectorAll('.mypage-menu a').forEach(a => a.classList.remove('active'));

    // 선택된 섹션 보이기
    const targetSection = document.getElementById(`section-${type}`);
    if (targetSection) targetSection.classList.remove('hidden');

    // 선택된 메뉴 활성화
    const targetMenu = document.getElementById(`menu-${type}`);
    if (targetMenu) targetMenu.classList.add('active');

    // 섹션별 초기화 로직
    if (type === 'posts') renderMyPosts();
    if (type === 'comments') renderMyComments();
    if (type === 'social') initSocialLinking();
    if (type === 'messages') renderMessageList(); // [New] 쪽지함 진입 시 리스트 갱신
}

function renderMyPosts() {
    const container = document.getElementById("myPostsList");
    if (!container) return;
    const myNick = localStorage.getItem("user_nick");
    const myPosts = (typeof MOCK_DB !== 'undefined' ? MOCK_DB.POSTS : []).filter(p => p.writer === myNick);

    if (myPosts.length === 0) {
        container.innerHTML = `<div class="empty-msg">작성한 게시글이 없습니다.</div>`;
        return;
    }
    container.innerHTML = myPosts.map(p => `
        <a href="post.html?id=${p.no}" class="my-item">
            <span class="my-item-title">${p.title}</span>
            <div class="my-item-meta">
                <span>${p.tag}</span>
                <span>조회 ${p.views}</span>
                <span>추천 ${p.votes}</span>
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
                    if (cmt.writer === myNick) {
                        myComments.push({ ...cmt,
                            postTitle: post.title,
                            postId: post.no
                        });
                    }
                });
            }
        });
    }

    if (myComments.length === 0) {
        container.innerHTML = `<div class="empty-msg">작성한 댓글이 없습니다.</div>`;
        return;
    }
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

    if (isChecked) {
        localStorage.setItem(`social_link_${provider}`, 'true');
    } else {
        if (confirm(`${provider} 연동을 해제하시겠습니까?`)) {
            localStorage.setItem(`social_link_${provider}`, 'false');
        } else {
            toggleEl.checked = true;
            updateSocialUI(provider, true);
        }
    }
};

function updateSocialUI(provider, isLinked) {
    const toggleEl = document.getElementById(`toggle-${provider}`);
    const statusEl = document.getElementById(`status-${provider}`);
    if (toggleEl) toggleEl.checked = isLinked;
    if (statusEl) {
        if (isLinked) {
            statusEl.textContent = "연동 완료";
            statusEl.classList.add("active");
        } else {
            statusEl.textContent = "연동 안됨";
            statusEl.classList.remove("active");
        }
    }
}

// [기존] 비밀번호 실시간 일치 확인
function initPasswordCheck() {
    const pwInput = document.getElementById("myPwInput");
    const pwCheckInput = document.getElementById("myPwCheckInput");
    const msgBox = document.getElementById("pwCheckMsg");

    if (!pwInput || !pwCheckInput || !msgBox) return;

    const checkPw = () => {
        const pw = pwInput.value;
        const pwCheck = pwCheckInput.value;

        // 1. 둘 다 비어있으면 초기화
        if (pw === "" && pwCheck === "") {
            msgBox.textContent = "";
            msgBox.className = "";
            return;
        }

        // 2. 비밀번호는 입력했으나 확인칸이 비었을 때
        if (pw !== "" && pwCheck === "") {
            msgBox.textContent = "비밀번호 확인을 입력해주세요.";
            msgBox.className = "info";
            return;
        }

        // 3. 일치 여부 확인
        if (pw !== pwCheck) {
            msgBox.textContent = "비밀번호가 일치하지 않습니다.";
            msgBox.className = "error";
        } else {
            if (pw.length < 4) {
                msgBox.textContent = "비밀번호가 너무 짧습니다 (4자 이상).";
                msgBox.className = "error";
            } else {
                msgBox.textContent = "비밀번호가 일치합니다.";
                msgBox.className = "success";
            }
        }
    };

    pwInput.addEventListener("input", checkPw);
    pwCheckInput.addEventListener("input", checkPw);
}