/* 네임스페이스
 네임스페이스로 실시간 데이터가 전달될 주소를 구분할 수 있다. 기본 네임스페이스는 / 이다.
기본값은 io.of('/') (io.on으로 생략했었음.)
방 안에 들어가지도 않았는데 방 안의 모든 데이터 다 받아올 필요 없으므로 네임스페이스 나눈다.
room 네임스페이스는 채팅 방 목록에 관한 실시간 이벤트만 받는 네임스페이스로, chat 네임스페이스는 채팅에 대한 이벤트만 받는 네임스페이스로 한다.
불필요한 실시간 정보가 전달 안되도록 하기 위함이다. (서버 쪽 자원과 프론트쪽 자원을 아끼기 위함.)
*/
const SocketIO = require('socket.io');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const cookie = require('cookie-signature');

module.exports = (server, app, sessionMiddleware) =>{
    const io = SocketIO(server,{ path: '/socket.io' });
    app.set('io',io); // 익스프레스 변수 저장 방법이다.
    // 이 변수 라우터에서도 쓸 예정.
    // req.app.get('io').of('/room').emit


    const room = io.of('/room');  // room 네임스페이스에서는 방 목록에 관해서만 받을 것.(방 생기고 제거되고)
    const chat = io.of('/chat');  // chat 네임스페이스에서는 채팅 올라오고 사용자 채팅방 입장/퇴장에 대해서 받을 것.

    // Socket.io 에서의 미들웨어 생성.
    // 아래 코드는 express 미들웨어를 Socket.io 에서 사용.
    io.use((socket,next)=>{
        cookieParser(process.env.COOKIE_SECRET)(socket.request, socket.request.res,next);
    });
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
        axios.post(`http://localhost:8005/room/${roomId}/sys`,{
            type:'join',
        },{
            headers:{
                Cookie:`connect.sid = ${'s%3A'+ cookie.sign(req.signedCookies['connect.sid'], process.env.COOKIE_SECRET)}`,  // connect.sid 는 암호화된 쿠키.
            }
        });
        // cookie.sign + 쿠키 내용 + 암호화 키로 암호화 쿠키를 만든다.
        // connect.sid 는 express.session의 세션 쿠키이다. (개발자도구의 application의 connect.sid)
        // 이거 남아있는 한 세션 계속 유지된다. 이 값 바뀌면 다른사람으로 취급된다.
        // 서버는 항상 요청을 받았을 때 쿠키를 검사한다. 쿠키를 검사해서 만약 이 connect.sid가 같으면 같은사람으로, 다르면 다른 사람으로 인식

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
             axios.post(`htto://localhost:8005/room/${roomId}/sys`,{
                 type:'exit',
             },{
                 headers:{
                     Cookie: `connect.sid = ${'s%3A'+ cookie.sign(req.signedCookies['connect.sid'], process.env.COOKIE_SECRET)}`,
                 }
             })
            }
        });
        socket.on('dm',(data)=>{
            console.log('귓속말 전달됨',data);
            socket.to(data.target).emit('dm',data);
        });

        socket.on('ban',(data)=>{
            socket.to(data.id).emit('ban');
        });
        // 웹소켓은 휘발성이 강하다.
        // 바로바로 가긴 하는데 저장하고 처리하고 하는거는 직접 다 구현해야 하는 약점이 있다.
        // 그런건 라우터 한번 거쳐서 처리하는게 좋을듯
    });
};
/*
socket.join(방 아이디)   입장
socket.to(방 아이디).emit()   특정 방으로 메시지 전송
socket.leave(방 아이디)     퇴장
위 세 가지는 socket.io에서 이미 다 구현해놓음.
 */