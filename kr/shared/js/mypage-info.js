/**
 * [My Page Info Module]
 * 내 정보 수정, 프로필 이미지 변경, 회원 탈퇴 기능을 관리하는 모듈
 * 의존성: Cropper.js (이미지 자르기 라이브러리)
 */
class MyPageInfoManager {
    constructor() {
        // DOM Elements 캐싱
        this.els = {
            emailInput: document.getElementById("myEmailInput"),
            nickInput: document.getElementById("myNickInput"),
            nickMsg: document.getElementById("nickCheckMsg"),
            bioInput: document.getElementById("myBioInput"),
            pwInput: document.getElementById("myPwInput"),
            pwCheckInput: document.getElementById("myPwCheckInput"),
            pwMsg: document.getElementById("pwCheckMsg"),
            
            // Buttons
            btnSaveInfo: document.getElementById("btnSaveMyInfo"),
            btnWithdrawal: document.getElementById("btnWithdrawal"),
            
            // Bio Buttons
            btnEditBio: document.getElementById("btnEditBio"),
            btnSaveBio: document.getElementById("btnSaveBio"),
            btnCancelBio: document.getElementById("btnCancelBio"),

            // Profile Image
            fileInput: document.getElementById("profileUpload"), // 사이드바에 존재
            profileImg: document.getElementById("myProfileImg"), // 사이드바에 존재
            cropModal: document.getElementById("cropModal"),
            imageToCrop: document.getElementById("imageToCrop"),
            btnCropCancel: document.getElementById("btnCropCancel"),
            btnCropConfirm: document.getElementById("btnCropConfirm")
        };

        this.cropper = null;
        
        // 초기화 실행
        if (this.els.emailInput) {
            this.init();
        }
    }

    init() {
        this.loadUserInfo();
        this.bindEvents();
    }

    // 1. 사용자 정보 로드 및 표시
    loadUserInfo() {
        const myNick = localStorage.getItem("user_nick");
        const myEmail = localStorage.getItem("user_email");
        let myBio = localStorage.getItem("user_bio");

        if (!myBio) {
            myBio = `안녕하세요. ${myNick}입니다.`;
            localStorage.setItem("user_bio", myBio);
        }

        if (this.els.emailInput) this.els.emailInput.value = myEmail || "";
        if (this.els.nickInput) this.els.nickInput.value = myNick || "";
        if (this.els.bioInput) this.els.bioInput.value = myBio;
    }

    // 2. 이벤트 바인딩 통합
    bindEvents() {
        // 닉네임 실시간 체크
        if (this.els.nickInput) {
            ['focus', 'input'].forEach(evt => 
                this.els.nickInput.addEventListener(evt, () => this.handleNickCheck())
            );
        }

        // 비밀번호 실시간 체크
        if (this.els.pwInput && this.els.pwCheckInput) {
            this.els.pwInput.addEventListener("input", () => this.handlePwCheck());
            this.els.pwCheckInput.addEventListener("input", () => this.handlePwCheck());
        }

        // 자기소개 편집 토글
        if (this.els.btnEditBio) this.els.btnEditBio.onclick = () => this.toggleBioEdit(true);
        if (this.els.btnCancelBio) this.els.btnCancelBio.onclick = () => this.toggleBioEdit(false);
        if (this.els.btnSaveBio) this.els.btnSaveBio.onclick = () => this.saveBio();

        // 전체 정보 저장
        if (this.els.btnSaveInfo) this.els.btnSaveInfo.onclick = () => this.saveAllInfo();

        // 회원 탈퇴
        if (this.els.btnWithdrawal) this.els.btnWithdrawal.onclick = () => this.handleWithdrawal();

        // 프로필 이미지 업로드 & 크롭
        if (this.els.fileInput) this.els.fileInput.addEventListener("change", (e) => this.handleFileChange(e));
        if (this.els.btnCropCancel) this.els.btnCropCancel.onclick = () => this.closeCropModal();
        if (this.els.btnCropConfirm) this.els.btnCropConfirm.onclick = () => this.confirmCrop();
    }

    /* ================= Logic Methods ================= */

    // [Logic] 닉네임 유효성 검사
    handleNickCheck() {
        const val = this.els.nickInput.value.trim();
        const currentNick = localStorage.getItem("user_nick");
        const msg = this.els.nickMsg;

        if (val === currentNick) {
            msg.textContent = ""; 
            return;
        }
        if (val === "") {
            this.setMsg(msg, "변경할 닉네임을 입력해주세요.", "info");
            return;
        }
        if (val.length < 2 || val.length > 10) {
            this.setMsg(msg, "닉네임은 2~10자여야 합니다.", "error");
            return;
        }
        if (this.checkNicknameDuplicate(val)) {
            this.setMsg(msg, "이미 사용 중인 닉네임입니다.", "error");
        } else {
            this.setMsg(msg, "사용 가능한 닉네임입니다.", "success");
        }
    }

    // [Logic] 비밀번호 일치 검사
    handlePwCheck() {
        const pw = this.els.pwInput.value;
        const pwCheck = this.els.pwCheckInput.value;
        const msg = this.els.pwMsg;

        if (pw === "" && pwCheck === "") {
            msg.textContent = "";
            return;
        }
        if (pw !== "" && pwCheck === "") {
            this.setMsg(msg, "비밀번호 확인을 입력해주세요.", "info");
            return;
        }
        if (pw !== pwCheck) {
            this.setMsg(msg, "비밀번호가 일치하지 않습니다.", "error");
        } else {
            if (pw.length < 4) {
                this.setMsg(msg, "비밀번호가 너무 짧습니다 (4자 이상).", "error");
            } else {
                this.setMsg(msg, "비밀번호가 일치합니다.", "success");
            }
        }
    }

    // [Helper] 메시지 스타일 설정
    setMsg(el, text, type) {
        el.textContent = text;
        el.className = `msg-mini ${type}`;
    }

    // [Logic] 자기소개 토글
    toggleBioEdit(isEdit) {
        const { bioInput, btnEditBio, btnSaveBio, btnCancelBio } = this.els;

        if (isEdit) {
            bioInput.dataset.original = bioInput.value;
            bioInput.readOnly = false;
            bioInput.classList.remove("input-readonly");
            bioInput.classList.add("editable");
            bioInput.focus();
            
            btnEditBio.classList.add("hidden");
            btnSaveBio.classList.remove("hidden");
            btnCancelBio.classList.remove("hidden");
        } else {
            // 취소 시 원복
            if (bioInput.dataset.original !== undefined) {
                bioInput.value = bioInput.dataset.original;
            }
            bioInput.readOnly = true;
            bioInput.classList.add("input-readonly");
            bioInput.classList.remove("editable");
            
            btnEditBio.classList.remove("hidden");
            btnSaveBio.classList.add("hidden");
            btnCancelBio.classList.add("hidden");
        }
    }

    // [Logic] 자기소개 저장 (개별 저장)
    saveBio() {
        const newBio = this.els.bioInput.value.trim();
        if (!newBio) {
            alert("자기소개글을 입력해주세요.");
            return;
        }
        localStorage.setItem("user_bio", newBio);
        
        // UI 모드 변경 (저장 상태로)
        this.els.bioInput.dataset.original = newBio; // 원본 업데이트
        
        this.els.bioInput.readOnly = true;
        this.els.bioInput.classList.add("input-readonly");
        this.els.bioInput.classList.remove("editable");
        
        this.els.btnEditBio.classList.remove("hidden");
        this.els.btnSaveBio.classList.add("hidden");
        this.els.btnCancelBio.classList.add("hidden");

        // alert("자기소개가 저장되었습니다."); // 필요 시 주석 해제
    }

    // [Logic] 전체 정보 저장
    saveAllInfo() {
        const newNick = this.els.nickInput.value.trim();
        const currentNick = localStorage.getItem("user_nick");
        const newPw = this.els.pwInput.value;
        const newPwCheck = this.els.pwCheckInput.value;

        // 1. 비밀번호 검증
        if (newPw !== "") {
            if (newPw.length < 4) {
                alert("비밀번호는 최소 4자 이상이어야 합니다.");
                return;
            }
            if (newPw !== newPwCheck) {
                alert("비밀번호가 일치하지 않습니다.");
                this.els.pwCheckInput.focus();
                return;
            }
            // TODO: 실제로는 API로 비밀번호 변경 요청을 보내야 함
        }

        // 2. 닉네임 검증 및 변경
        if (newNick !== currentNick) {
            if (newNick.length < 2 || newNick.length > 10) {
                alert("닉네임은 2자 이상 10자 이하로 설정해주세요.");
                return;
            }
            if (this.checkNicknameDuplicate(newNick)) {
                alert("이미 사용 중인 닉네임입니다.");
                return;
            }
            
            // 게시글/댓글 작성자명 업데이트 (Mock Data 처리)
            this.updateUserContentNickname(currentNick, newNick);
            localStorage.setItem("user_nick", newNick);
        }

        alert("회원 정보가 수정되었습니다.");
        location.reload();
    }

    // [Logic] 회원 탈퇴
    handleWithdrawal() {
        if (!confirm("정말로 탈퇴하시겠습니까?\n탈퇴 시 모든 데이터가 삭제될 수 있습니다.")) return;
        
        localStorage.clear();
        alert("탈퇴되었습니다. 메인 화면으로 이동합니다.");
        location.replace("home.html");
    }

    /* ================= Image Cropper Logic ================= */
    
    handleFileChange(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                this.els.imageToCrop.src = ev.target.result;
                this.els.cropModal.classList.remove("hidden");
                
                if (this.cropper) this.cropper.destroy();
                
                // Cropper.js 인스턴스 생성
                this.cropper = new Cropper(this.els.imageToCrop, {
                    aspectRatio: 1,
                    viewMode: 1,
                    autoCropArea: 0.8
                });
            };
            reader.readAsDataURL(file);
        }
        e.target.value = ''; // 같은 파일 재선택 가능하게 리셋
    }

    closeCropModal() {
        this.els.cropModal.classList.add("hidden");
        if (this.cropper) {
            this.cropper.destroy();
            this.cropper = null;
        }
    }

    confirmCrop() {
        if (!this.cropper) return;
        
        // 캔버스 추출
        const canvas = this.cropper.getCroppedCanvas({ width: 300, height: 300 });
        const croppedBase64 = canvas.toDataURL("image/png");

        // 저장 (Mock)
        localStorage.setItem("user_img", croppedBase64);
        
        // UI 업데이트
        if (this.els.profileImg) {
            this.els.profileImg.src = croppedBase64;
        }
        
        this.closeCropModal();
    }

    /* ================= Mock Data Helpers ================= */
    
    checkNicknameDuplicate(targetNick) {
        if (typeof MOCK_DB === 'undefined' || !MOCK_DB.POSTS) return false;
        
        // 모든 작성자 수집
        const allWriters = new Set();
        MOCK_DB.POSTS.forEach(p => {
            allWriters.add(p.writer);
            if(p.commentList) {
                p.commentList.forEach(c => allWriters.add(c.writer));
            }
        });
        
        return allWriters.has(targetNick);
    }

    updateUserContentNickname(oldNick, newNick) {
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
}

// [모듈 실행]
// 전역 인스턴스 할당 (mypage.js에서 사용 가능하도록)
window.MyPageInfoManager = new MyPageInfoManager();