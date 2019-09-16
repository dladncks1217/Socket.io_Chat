const express = require('express');
const path = require('path');
const morgan = require('morgan');
const session = require('express-session');
const flash = require('connect-flash');
const CookieParser = require('cookie-parser');
require('dotenv').config();

const webSocket = require('./socket');
const indexRouter = require('./routes');

const app = express();

app.set('views',path.join(__dirname,'views'));
app.set('view engine','pug');
app.set('port',process.env.PORT||8005);

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname,'public')));
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(CookieParser(process.env.COOKIE_SECRET));
app.use(session({
    resave:false,
    saveUninitialized:false,
    secret:process.env.COOKIE_SECRET,
    cookie:{
        httpOnly:true,
        secure: false,
    },
}));
app.use(flash());

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

webSocket(server);   //webSocket 인자값으로 listen들어가있는 server 변수를 넣어준다.(웹 소켓과 익스프레스 서버 연결.)