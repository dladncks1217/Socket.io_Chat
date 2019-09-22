//웹 소켓은 따로 포트 연결을 할 필요가 없는 것이, 만약 우리가 8001번같은거 쓰면 웹 소켓도 자동으로 8001번을 사용하여
//HTTP 서버와 웹 소켓(프로토콜)이 같은 포트를 사용할 수가 있다. 
//HTTP와 WS는 포트를 공유하기 때문에, 따로 포트를 연결할 필요가 없는 것이다.
//웹 소켓은 이벤트기반으로 작동.

const WebSocket = require('socket.io');

module.exports = (server) =>{
    const io = SocketIO(server,{path:'/socket.io'});
    const req = socket.request;
    io.on('connection',(socket)=>{
        const ip = req.headers['x-fowarded-for'] || req.connection.remoteAddress;
        console.log('새로운 클라이언트 접속!', ip, socket.id, req.id);
    })

    io.on('connection',(socket)=>{
       socket.on('disconnect',()=>{    //ws 모듈의 closed와 같다고 보면 된다. 이건 소켓 내장 이벤트임.
            console.log('클라이언트 접속 해제',ip,socket.id);
       });
       socket.on('error',(error)=>{
           console.error(error);
       });
       socket.on('reply',(data)=>{      //ws 모듈의 message 부분이다. 우리가 만든 이벤트.
           console.log(data);
       });
       socket.interval = setInterval = (() => {
            socket.emit('news','Hello Socket IO');    //'emit' 은 ws 모듈에서 send 이다. 키, 값 형태로 보낸다.
        },3000);
    });

};