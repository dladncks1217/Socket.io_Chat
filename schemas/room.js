// 채팅방같은거 유지하려면 디비에 저장을 해야한다.
// 채팅들도 디비에 다 저장을 해야 나중에 껐다 켜도 유지가 된다.
const mongoose = require('mongoose');

const { Schema } = mongoose;
const roomSchema = new Schema({
    title:{     // 방 제목
        type:String,
        required: true,
    },
    max: {   // 최대 허용 인원
        type: Number,
        required: true,
        default: 10,  //기본값 10명
        mon: 2,       //최소 2명이상
    },
    owner: {     // 방장(방 만든사람)
        type: String,
        required: true,
    },
    password:String,   // 비밀번호 걸린 방일 경우 패스워드 필요하도록.
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Room',roomSchema);