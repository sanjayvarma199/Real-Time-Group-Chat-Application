const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const format = require('./utils/messages');
const {userJoin,getCurrentUser,userLeave,getRoomUsers} = require('./utils/users');

const app = express();
const port = 3000 || process.env.port;

// http server
const server = http.createServer(app);
const io = socketio(server);
const botName = 'Chat-board';
// runs when a client connects
io.on('connection',socket => {
    
    socket.on('joinRoom', ({username,room}) => {
    
    const user = userJoin(socket.id,username,room);
    
    socket.join(user.room);

    // Sends message to client i.e main.js welcomes current user
    socket.emit('message',format(botName,'Welcome to the Chat Board')); 

    //Broadcast everyone except user when the user connects
    socket.broadcast.to(user.room).emit('message',format(botName,`${user.username} has joined the chat`));
   
    //send users and room info
    io.to(user.room).emit('roomUsers',{
       room : user.room,
       users : getRoomUsers(user.room)
    });
});

    //Catching the message from client
    socket.on('chatMessage',msg => 
    {
        const user = getCurrentUser(socket.id);
       //console.log(msg);
       io.to(user.room).emit('message',format(user.username,msg));
    });

    //Broadcast to everyone when users leaves the chat
    socket.on('disconnect', () => 
    {
       const user = userLeave(socket.id);
       if(user)
       {
         io.to(user.room).emit('message',format(botName,`${user.username} has left the chat`));
       }

       io.to(user.room).emit('roomUsers',{
        room : user.room,
        users : getRoomUsers(user.room)
       });

    });
})

// static use
app.use(express.static(path.join(__dirname,'public')));

server.listen(port,function(req,res)
{
    console.log("Server Started");
})