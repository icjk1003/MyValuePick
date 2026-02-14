/* shared/js/mypage.js */

let cropper = null; 

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
  
  if(emailDisplay) emailDisplay.textContent = myEmail || "이메일 정보 없음";
  if(emailInput) emailInput.value = myEmail || "";
  
  document.getElementById("myNickDisplay").textContent = myNick || "닉네임 없음";
  document.getElementById("myNickInput").value = myNick || "";

  // 2. 프로필 이미지 세팅
  const currentImgUrl = window.getProfileImage ? window.getProfileImage(myNick) : "";
  document.getElementById("myProfileImg").src = currentImgUrl;

  // 3. 기능 초기화
  initBioSection(myNick);
  initImageCropper(myNick);
  initNicknameRealtimeCheck(myNick); // [New] 실시간 체크 활성화

  // 4. 전체 정보 저장 버튼
  document.getElementById("btnSaveMyInfo")?.addEventListener("click", () => {
    const newNick = document.getElementById("myNickInput").value.trim();
    const currentNick = localStorage.getItem("user_nick");

    // 닉네임이 변경된 경우 최종 유효성 검사 후 저장
    if (newNick !== currentNick) {
        if (newNick.length < 2 || newNick.length > 10) {
            alert("닉네임은 2자 이상 10자 이하로 설정해주세요.");
            return;
        }
        if (checkNicknameDuplicate(newNick)) {
            alert("이미 사용 중인 닉네임입니다.");
            return;
        }
        
        // 데이터 마이그레이션 (기존 글 작성자명 변경)
        updateUserContentNickname(currentNick, newNick);
        localStorage.setItem("user_nick", newNick);
    }

    alert("회원 정보가 수정되었습니다.");
    location.reload();
  });
}

// =========================================
// [New] 실시간 닉네임 검사 로직
// =========================================
function initNicknameRealtimeCheck(currentNick) {
    const input = document.getElementById("myNickInput");
    const msgBox = document.getElementById("nickCheckMsg");

    if(!input || !msgBox) return;

    const runCheck = () => {
        const val = input.value.trim();
        
        // 1. 현재 내가 사용 중인 닉네임과 동일할 경우
        // 사용자가 아무것도 안 바꿨거나, 수정한걸 다시 원래대로 돌렸을 때 메시지를 비웁니다.
        if (val === currentNick) {
            msgBox.textContent = ""; 
            return;
        }

        // 2. 빈 값인 경우
        if (val === "") {
            msgBox.textContent = "변경할 닉네임을 입력해주세요.";
            msgBox.style.color = "var(--muted)";
            return;
        }

        // 3. 길이 체크
        if (val.length < 2 || val.length > 10) {
            msgBox.textContent = "닉네임은 2~10자여야 합니다.";
            msgBox.style.color = "var(--bad)";
            return;
        }

        // 4. 중복 체크 (본인 닉네임은 위 1번에서 이미 걸러졌으므로 순수 중복만 체크됨)
        if (checkNicknameDuplicate(val)) {
            msgBox.textContent = "이미 사용 중인 닉네임입니다.";
            msgBox.style.color = "var(--bad)";
        } else {
            msgBox.textContent = "사용 가능한 닉네임입니다.";
            msgBox.style.color = "var(--good)";
        }
    };

    // 누르자마자 체크 실행
    input.addEventListener("focus", runCheck);

    // 입력할 때마다 실시간 업데이트
    input.addEventListener("input", runCheck);
    
    // 포커스가 나가도 문구는 유지됨 (별도의 blur 이벤트 처리 안함)
}

// =========================================
// 기능: 닉네임 중복 체크 (Mock DB)
// =========================================
function checkNicknameDuplicate(targetNick) {
    if (typeof MOCK_DB === 'undefined' || !MOCK_DB.POSTS) return false;

    // 전체 작성자 수집
    const allWriters = new Set(MOCK_DB.POSTS.map(p => p.writer));
    
    // 댓글 작성자도 포함
    MOCK_DB.POSTS.forEach(p => {
        if(p.commentList) {
            p.commentList.forEach(c => allWriters.add(c.writer));
        }
    });

    return allWriters.has(targetNick);
}

// =========================================
// 기능: 기존 글/댓글 작성자명 업데이트
// =========================================
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

    if (updateCount > 0) {
        localStorage.setItem("MOCK_POSTS_V3", JSON.stringify(MOCK_DB.POSTS));
    }
}

// =========================================
// 기능: 이미지 크롭 & 업로드
// =========================================
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
          autoCropArea: 0.8,
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ''; 
  });

  btnCancel.addEventListener("click", () => {
    modal.classList.add("hidden");
    if (cropper) cropper.destroy();
  });

  btnConfirm.addEventListener("click", () => {
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

// =========================================
// 기능: 자기소개글 관리
// =========================================
function initBioSection(nickName) {
  const bioInput = document.getElementById("myBioInput");
  const btnEdit = document.getElementById("btnEditBio");
  const btnSave = document.getElementById("btnSaveBio");
  const btnCancel = document.getElementById("btnCancelBio");

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
    if (!newBio) { alert("자기소개글을 입력해주세요."); return; }
    
    localStorage.setItem("user_bio", newBio);
    currentBio = newBio;
    toggleEditMode(false);
  });
}

/* 섹션 전환 기능 */
function showMypageSection(type) {
    // 모든 섹션 숨기기
    document.querySelectorAll('.mypage-content').forEach(sec => sec.classList.add('hidden'));
    // 모든 메뉴 활성화 해제
    document.querySelectorAll('.mypage-menu a').forEach(a => a.classList.remove('active'));

    // 선택한 섹션 보이기
    document.getElementById(`section-${type}`).classList.remove('hidden');
    document.getElementById(`menu-${type}`).classList.add('active');

    if (type === 'posts') renderMyPosts();
    if (type === 'comments') renderMyComments();
}

/* 내가 쓴 글 렌더링 */
function renderMyPosts() {
    const container = document.getElementById("myPostsList");
    const myNick = localStorage.getItem("user_nick");
    
    // MOCK_DB에서 내 글만 필터링
    const myPosts = MOCK_DB.POSTS.filter(p => p.writer === myNick);

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

/* 내가 쓴 댓글 렌더링 */
function renderMyComments() {
    const container = document.getElementById("myCommentsList");
    const myNick = localStorage.getItem("user_nick");
    
    // 모든 게시글의 댓글 목록을 뒤져서 내 댓글 찾기
    const myComments = [];
    MOCK_DB.POSTS.forEach(post => {
        if (post.commentList) {
            post.commentList.forEach(cmt => {
                if (cmt.writer === myNick) {
                    myComments.push({
                        ...cmt,
                        postTitle: post.title,
                        postId: post.no
                    });
                }
            });
        }
    });

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