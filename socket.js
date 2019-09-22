const SocketIO = require('socket.io');

module.exports = (server) =>{
    const io = SocketIO(server,{ path: '/socket.io' });

    io.on('connection',(socket) => {
       const req = socket.request;
       const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
       console.log('새로운 클라이언트 접속!', ip, socket.id, req.ip);
       socket.on('disconnect',()=>{    //ws 모듈의 closed와 같다. 이건 소켓 내장 이벤트임.
            console.log('클라이언트 접속 해제',ip,socket.id);
            clearInterval(socket.interval);
       });
       socket.on('error',(error)=>{
           console.error(error);
       });
       socket.on('message',(data)=>{
           console.log(data);
       });
       socket.on('reply',(data)=>{      //ws 모듈의 message 부분이다. 우리가 만든 이벤트.
           console.log(data);
       });
       socket.interval = setInterval(() => {
            socket.emit('news','Hello Socket IO');    //'emit' 은 ws 모듈에서 send 이다. 키, 값 형태로 보낸다.
        },3000);
    });
};