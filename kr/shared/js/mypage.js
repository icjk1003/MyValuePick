/* shared/js/mypage.js */

let cropper = null; // 크롭퍼 인스턴스 전역 변수

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
  const myId = localStorage.getItem("user_id");

  // 1. 텍스트 정보 세팅
  document.getElementById("myIdDisplay").textContent = "@" + myId;
  document.getElementById("myNickDisplay").textContent = myNick;
  document.getElementById("myIdInput").value = myId;
  document.getElementById("myNickInput").value = myNick;

  // 2. 프로필 이미지 세팅 (common.js 함수 활용)
  // 커스텀 이미지가 있으면 그거, 없으면 닉네임 기반 생성
  const currentImgUrl = getProfileImage(myNick); 
  document.getElementById("myProfileImg").src = currentImgUrl;

  // 3. 자기소개글 초기화
  initBioSection(myNick);

  // 4. [New] 이미지 크롭 업로드 초기화
  initImageCropper(myNick);

  // 5. 전체 정보 저장 (닉네임 변경 등)
  document.getElementById("btnSaveMyInfo")?.addEventListener("click", () => {
    const newNick = document.getElementById("myNickInput").value.trim();
    if(newNick) {
        localStorage.setItem("user_nick", newNick);
        alert("회원 정보가 수정되었습니다.");
        location.reload();
    }
  });
}

// =========================================
// [핵심] 이미지 크롭 & 업로드 로직
// =========================================
function initImageCropper(myNick) {
  const fileInput = document.getElementById("profileUpload");
  const modal = document.getElementById("cropModal");
  const imageToCrop = document.getElementById("imageToCrop");
  const btnCancel = document.getElementById("btnCropCancel");
  const btnConfirm = document.getElementById("btnCropConfirm");
  const profileImgDisplay = document.getElementById("myProfileImg");

  // 1. 파일 선택 시 모달 열기
  fileInput?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        imageToCrop.src = ev.target.result;
        modal.classList.remove("hidden"); // 모달 표시
        
        // 기존 크롭퍼가 있다면 제거 (중복 방지)
        if (cropper) cropper.destroy();

        // Cropper.js 실행 (1:1 비율 고정)
        cropper = new Cropper(imageToCrop, {
          aspectRatio: 1,      // 정사각형 비율
          viewMode: 1,         // 이미지가 영역 밖으로 못 나가게
          autoCropArea: 0.8,   // 초기 선택 영역 크기
        });
      };
      reader.readAsDataURL(file);
    }
    // 같은 파일 다시 선택 가능하게 초기화
    e.target.value = ''; 
  });

  // 2. 취소 버튼
  btnCancel.addEventListener("click", () => {
    modal.classList.add("hidden");
    if (cropper) cropper.destroy();
  });

  // 3. 적용하기(Crop) 버튼
  btnConfirm.addEventListener("click", () => {
    if (!cropper) return;

    // 자른 이미지를 Canvas(Base64)로 변환
    const canvas = cropper.getCroppedCanvas({
      width: 300,  // 저장될 이미지 크기 (최적화)
      height: 300
    });

    const croppedBase64 = canvas.toDataURL("image/png");

    // 서버 업로드 시뮬레이션
    uploadProfileImage(croppedBase64).then(() => {
      // 화면 즉시 반영
      profileImgDisplay.src = croppedBase64;
      modal.classList.add("hidden");
      cropper.destroy();
      // alert("프로필 사진이 변경되었습니다.");
    });
  });
}

// [Mock API] 서버 업로드 시뮬레이션
function uploadProfileImage(base64Data) {
  return new Promise((resolve) => {
    console.log("서버로 이미지 전송 중...");
    
    // DB 대신 로컬 스토리지에 'user_img' 키로 저장
    // 나중에 이 부분을 fetch('/api/user/profile', ...) 로 바꾸면 됨
    localStorage.setItem("user_img", base64Data);
    
    setTimeout(() => resolve(true), 300);
  });
}

// =========================================
// [핵심] 자기소개글 관리 로직
// =========================================
function initBioSection(nickName) {
  const bioInput = document.getElementById("myBioInput");
  const btnEdit = document.getElementById("btnEditBio");
  const btnSave = document.getElementById("btnSaveBio");
  const btnCancel = document.getElementById("btnCancelBio");

  // 1. 데이터 불러오기 (서버 연동 시 여기서 fetch 사용)
  let currentBio = localStorage.getItem("user_bio");
  
  // 최초 계정 생성 시 기본값 설정
  if (!currentBio) {
    currentBio = `안녕하세요. ${nickName}입니다.`;
    localStorage.setItem("user_bio", currentBio); // DB 초기값 저장 시뮬레이션
  }
  
  bioInput.value = currentBio;

  // [상태 전환 함수] 읽기 모드 vs 수정 모드
  const toggleEditMode = (isEdit) => {
    if (isEdit) {
      // 수정 모드: 테두리 활성화, 저장/취소 버튼 표시
      bioInput.readOnly = false;
      bioInput.classList.remove("input-readonly");
      bioInput.classList.add("editable");
      bioInput.focus();

      btnEdit.classList.add("hidden");
      btnSave.classList.remove("hidden");
      btnCancel.classList.remove("hidden");
    } else {
      // 읽기 모드: 테두리 제거, 수정 버튼만 표시
      bioInput.readOnly = true;
      bioInput.classList.add("input-readonly");
      bioInput.classList.remove("editable");

      btnEdit.classList.remove("hidden");
      btnSave.classList.add("hidden");
      btnCancel.classList.add("hidden");
    }
  };

  // 2. 이벤트 리스너 연결
  
  // 수정 버튼 클릭
  btnEdit.addEventListener("click", () => {
    // 취소 시 되돌리기 위해 현재 값 임시 저장
    bioInput.dataset.original = bioInput.value;
    toggleEditMode(true);
  });

  // 취소 버튼 클릭
  btnCancel.addEventListener("click", () => {
    // 원래 값으로 복구
    bioInput.value = bioInput.dataset.original;
    toggleEditMode(false);
  });

  // 저장 버튼 클릭
  btnSave.addEventListener("click", () => {
    const newBio = bioInput.value.trim();
    if (!newBio) {
      alert("자기소개글을 입력해주세요.");
      return;
    }

    // 서버에 저장 (Simulated)
    saveBioToServer(newBio).then(() => {
      currentBio = newBio; // 최신화
      toggleEditMode(false);
      // alert("자기소개가 저장되었습니다."); // UX상 생략 가능
    });
  });
}

// [Mock API] 서버 저장 시뮬레이션
function saveBioToServer(bio) {
  return new Promise((resolve) => {
    // 실제 서버 통신 코드는 여기에 작성 (fetch 등)
    console.log("서버로 데이터 전송:", bio);
    
    // 로컬 스토리지에 저장 (DB 대용)
    localStorage.setItem("user_bio", bio);
    
    setTimeout(() => resolve(true), 200); // 통신 딜레이 흉내
  });
}