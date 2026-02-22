/**
 * [My Page Info Module]
 * 내 정보 수정, 프로필 이미지 변경, 회원 탈퇴 기능을 관리하는 모듈
 * 의존성: Cropper.js, AccountAuth (공통 유효성 모듈)
 */
class MyPageInfoManager {
    constructor() {
        // DOM Elements 캐싱
        this.els = {
            // [변경됨] input이 아닌 span(또는 div) 요소로 변경되어 textContent로 제어함
            idDisplay: document.getElementById("myIdDisplay"), 
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

            // Profile Image (사이드바 요소 포함)
            fileInput: document.getElementById("profileUpload"), 
            profileImg: document.getElementById("myProfileImg"), 
            cropModal: document.getElementById("cropModal"),
            imageToCrop: document.getElementById("imageToCrop"),
            btnCropCancel: document.getElementById("btnCropCancel"),
            btnCropConfirm: document.getElementById("btnCropConfirm")
        };

        this.cropper = null;
        
        // 초기화 실행 (이메일 입력 필드가 있을 때만 실행)
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
        // [New] ID 로드 (localStorage에 없는 경우 발급 대기중으로 표시)
        const myId = localStorage.getItem("user_id") || "발급 대기중";
        const myNick = localStorage.getItem("user_nick");
        const myEmail = localStorage.getItem("user_email");
        let myBio = localStorage.getItem("user_bio");

        // 자기소개 기본값 설정
        if (!myBio) {
            myBio = `안녕하세요. ${myNick}입니다.`;
            localStorage.setItem("user_bio", myBio);
        }

        // [변경됨] ID는 인풋이 아니므로 textContent에 할당
        if (this.els.idDisplay) this.els.idDisplay.textContent = myId;
        if (this.els.emailInput) this.els.emailInput.value = myEmail || "";
        if (this.els.nickInput) this.els.nickInput.value = myNick || "";
        if (this.els.bioInput) this.els.bioInput.value = myBio;
    }

    // 2. 이벤트 바인딩 통합
    bindEvents() {
        // 닉네임 실시간 체크 (AccountAuth 모듈 활용)
        if (this.els.nickInput) {
            ['focus', 'input'].forEach(evt => 
                this.els.nickInput.addEventListener(evt, () => this.handleNickCheck())
            );
        }

        // 비밀번호 실시간 체크 (AccountAuth 모듈 활용)
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

    // [Logic] 닉네임 유효성 검사 (Core 모듈 연동)
    handleNickCheck() {
        const val = this.els.nickInput.value.trim();
        const currentNick = localStorage.getItem("user_nick");
        const msg = this.els.nickMsg;

        if (val === currentNick) {
            AccountAuth.setMsg(msg, ""); 
            return;
        }
        if (val === "") {
            AccountAuth.setMsg(msg, "변경할 닉네임을 입력해주세요.", "info");
            return;
        }
        
        // AccountAuth 공통 검증 로직 사용
        if (!AccountAuth.validateNickname(val)) {
            AccountAuth.setMsg(msg, "닉네임은 2~10자여야 합니다.", "error");
            return;
        }
        if (AccountAuth.checkNicknameDuplicate(val)) {
            AccountAuth.setMsg(msg, "이미 사용 중인 닉네임입니다.", "error");
        } else {
            AccountAuth.setMsg(msg, "사용 가능한 닉네임입니다.", "success");
        }
    }

    // [Logic] 비밀번호 일치 검사 (Core 모듈 연동)
    handlePwCheck() {
        const pw = this.els.pwInput.value;
        const pwCheck = this.els.pwCheckInput.value;
        const msg = this.els.pwMsg;

        if (pw === "" && pwCheck === "") {
            AccountAuth.setMsg(msg, "");
            return;
        }
        if (pw !== "" && pwCheck === "") {
            AccountAuth.setMsg(msg, "비밀번호 확인을 입력해주세요.", "info");
            return;
        }
        if (pw !== pwCheck) {
            AccountAuth.setMsg(msg, "비밀번호가 일치하지 않습니다.", "error");
        } else {
            // AccountAuth 공통 비밀번호 보안 규격(8~64자) 검사
            if (!AccountAuth.validatePassword(pw)) {
                AccountAuth.setMsg(msg, "비밀번호는 8자 이상, 64자 이하로 설정해주세요.", "error");
            } else {
                AccountAuth.setMsg(msg, "비밀번호가 안전하게 일치합니다.", "success");
            }
        }
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
        
        // UI 모드 변경
        this.els.bioInput.dataset.original = newBio; 
        this.els.bioInput.readOnly = true;
        this.els.bioInput.classList.add("input-readonly");
        this.els.bioInput.classList.remove("editable");
        
        this.els.btnEditBio.classList.remove("hidden");
        this.els.btnSaveBio.classList.add("hidden");
        this.els.btnCancelBio.classList.add("hidden");
    }

    // [Logic] 전체 정보 저장
    saveAllInfo() {
        const newNick = this.els.nickInput.value.trim();
        const currentNick = localStorage.getItem("user_nick");
        const newPw = this.els.pwInput.value;
        const newPwCheck = this.els.pwCheckInput.value;

        // 1. 비밀번호 검증 (수정 사항이 있을 때만 실행)
        if (newPw !== "") {
            if (!AccountAuth.validatePassword(newPw)) {
                alert("비밀번호는 8자 이상 64자 이하로 설정해야 합니다.");
                this.els.pwInput.focus();
                return;
            }
            if (newPw !== newPwCheck) {
                alert("비밀번호가 일치하지 않습니다.");
                this.els.pwCheckInput.focus();
                return;
            }
            // 비밀번호 저장 (Mock)
            localStorage.setItem("user_pw", newPw);
        }

        // 2. 닉네임 검증 및 변경
        if (newNick !== currentNick) {
            if (!AccountAuth.validateNickname(newNick)) {
                alert("닉네임은 2자 이상 10자 이하로 설정해주세요.");
                return;
            }
            if (AccountAuth.checkNicknameDuplicate(newNick)) {
                alert("이미 사용 중인 닉네임입니다.");
                return;
            }
            
            // 게시글/댓글 작성자명 업데이트 (Mock 데이터 동기화)
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
        location.replace("../home.html");
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
                
                // Cropper.js 설정
                this.cropper = new Cropper(this.els.imageToCrop, {
                    aspectRatio: 1,
                    viewMode: 1,
                    autoCropArea: 0.8
                });
            };
            reader.readAsDataURL(file);
        }
        e.target.value = ''; // 동일 파일 재업로드 지원
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
        
        const canvas = this.cropper.getCroppedCanvas({ width: 300, height: 300 });
        const croppedBase64 = canvas.toDataURL("image/png");

        // 로컬 저장
        localStorage.setItem("user_img", croppedBase64);
        
        // 사이드바 및 페이지 내 프로필 이미지 실시간 업데이트
        if (this.els.profileImg) {
            this.els.profileImg.src = croppedBase64;
        }
        
        this.closeCropModal();
    }

    /* ================= Mock Data Helpers ================= */
    
    // 닉네임 변경 시 기존 데이터와의 정합성을 위해 MOCK_DB 내 작성자명을 일괄 변경함
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
            // 버전 업데이트와 함께 저장하여 즉시 반영
            localStorage.setItem("MOCK_POSTS_V4", JSON.stringify(MOCK_DB.POSTS));
        }
    }
}

// [모듈 실행] 전역 인스턴스 생성
window.MyPageInfoManager = new MyPageInfoManager();