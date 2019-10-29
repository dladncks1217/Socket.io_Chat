const mongoose = require('mongoose');

const {MONGO_ID, MONGO_PASSWORD, NODE_ENV} = process.env;
const MONGO_URL = `mongodb://${MONGO_ID}:${MONGO_PASSWORD}@localhost:27017/admin`;  //dotenv파일 안에 아이디 패스워드 있음.
//mongoDB는 접속 주소로 접속.

module.exports = () =>{
    const connect = () =>{
            mongoose.connect(MONGO_URL,{
                dbName:'gifchat',
            },(error)=>{
                if(error){
                    console.log('몽고디비 연결 에러',error);
                }else{
                    console.log('몽고디비 연결 성공!');
                }
            });
    };
    connect();

    mongoose.connection.on('error',(error)=>{
        console.error('몽고디비 연결 에러',error);
    });
    mongoose.connection.on('disconnected',()=>{
        console.error('몽고디비 연결이 끊어졌습니다. 연결을 재시도합니다.');
        connect();
    });
    require('./chat');
    require('./room');
};