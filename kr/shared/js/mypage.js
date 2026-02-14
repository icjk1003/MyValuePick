/* shared/js/mypage.js */

document.addEventListener("DOMContentLoaded", () => {
  // 1. 로그인 체크
  const isLoggedIn = localStorage.getItem("is_logged_in");
  if (!isLoggedIn) {
    alert("로그인이 필요한 서비스입니다.");
    location.href = "login.html";
    return;
  }

  // 2. 정보 불러오기 & 기능 연결
  loadMyInfo();
  
  const btnSave = document.getElementById("btnSaveMyInfo");
  if(btnSave) btnSave.addEventListener("click", saveMyInfo);

  // [추가] 프로필 사진 변경 이벤트 연결
  const fileInput = document.getElementById("profileUpload");
  if(fileInput) {
    fileInput.addEventListener("change", handleProfileImageChange);
  }
});

function loadMyInfo() {
  const id = localStorage.getItem("user_id") || "";
  const nick = localStorage.getItem("user_nick") || "";
  
  // [수정] 저장된 이미지가 있으면 그거 쓰고, 없으면 기본 이미지
  const savedImg = localStorage.getItem("user_profile_img");
  const defaultImg = `https://ui-avatars.com/api/?name=${nick}&background=random`;
  
  document.getElementById("myProfileImg").src = savedImg || defaultImg;

  document.getElementById("myNickDisplay").textContent = nick;
  document.getElementById("myIdDisplay").textContent = "@" + id;

  document.getElementById("myIdInput").value = id;
  document.getElementById("myNickInput").value = nick;
}

// [추가] 이미지 변경 처리 (FileReader 사용)
function handleProfileImageChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  // 이미지 파일인지 확인
  if (!file.type.startsWith("image/")) {
    alert("이미지 파일만 업로드 가능합니다.");
    return;
  }

  // 브라우저에서 파일을 읽어서 미리보기 URL 생성
  const reader = new FileReader();
  reader.onload = function(event) {
    const newDataUrl = event.target.result; // Base64 형태의 이미지 데이터
    
    // 1. 화면에 즉시 반영
    document.getElementById("myProfileImg").src = newDataUrl;
    
    // 2. 저장소에 저장 (새로고침 해도 유지되도록)
    localStorage.setItem("user_profile_img", newDataUrl);
  };
  reader.readAsDataURL(file);
}

function saveMyInfo() {
  const newNick = document.getElementById("myNickInput").value.trim();
  const newPw = document.getElementById("myPwInput").value.trim();
  const newPwCheck = document.getElementById("myPwCheckInput").value.trim();

  if(!newNick) { alert("닉네임을 입력해주세요."); return; }
  
  if(newPw || newPwCheck) {
    if(newPw.length < 4) { alert("비밀번호는 4자 이상이어야 합니다."); return; }
    if(newPw !== newPwCheck) { alert("비밀번호가 일치하지 않습니다."); return; }
    localStorage.setItem("registered_pw", newPw);
  }

  // 닉네임 저장
  localStorage.setItem("user_nick", newNick);
  if(localStorage.getItem("registered_id") === localStorage.getItem("user_id")) {
    localStorage.setItem("registered_nick", newNick);
  }

  alert("회원 정보가 수정되었습니다.");
  location.reload();
}