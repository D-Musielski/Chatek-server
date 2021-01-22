const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "http://192.168.56.1:19006",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// let numUsers = 0;

// io.on('connection', (socket) => {
//   let addedUser = false;
//   console.log('connected');
//   // when the client emits 'new message', this listens and executes
//   socket.on('new message', (data) => {
//     console.log('message', data);
//     // we tell the client to execute 'new message'
//     socket.broadcast.emit('new message', {
//       senderId: data.senderId,
//       content: data.content
//     });
//   });

//   // when the client emits 'add user', this listens and executes
//   socket.on('add user', (username) => {
//     if (addedUser) return;

//     // we store the username in the socket session for this client
//     socket.username = username;
//     ++numUsers;
//     addedUser = true;
//     socket.emit('login', {
//       numUsers: numUsers
//     });
//     // echo globally (all clients) that a person has connected
//     socket.broadcast.emit('user joined', {
//       username: socket.username,
//       numUsers: numUsers
//     });
//   });

//   // when the client emits 'typing', we broadcast it to others
//   socket.on('typing', () => {
//     socket.broadcast.emit('typing', {
//       username: socket.username
//     });
//   });

//   // when the client emits 'stop typing', we broadcast it to others
//   socket.on('stop typing', () => {
//     socket.broadcast.emit('stop typing', {
//       username: socket.username
//     });
//   });

//   // when the user disconnects.. perform this
//   socket.on('disconnect', () => {
//     if (addedUser) {
//       --numUsers;

//       // echo globally that this client has left
//       socket.broadcast.emit('user left', {
//         username: socket.username,
//         numUsers: numUsers
//       });
//     }
//   });
// });

const clients = [];
io.on('connection', function (socket) {
  clients.push(socket);

  socket.join('waiting room');
  connectRandomClients();

  socket.on('new message', (data) => {
    console.log([...socket.rooms]);
    console.log('message', data);

    socket.to([...socket.rooms][1]).emit('new message', {
      senderId: data.senderId,
      content: data.content
    });
  });

  socket.on('new chat', () => {
    if ([...socket.rooms][1] !== 'waiting room') {
      socket.to([...socket.rooms][1]).emit('partner disconnected');
      socket.leave([...socket.rooms][1]);
      socket.join('waiting room');
      clients.push(socket);
      connectRandomClients();
    }
  });
});

function connectRandomClients() {
  console.log(clients.length);
  if (clients.length >= 2) {
    const room = uuidv4();

    clients[0].leave('waiting room');
    clients[1].leave('waiting room');

    clients[0].join(room);
    clients[1].join(room);

    clients[0].emit('new chat');
    clients[1].emit('new chat');

    clients.shift();
    clients.shift();
  }
}

server.listen(PORT, () => {
  console.log('server listening on port: ' + PORT);
})