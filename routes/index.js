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



module.exports = router;