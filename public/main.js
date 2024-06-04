// 소켓 객체 생성
// 원래라면 소켓 객체 생성 시 내부적으로 Socket.io 서버에 즉시 연결되지만, autoConnect 옵션을 false로 설정하여 연결을 지연시킴
const socket = io("http://localhost:4000", {
  autoConnect: false, // 로그인한 다음에 연결하는 것이기 때문에
});

// onAny 메서드 : Socket.io에서 제공하는 메서드로 모든 이벤트에 대해 반응하는 핸들러
socket.onAny((event, ...args) => {
  console.log(event, args);
});

// 전역 변수들
const chatBody = document.querySelector(".chat-body");
const userTitle = document.querySelector("user-title");
const loginContainer = document.querySelector(".login-container");
const userTable = document.querySelector(".users");
const userTagline = document.querySelector("#user-tagline");
const title = document.querySelector("#active-user");
const messages = document.querySelector(".messages");
const msgDiv = document.querySelector(".msg-from");

// 로그인 폼 핸들러
const loginForm = document.querySelector(".user-login");
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("username");
  createSession(username.value.toLowerCase());
  username.value = "";
});

const createSession = async (username) => {
  const options = {
    method: "Post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  };
  await fetch("/session", options)
    .then((res) => res.json())
    .then((data) => {
      socketConnect(data.username, data.userID);

      // 로컬 스토리지에 사용자 정보 저장
      localStorage.setItem("sesson-username", data.username);
      localStorage.setItem("session-userID", data.userID);

      loginContainer.classList.add("d-none");
      chatBody.classList.remove("d-none");
      userTitle.innerHTML = data.username;
    })
    .catch((err) => console.log(err));
};

const socketConnect = async (username, userID) => {
  socket.auth = { username, userID };

  await socket.connect();
};
