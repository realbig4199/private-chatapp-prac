// express 라이브러리에서 express 함수 임포트
const express = require("express");
// path 라이브러리에서 path 함수 임포트
const path = require("path");

const { saveMessages } = require("./utils/message");

require("dotenv").config();

// express 함수를 호출하여 app 객체 생성
const app = express();

// socket.io를 Express 서버에 연결
const http = require("http"); // http 서버 생성을 위한 http 모듈 임포트
const { Server } = require("socket.io"); // Socket.io의 Server 클래스 임포트
const server = http.createServer(app); // http 서버 생성 및 Express 앱 연동
const io = new Server(server); // Socket.io 서버를 생성하고 HTTP 서버에 연결 후 io 객체 생성

// 정적 파일 제공
const publicPath = path.join(__dirname, "../public");
app.use(express.static(publicPath));

// json 데이터 파싱
app.use(express.json());

// DB 연결
// 몽구스 라이브러리에서 mongoose 함수 임포트
const mongoose = require("mongoose");

const mongoURI = process.env.mongoURI;

// 몽구스 라이브러리의 connect 메서드를 사용하여 MongoDB 서버에 연결
mongoose
  .connect(mongoURI)
  .then(() => console.log("DB 연결 성공"))
  .catch((err) => console.log(err));

const crypto = require("crypto");

const randomId = () => crypto.randomBytes(8).toString("hex");

app.post("/session", (req, res) => {
  const data = {
    username: req.body.username,
    userID: randomId(),
  };
  res.send(data);
});

// io.use 미들웨어 - 소켓 연결이 이뤄지기 전에 실행됨
// 클라이언트가 보내준 인증 정보(auth)를 사용하여 소켓 객체에 사용자 정보를 설정
// connection 이벤트 핸들러보다 당연히 위에 정의되어야 함 (미들웨어이기 때문에)
io.use((socket, next) => {
  // 클라이언트가 보낸 인증 정보는 socket.handshake 객체의 auth 속성에 포함됨
  // auth 객체에서 사용자 정보 추출
  const username = socket.handshake.auth.username;
  const userID = socket.handshake.auth.userID;

  if (!username) {
    return next(new Error("Invalid username"));
  }

  // 소캣 객체에 사용자 정보 설정
  socket.username = username;
  socket.id = userID;

  // 미들웨어는 next로 제어를 넘김
  next();
});

let users = [];

// Socket.io 이벤트 리스너 설정
io.on("connection", async (socket) => {
  // 소켓 객체에 담겨진 사용자 정보를 추출
  let uesrData = {
    username: socket.username,
    userID: socket.id,
  };
  users.push(uesrData);
  // console.log(users);
  // 모든 클라이언트에게 이벤트 전달 - 사용자 데이터 전송
  // user-data 이벤트를 통해 모든 클라이언트에게 사용자 데이터를 전송
  io.emit("users-data", { users });

  // 클라이언트에서 온 메시지를 payload.to에게 전송
  socket.on("message-to-server", (payload) => {
    console.log("Received message from client:", payload); // 메시지 수신 로그 추가
    io.to(payload.to).emit("message-to-client", payload);
    saveMessages(payload)
      .then(() => {
        console.log("메시지가 DB에 저장되었습니다."); // DB 저장 로그 추가
      })
      .catch((err) => {
        console.error("DB 저장 오류:", err);
      });
  });
  // DB에서 메시지 가져오기
  socket.on("fetch-messages", () => {});

  // 유저가 방에서 나갔을 때
  socket.on("disconnect", () => {});
});

// 지정된 포트 번호에 서버를 실행
const port = 4000;
// 톱합된 서버를 실행 (Express 서버와 Socket.io 서버)
server.listen(port, () => {
  console.log(`${port}번 포트에서 서버 실행중`);
});
