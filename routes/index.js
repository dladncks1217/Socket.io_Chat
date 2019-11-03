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
    res.render('room.pug', {title:'GIF 채팅방 생성'});
});  // (화면에 보여지는) 채팅방 라우터

router.post('/room',async (req,res,next)=> {  // 실제로 post요청으로 방 만들어주는 미들웨어
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
        console.log(io.sockets.manager.rooms);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

// 채팅방 접속 라우터
router.get('/room/:id',async(req,res,next)=>{
    try{
        const room = await Room.findOne({_id:req.params.id}); // 방 접속 후 해당 방에 대한 정보를 가져온다.
        const io = req.app.get('io');
        if(!room){
            req.flash('roomError','존재하지 않는 방입니다.'); // 존재하지 않는 방 접근
            return res.redirect('/');
        }
        if(room.password&&room.password!=req.query.password){
            req.flash('roomError','비밀번호가 틀렸습니다.');  // 비밀번호방 비밀번호 틀렸을때
            return res.redirect('/');
        }
        const { rooms } = io.of('/chat').adapter; // socket.js 에 currentRoom에서 socket.adapter.rooms[roomId]에 현재 방 정보가 나와있다 하였다.

        // 방 인원확인
        if(rooms&&rooms[req.params.id] && room.max <= rooms[req.params.id].length){ // 여기서 rooms 에서 length 하면 현재 방에 접속중인 사람 수.
            req.flash('roomError', '방이 가득 찼습니다.');
            res.redirect('/');
        }
        const chats = await Chat.find({room:room._id}).sort('createdAt');  // 방에 입장 시 예전 채팅 내용 렌더링 해줄 수 있도록 함.
        return res.render('chat',{ // 모든 조건 통과 후 렌더링
            room,
            title: room.title,
            chats,
            user: req.session.color, // app.js 의 colorHash 여기서 사용
        })
    }catch(error){
        console.error(error);
        next(error);
    }
});
// 채팅방 삭제 라우터
router.delete('/room/:id',async(req,res,next)=>{  // 사실 이 부분은 socket.js 에서 건드려도 되는거지만 디비건드려야하니까 라우터에다 하도록 하자.
    try{
        await Room.remove({id:req.params.id});
        await Chat.remove({room: req.params.id});
        res.send('ok');
        setTimeout(()=>{
            req.app.get('io').of('/room').emit('removeRoom',req.params.id);
        },2000);
    }catch(error){
        console.error(error);
        next(error);
    }
});

module.exports = router;