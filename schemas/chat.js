// 채팅을 저장할 스키마.
const mongoose = require('mongoose');

const { Schema } = mongoose;
const { Types: {ObjectId}} = Schema;

// 현재 시간 추가
const date = new Date();
let hour = date.getHours();
let minutes = date.getMinutes();
if(minutes<10){
    minutes = `0${minutes}`;
}
if(hour<10){
    hour = `0${hour}`;
}
const chatSchema = new Schema({
    room:{
        type: ObjectId,
        required: true,
        ref: 'Room',
    },
    user:{
        type: String,
        required: true,
    },
    chat:String,
    gif:String,
    createdAt:{
        type: Date,
        default: Date.now,
    },
    chattime:{
        type:String,
        default: `${hour}:${minutes}`,
    }
});

module.exports = mongoose.model('Chat', chatSchema);