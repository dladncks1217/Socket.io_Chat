/* 네임스페이스
 네임스페이스로 실시간 데이터가 전달될 주소를 구분할 수 있다. 기본 네임스페이스는 / 이다.
기본값은 io.of('/') (io.on으로 생략했었음.)
방 안에 들어가지도 않았는데 방 안의 모든 데이터 다 받아올 필요 없으므로 네임스페이스 나눈다.
room 네임스페이스는 채팅 방 목록에 관한 실시간 이벤트만 받는 네임스페이스로, chat 네임스페이스는 채팅에 대한 이벤트만 받는 네임스페이스로 한다.
불필요한 실시간 정보가 전달 안되도록 하기 위함이다. (서버 쪽 자원과 프론트쪽 자원을 아끼기 위함.)
*/
const SocketIO = require('socket.io');
const axios = require('axios');

module.exports = (server, app, sessionMiddleware) =>{
    const io = SocketIO(server,{ path: '/socket.io' });
    app.set('io',io); // 익스프레스 변수 저장 방법이다.
    // 이 변수 라우터에서도 쓸 예정.
    // req.app.get('io').of('/room').emit


    const room = io.of('/room');  // room 네임스페이스에서는 방 목록에 관해서만 받을 것.(방 생기고 제거되고)
    const chat = io.of('/chat');  // chat 네임스페이스에서는 채팅 올라오고 사용자 채팅방 입장/퇴장에 대해서 받을 것.

    // Socket.io 에서의 미들웨어 생성.
    // 아래 코드는 express 미들웨어를 Socket.io 에서 사용.
    io.use((socket, next)=>{  // 웹 소켓에서는 요청 응답이 없고, socket과 next인자만 존재한다.
        sessionMiddleware(socket.request, socket.request.res, next);
    });


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
            // 방에 인원 없을 시 방을 없앤다.
            const currentRoom = socket.adapter.rooms[roomId];  // socket.adapter.rooms[방아이디]에 방 정보와 인원이 들어있다.
            const userCount = currentRoom ? currentRoom.length : 0;  // 방.length 하면 현재 사용자 수가 나온다.
            console.log(`현재 ${userCount}명 남아있습니다.`);
            if(userCount === 0){   //방에 남아있는 사람이 없으면
                axios.delete(`http://localhost:8005/room/${roomId}`)
                    .then(()=>{
                        console.log('방 제거 요청 성공');
                    })
                    .catch((error)=>{
                        console.error(error);
                    });
            }else{     //방에 남은 인원 있을 경우 누가 퇴장했다 메시지 보냄.(이것때문에 분기처리)
                socket.to(roomId).emit('exit',{
                    user: 'system',
                    chat: `${req.session.color} 님이 퇴장하셨습니다.`,
                });
            }
        });
    });
};

/*
socket.join(방 아이디)   입장
socket.to(방 아이디).emit()   특정 방으로 메시지 전송
socket.leave(방 아이디)     퇴장
위 세 가지는 socket.io에서 이미 다 구현해놓음.
 */