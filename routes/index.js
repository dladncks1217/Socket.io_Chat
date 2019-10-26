const express = require('express');

const Room = require('../schemas/room');
const Chat = require('../schemas/chat');

const router = express.Router();

router.get('/',async (req,res, next)=>{
    try{
        const rooms = await Room.find({});
        res.render('main',{
            rooms,
            title:'GIF 채팅방',
            error: req.flash('roomError')});
    } catch(error){
        console.error(error);
        next(error);
    }
});

router.get('/room',(req,res)=>{
    res.render('room', {title:'GIF 채팅방 생성'});
});  // (화면에 보여지는) 채팅방 라우터

router.post('room',async (req,res,next)=> {  // 실제로 post요청으로 방 만들어주는 미들웨어
    try {
        const room = new Room({
            title: req.body.title,
            max: req.body.max,
            owner: req.session.color,
            password: req.body.password,
        });
        const newRoom = await room.save();   // 위에 room 변수만든거 save()해서 방을 생성한다.
        const io = req.app.get('io');
        io.of('/room').emit('newRoom',newRoom); // emit 은 특정방으로 메시지보내기. room 네임스페이스에 있던 사람들한테 새로운 방 생성 알려줌.
        res.redirect(`/room/${newRoom._id}?password=${req.body.password}`); // 방에 접속하는 라우터, 비밀번호 있으면 쿼리스트링으로 붙여준다.
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;