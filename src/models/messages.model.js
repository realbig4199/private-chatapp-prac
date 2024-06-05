// mongoose 라이브러리에서 Schema 함수 임포트
const mongoose = require("mongoose");

// Schema 메서드 사용용 스키마 생성
const messageSchema = mongoose.Schema({
  userToken: {
    type: String,
    required: true,
  },
  messages: [
    {
      from: {
        type: String,
        required: true,
      },
      message: {
        type: String,
        required: true,
      },
      time: {
        type: String,
        required: true,
      },
    },
  ],
});

// model 메서드 사용하여 모델을 정의
const messageModel = mongoose.model("Message", messageSchema);

module.exports = messageModel;
