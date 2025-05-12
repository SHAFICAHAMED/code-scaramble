// const express=require('express')
// const http=require('http')
// const socketIo=require('socket.io')
// const cors=require('cors')
// const { checkAnswer,getRandomQuestion } = require('./utils/codeChecker');
// const app=express();

// // scores={}

// const players={name:'',score:0}

// app.use(cors());

// const server=http.createServer(app);

// const io=socketIo(server,{
//     cors:{origin:'*'}
// });

// io.on('connection',(socket)=>{
//     console.log("Player Connnected:", socket.id);
//     socket.on('joinGame',(playerName)=>{
//     players[socket.id] = { name: playerName, score: 0 };
//         const question = getRandomQuestion();

//         socket.emit('newQuestion',question);
//         io.emit('leaderboardUpdate',players);
//     });

//     // scores[socket.id]=0

    

//     socket.on('submitCode',({code,questionId})=>{
//         const iscorrect=checkAnswer(code,questionId);

//         if(iscorrect&&players[socket.id]){
//             players[socket.id].score+=1;
//             socket.emit('codeResult',{correct:true,message:'Correct!!'});

//             io.emit('leaderboardUpdate',players);

//             const newQ=getRandomQuestion();
//             io.emit('newQuestion',newQ);

//         }
//         else{
//             socket.emit('codeResult',{correct:false,message:"Wrong!"})
//         }
//     }

// );
    
//     socket.on('disconnect',()=>{
//         delete players[socket.id];
//         io.emit('leaderboardUpdate',players);
//         console.log('Player disconnected:',socket.id);
//     });
// });

// server.listen(3000,()=>{
// console.log("server running on port http://localhost:3000")
// });



//add room
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { checkAnswer, getRandomQuestion } = require('./utils/codeChecker');

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors());

// Initialize Socket.io with the server
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = {};

// Socket logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('createRoom', ({ roomId, name }) => {
    if (!rooms[roomId]) {
      // Create the room without starting the game yet (no question)
      rooms[roomId] = {
        players: {},
        currentQuestion: null
      };
    }
    rooms[roomId].players[socket.id] = { name, score: 0 };
    socket.join(roomId);

    // Update leaderboard for the room
    io.to(roomId).emit('leaderboardUpdate', rooms[roomId].players);
  });

  socket.on('joinRoom', ({ roomId, name }) => {
    if (rooms[roomId]) {
      rooms[roomId].players[socket.id] = { name, score: 0 };
      socket.join(roomId);
      io.to(roomId).emit('leaderboardUpdate', rooms[roomId].players);
    } else {
      socket.emit('roomNotFound');
    }
  });

  socket.on('startGame', ({ roomId }) => {
    if (rooms[roomId]) {
      // Only when the creator clicks "Start Game" is the first question sent.
      const newQuestion = getRandomQuestion();
      rooms[roomId].currentQuestion = newQuestion;
      io.to(roomId).emit('newQuestion', {
        question: newQuestion.question,
        id: newQuestion.id
      });
    }
  });

  socket.on('submitCode', ({ code, questionId }) => {
    // Find the room where the socket belongs
    const roomId = Object.keys(rooms).find((room) =>
      io.sockets.adapter.rooms.get(room)?.has(socket.id)
    );
    if (!roomId) return;

    const isCorrect = checkAnswer(code, questionId);
    if (isCorrect) {
      rooms[roomId].players[socket.id].score += 1;
      socket.emit('codeResult', { correct: true, message: 'Correct!' });

      const newQuestion = getRandomQuestion();
      rooms[roomId].currentQuestion = newQuestion;
      io.to(roomId).emit('newQuestion', {
        question: newQuestion.question,
        id: newQuestion.id
      });
    } else {
      socket.emit('codeResult', { correct: false, message: 'Wrong!' });
    }

    io.to(roomId).emit('leaderboardUpdate', rooms[roomId].players);
  });

  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      if (rooms[roomId].players[socket.id]) {
        delete rooms[roomId].players[socket.id];
        io.to(roomId).emit('leaderboardUpdate', rooms[roomId].players);
      }
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
