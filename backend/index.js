import express from 'express';
import http from 'http';
import { Server as SocketIoServer } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new SocketIoServer(server, {
  cors: {
    origin: `*`,
  },
});

app.use(cors());

const sessions = {};

io.on(`connection`, (socket) => {
  socket.on(`joinSession`, ({ sessionId, name }) => {
    socket.sessionId = sessionId; // Store the sessionId on the socket object

    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        admin: null,
        users: [],
      };
    }
    if (name === `Admin`) {
      sessions[sessionId].admin = socket.id;
    } else {
      const userExists = sessions[sessionId].users.some(user => user.name === name);
      if (!userExists) {
        sessions[sessionId].users.push({ id: socket.id, name });
      }
    }

    io.to(sessionId).emit(`updateUsers`, sessions[sessionId].users);
    console.log(`User ${name} joined session ${sessionId}`, sessions[sessionId]);
    socket.join(sessionId);
  });

  socket.on(`getUsers`, ({ sessionId }) => {
    console.log(`getUsers`, sessionId);
    if (!sessions[sessionId]) {
      return;
    }
    socket.join(sessionId);
    console.log(`updateUsers`, sessions[sessionId].users);
    io.to(sessionId).emit(`updateUsers`, sessions[sessionId].users);
  });

  socket.on(`setValue`, ({
    sessionId, 
    userId, 
    value,
  }) => {
    console.log(`userId: ${userId} set value ${value}`);

    sessions[sessionId].users.find(user => user.id === userId).value = value;

    io.to(sessionId).emit(`updateUsers`, sessions[sessionId].users);
  });

  socket.on(`showResults`, ({
    sessionId, 
  }) => {
    console.log(`showResultsServer`);
    io.to(sessionId).emit(`showResultsServer`, sessions[sessionId].users);
  });

  socket.on(`resetResults`, ({
    sessionId, 
  }) => {
    sessions[sessionId].users.forEach(user => {
      user.value = null;
    });
    console.log(`resetResultsServer`);
    io.to(sessionId).emit(`resetResultsServer`, sessions[sessionId].users);
  });

  socket.on(`disconnect`, () => {
    const sessionId = socket.sessionId; // Get the sessionId from the socket object
    if (sessionId && sessions[sessionId]) {
      const session = sessions[sessionId];
      if (socket.id === session.admin) {
        console.log(`Admin disconnected from session ${sessionId}`);
        // Optionally, you can handle admin disconnection differently if needed
      } else {
        const userIndex = session.users.findIndex(user => user.id === socket.id);
        if (userIndex !== -1) {
          const user = session.users.splice(userIndex, 1)[0];
          console.log(`User ${user.name} disconnected from session ${sessionId}`, sessions[sessionId]);
        }
      }
      io.to(sessionId).emit(`updateUsers`, sessions[sessionId].users);
    }
  });
});

server.listen(4000, () => {
  console.log(`Server is running on port 4000`);
});
