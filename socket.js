const SocketIO = require('socket.io');
const axios = require('axios');

module.exports = (server) =>{
    const io = SocketIO(server,{ path: '/socket.io' });
    /* 네임스페이스
     네임스페이스로 실시간 데이터가 전달될 주소를 구분할 수 있다. 기본 네임스페이스는 / 이다.
    기본값은 io.of('/') (io.on으로 생략했었음.)
    방 안에 들어가지도 않았는데 방 안의 모든 데이터 다 받아올 필요 없으므로 네임스페이스 나눈다.
    room 네임스페이스는 채팅 방 목록에 관한 실시간 이벤트만 받는 네임스페이스로, chat 네임스페이스는 채팅에 대한 이벤트만 받는 네임스페이스로 한다.
    불필요한 실시간 정보가 전달 안되도록 하기 위함이다. (서버 쪽 자원과 프론트쪽 자원을 아끼기 위함.)
    */

    const room = io.of('/room');  // room 네임스페이스에서는 방 목록에 관해서만 받을 것.(방 생기고 제거되고)
    const chat = io.of('/chat');  // chat 네임스페이스에서는 채팅 올라오고 사용자 채팅방 입장/퇴장에 대해서 받을 것.

    room.on('connection',(socket)=>{
        console.log('room 네임스페이스에 접속.');
        socket.on('disconnect',()=>{
            console.log('room 네임스페이스 접속 해제');
        });
    });

    chat.on('connection',(socket)=>{
        console.log('chat 네임스페이스에 접속');
        const req = socket.request;
        const { headers:{ referer }} = req;
        const roomId = referer                                          //  방 제목을 받아온다.
            .split('/')[referer.split('/').length-1]                    // req.headers.referer 에 웹 주소가 들어있는데, 거기서 방 아이디를 가져온다.
            .replace(/\?.+/,'');               //
        // /room/asdfasdf 와 같은 형태로 접근할것이다. (/네임스페이스/아이디) 이런 형태로 roomId를 가져온다. (req.headers.referer)
        socket.join(roomId);   // 채팅방 입장
        // 위의 socket.join(roomId); 부분은 socket.io가 미리 만들어둔 코드. 인자(roomId)에 접속하는 코드이다. 다시말해, socket.io 가 채팅방처럼 기능할 수 있도록 미리 구현해두었다는 것이다.
        socket.to(roomId).emit('join',{               //socket.emit은 모두에게 메시지를 보내는 것이였다.  socket.to(roomId).emit 하므로써, 그 방에만 메시지 보낸다.
            user: 'system',
            chat: `${req.session.color}님이 입장하셨습니다.`,
        });

        socket.on('disconnect', ()=>{
            console.log('네임스페이스 접속 해제');
            socket.leave(roomId);                       // 채팅방 퇴장
            const currentRoom = socket.adapter.rooms[roomId];
            const userCount = currentRoom ? currentRoom.length : 0;
            if(userCount === 0){
                axios.delete(`http://localhost:8005/room/${roomId}`)
                    .then(()=>{
                        console.log('방 제거 요청 성공');
                    })
                    .catch((error)=>{
                        console.error(error);
                    });
            }else{
                socket.to(roomId).emit('exit',{
                    user: 'system',
                    chat: `${req.session.color} 님이 퇴장하셨습니다.`,
                });
            }
        });
    });

    /*
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

     */
};

/*
socket.join(방 아이디)   입장
socket.to(방 아이디).emit()   특정 방으로 메시지 전송
socket.leave(방 아이디)     퇴장
위 세 가지는 socket.io에서 이미 다 구현해놓음.
 */