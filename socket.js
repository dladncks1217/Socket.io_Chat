//웹 소켓은 따로 포트 연결을 할 필요가 없는 것이, 만약 우리가 8001번같은거 쓰면 웹 소켓도 자동으로 8001번을 사용하여
//HTTP 서버와 웹 소켓(프로토콜)이 같은 포트를 사용할 수가 있다. 
//HTTP와 WS는 포트를 공유하기 때문에, 따로 포트를 연결할 필요가 없는 것이다.
//웹 소켓은 이벤트기반으로 작동.

const WebSocket = require('ws');  

module.exports = (server) =>{   // 이 express 서버를 웹 소켓 서버와 연결을 해 주는 것이다.
    const wss = new WebSocket.Server({server});

    wss.on('connection',(ws,req)=>{   //사용자 한 명이 접속하였을 때 connection
        ws.on('message',(message)=>{   //우리가 메시지를 보냈을 때.
            
        });
        ws.on('error',(error)=>{    //에러이벤트

        });
        ws.on('close',()=>{    //접속 종료했을 때.  

        });
    })
};