const express = require('express');
const path = require('path');
const morgan = require('morgan');
const session = require('express-session');
const flash = require('connect-flash');
const ColorHash = require('color-hash');   //익명채팅이라 사용자 구분힘들기 때문에 사용.(사용자 아이디 색깔로.)
const CookieParser = require('cookie-parser');
require('dotenv').config();

const webSocket = require('./socket');
const indexRouter = require('./routes');
const connect = require('./schemas/index');

const app = express();
connect();
const sessionMiddleware = session({   //Socket.io 에서도 사용하기 위해 변수로 빼놓음.
    resave:false,
    saveUninitialized:false,
    secret:process.env.COOKIE_SECRET,
    cookie:{
        httpOnly:true,
        secure: false,
    },
});

app.set('views',path.join(__dirname,'views'));
app.set('view engine','pug');
app.set('port',process.env.PORT||8005);

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname,'public')));
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(CookieParser(process.env.COOKIE_SECRET));
app.use(sessionMiddleware);
app.use(flash());

app.use((req,res,next)=>{       // 접속하는 사람들에게 고유의 색 랜덤 부여.
    if(!req.session.color){         // 첫 접속 때 세션에 컬러 저장 안되어있으면
        const colorHash = new ColorHash();        // 임의로 컬러 지정
        req.session.color = colorHash.hex(req.sessionID);      // 지정된 컬러 세션에 저장.
    }
    next();
});

app.use('/',indexRouter);

app.use((req,res,next)=>{
    const err = new Error('Not Found');
    err.status=404;
    next(err);
});

app.use((err,req,res)=>{
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err:{};
    res.status(err.status||500);
    res.render('error');
});

const server = app.listen(app.get('port'),()=>{   // 여기서 listen을 server 변수에 저장한다.
    console.log(app.get('port'),'번 포트에서 대기중');
});

webSocket(server, app, sessionMiddleware);   // 웹 소켓 서버와 익스프레스 서버 연결.(세션도 같이 보냄)