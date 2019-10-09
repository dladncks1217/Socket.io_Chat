const SocketIO = require('socket.io');

module.exports = (server) =>{
    const io = SocketIO(server,{ path: '/socket.io' });
    /* 네임스페이스
     네임스페이스로 실시간 데이터가 전달될 주소를 구분할 수 있다. 기본 네임스페이스는 / 이다.
    기본값은 io.of('/') (io.on으로 생략했었음.)
    방 안에 들어가지도 않았는데 방 안의 모든 데이터 다 받아올 필요 없으므로 네임스페이스 나눈다.
    room 네임스페이스는 채팅 방 목록에 관한 실시간 이벤트만 받는 네임스페이스로, chat 네임스페이스는 채팅에 대한 이벤트만 받는 네임스페이스로 한다.
    불필요한 실시간 정보가 전달 안되도록 하기 위함이다. (서버 쪽 자원과 프론트쪽 자원을 아끼기 위함.)
    */

    const room = io.of('/room');
    const chat = io.of('/chat');

    room.on('conncetion',(socket)=>{
        console.log('room 네임스페이스에 접속.');
        socket.on('disconnect',()=>{
            console.log('room 네임스페이스 접속 해제');
        });
    });

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