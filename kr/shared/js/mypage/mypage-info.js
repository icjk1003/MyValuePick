/* kr/shared/js/mypage/mypage-info.js */

/**
 * [My Page Info Module]
 * 내 정보 수정, 프로필 이미지 변경, 회원 탈퇴 기능을 관리하는 모듈 (비동기 DB_API 연동 완료)
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

    // [변경] 비동기 API 통신으로 사용자 최신 정보 로드
    async loadUserInfo() {
        const userId = localStorage.getItem("user_id");
        if (!userId) return;

        try {
            // DB에서 최신 회원정보 조회
            const user = await DB_API.getUserProfile(userId);
            
            // 기본값 처리
            let myBio = user.bio;
            if (!myBio) {
                myBio = `안녕하세요. ${user.nickname}입니다.`;
            }

            if (this.els.emailInput) this.els.emailInput.value = user.email || "";
            if (this.els.nickInput) this.els.nickInput.value = user.nickname || "";
            if (this.els.bioInput) this.els.bioInput.value = myBio;

            // 로컬 스토리지 동기화
            localStorage.setItem("user_nick", user.nickname);
            localStorage.setItem("user_bio", myBio);

        } catch (error) {
            console.error("회원 정보 로딩 실패:", error);
            alert("회원 정보를 불러오지 못했습니다.");
        }
    }

    // 이벤트 바인딩 통합
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

    // [Logic] 닉네임 유효성 검사 (프론트엔드 단)
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
        
        // Mock 환경에서의 중복 체크 (실제 환경에선 API 호출 필요)
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

    // [변경] 자기소개 개별 저장 (비동기 DB 업데이트)
    async saveBio() {
        const newBio = this.els.bioInput.value.trim();
        if (!newBio) {
            alert("자기소개글을 입력해주세요.");
            return;
        }

        const userId = localStorage.getItem("user_id");
        if (!userId) return;

        try {
            // DB_API를 통해 정보 업데이트
            await DB_API.updateUserProfile(userId, { bio: newBio });

            localStorage.setItem("user_bio", newBio);
            
            // UI 모드 변경 (저장 상태로)
            this.els.bioInput.dataset.original = newBio;
            this.els.bioInput.readOnly = true;
            this.els.bioInput.classList.add("input-readonly");
            this.els.bioInput.classList.remove("editable");
            
            this.els.btnEditBio.classList.remove("hidden");
            this.els.btnSaveBio.classList.add("hidden");
            this.els.btnCancelBio.classList.add("hidden");

        } catch (error) {
            console.error("자기소개 저장 실패:", error);
            alert("자기소개를 저장하지 못했습니다.");
        }
    }

    // [변경] 닉네임 및 비밀번호 등 전체 정보 저장 (비동기 DB 업데이트)
    async saveAllInfo() {
        const userId = localStorage.getItem("user_id");
        if (!userId) return;

        const newNick = this.els.nickInput.value.trim();
        const currentNick = localStorage.getItem("user_nick");
        const newPw = this.els.pwInput.value;
        const newPwCheck = this.els.pwCheckInput.value;

        const updateData = {};

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
            updateData.password = newPw;
        }

        // 2. 닉네임 검증
        if (newNick !== currentNick) {
            if (newNick.length < 2 || newNick.length > 10) {
                alert("닉네임은 2자 이상 10자 이하로 설정해주세요.");
                return;
            }
            if (this.checkNicknameDuplicate(newNick)) {
                alert("이미 사용 중인 닉네임입니다.");
                return;
            }
            updateData.nickname = newNick;
        }

        // 변경 사항이 없으면 중단
        if (Object.keys(updateData).length === 0) {
            alert("수정된 정보가 없습니다.");
            return;
        }

        try {
            // DB_API 호출하여 회원정보 갱신
            await DB_API.updateUserProfile(userId, updateData);

            // 로컬 상태 동기화 및 부가 처리
            if (updateData.nickname) {
                localStorage.setItem("user_nick", newNick);
                this.updateUserContentNickname(currentNick, newNick); // 기존 글 작성자명 동기화 (Mock용)
            }

            alert("회원 정보가 성공적으로 수정되었습니다.");
            location.reload();

        } catch (error) {
            console.error("정보 저장 실패:", error);
            alert("정보를 수정하는 데 실패했습니다.");
        }
    }

    // [Logic] 회원 탈퇴
    handleWithdrawal() {
        if (!confirm("정말로 탈퇴하시겠습니까?\n탈퇴 시 모든 데이터가 삭제될 수 있습니다.")) return;
        
        // 실제 운영 환경에서는 await DB_API.deleteUser(userId)를 호출해야 함
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

    // [변경] 크롭한 프로필 이미지를 비동기로 DB에 업데이트
    async confirmCrop() {
        if (!this.cropper) return;
        
        // 캔버스 추출 (base64 인코딩)
        const canvas = this.cropper.getCroppedCanvas({ width: 300, height: 300 });
        const croppedBase64 = canvas.toDataURL("image/png");
        const userId = localStorage.getItem("user_id");

        try {
            // DB_API로 이미지 업데이트
            await DB_API.updateUserProfile(userId, { profileImg: croppedBase64 });
            
            // 로컬 캐시 갱신
            localStorage.setItem("user_profile_img", croppedBase64);
            
            // UI 실시간 렌더링
            if (this.els.profileImg) {
                this.els.profileImg.src = croppedBase64;
            }
            
            this.closeCropModal();
        } catch (error) {
            console.error("프로필 이미지 변경 실패:", error);
            alert("이미지를 변경하지 못했습니다.");
        }
    }

    /* ================= Mock Data Helpers ================= */
    
    // 이 부분은 나중에 서버에서 SELECT 쿼리나 API 단에서 처리하게 됨
    checkNicknameDuplicate(targetNick) {
        if (typeof MOCK_DB === 'undefined' || !MOCK_DB.USERS) return false;
        return MOCK_DB.USERS.some(u => u.nickname === targetNick);
    }

    // NoSQL(Firebase 등)에서 역정규화된 작성자 닉네임을 일괄 업데이트하는 로직 시뮬레이션
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
            // Mock DB 강제 동기화 (DB_API._commit() 접근)
            if (typeof DB_API !== 'undefined' && DB_API._commit) {
                DB_API._commit();
            }
        }
    }
}

// [모듈 실행]
// 전역 인스턴스 할당 (mypage.js 등 타 스크립트에서 접근 가능하도록)
window.MyPageInfoManager = new MyPageInfoManager();