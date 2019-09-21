//웹 소켓은 따로 포트 연결을 할 필요가 없는 것이, 만약 우리가 8001번같은거 쓰면 웹 소켓도 자동으로 8001번을 사용하여
//HTTP 서버와 웹 소켓(프로토콜)이 같은 포트를 사용할 수가 있다. 
//HTTP와 WS는 포트를 공유하기 때문에, 따로 포트를 연결할 필요가 없는 것이다.
//웹 소켓은 이벤트기반으로 작동.

const WebSocket = require('ws');  

module.exports = (server) =>{   // 이 express 서버를 웹 소켓 서버와 연결을 해 주는 것이다.
    const wss = new WebSocket.Server({server});

    wss.on('connection',(ws,req)=>{   //사용자 한 명이 접속하였을 때 connection     /   req를 한번 보내고 계속해서 연결하는거기 때문에 res는 없다.
        const ip = req.headers['x-forwarded-for']||req.connection.remoteAddress; // req.headers['x-forwarded-for] -> 프록시 거치기 전의 ip    req.connection.remoteAddress -> 최종 ip
        console.log('클라이언트 접속', ip); //접속 시 ip가 뜨도록.
        ws.on('message',(message)=>{   //우리가 메시지를 보냈을 때.
            console.log(message);
        });
        ws.on('error',(error)=>{    //에러이벤트
            console.error(error);
        });
        ws.on('close',()=>{    //접속 종료했을 때.  
            console.log('클라이언트 접속 해제',ip);
            clearInterval(ws.interval);
        });
        const interval = setInterval(()=>{  //ws.OPEN   ws.CONNECTING   ws.CLOSING  ws.CLOSED 등의 메서드들이 있다.
            if(ws.readyState === ws.OPEN){  //웹 소켓 양 방향 연결이 수립되었다는 것이다. AJAX의 readyState와 비슷한 느낌이라고 보면 된다.
            ws.send('서버에서 클라이언트로 메시지를 보냅니다.');
            }
        },3000);
       ws.interval = interval;  //웹 소켓 객체에 interval 변수를 저장했는데, 그 이유는 클라이언트가 종료될 떄 clearInterval로 메시지 보내는것을 해제하기 위함.
       //만약 이를 해제안하면 메모리 누수가 발생.
    });
};