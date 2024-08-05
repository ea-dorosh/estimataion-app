import express from 'express';
import http from 'http';
import { Server as SocketIoServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

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
  console.log(`New connection: ${socket.id}`);

  const setSessionId = (sessionId) => {
    socket.sessionId = sessionId;
    console.log(`Session ID ${sessionId} set for socket ${socket.id}`);
  };

  socket.on(`createSession`, ({ sessionId }) => {
    setSessionId(sessionId);

    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        admin: socket.id,
        users: {
          FE: [],
          BE: [],
        },
      };
    }
    socket.join(sessionId);

    io.to(sessionId).emit(`createSessionServer`, {
      session: sessions[sessionId],
      sessionId,
    });

    console.log(`Session ${sessionId} has been created`, sessions[sessionId]);
  });

  socket.on(`joinSessionFE`, ({ sessionId, name }) => {
    setSessionId(sessionId);

    if (!sessions[sessionId]) {
      return;
    }

    const userExists = sessions[sessionId].users.FE.some(user => user.name === name);
    if (!userExists) {
      sessions[sessionId].users.FE.push({ id: socket.id, name });
    }

    io.to(sessionId).emit(`updateUsers`, sessions[sessionId].users);
    socket.join(sessionId);

    console.log(`User ${name} joined FE session ${sessionId}`, sessions[sessionId]);
  });

  socket.on(`joinSessionBE`, ({ sessionId, name }) => {
    setSessionId(sessionId);

    if (!sessions[sessionId]) {
      return;
    }

    const userExists = sessions[sessionId].users.BE.some(user => user.name === name);
    if (!userExists) {
      sessions[sessionId].users.BE.push({ id: socket.id, name });
    }

    io.to(sessionId).emit(`updateUsers`, sessions[sessionId].users);
    socket.join(sessionId);

    console.log(`User ${name} joined BE session ${sessionId}`, sessions[sessionId]);
  });

  socket.on(`getUsers`, ({ sessionId }) => {
    setSessionId(sessionId);

    if (!sessions[sessionId]) {
      return;
    }
    socket.join(sessionId);

    io.to(sessionId).emit(`updateUsers`, sessions[sessionId].users);
  });

  socket.on(`setValueFE`, ({ sessionId, userId, value }) => {
    const user = sessions[sessionId].users.FE.find(user => user.id === userId);
    if (user) {
      user.value = value;
      io.to(sessionId).emit(`updateUsers`, sessions[sessionId].users);
    }
  });

  socket.on(`setValueBE`, ({ sessionId, userId, value }) => {
    const user = sessions[sessionId].users.BE.find(user => user.id === userId);
    if (user) {
      user.value = value;
      io.to(sessionId).emit(`updateUsers`, sessions[sessionId].users);
    }
  });

  socket.on(`showResultsFE`, ({ sessionId }) => {
    io.to(sessionId).emit(`showResultsFEServer`, sessions[sessionId].users);
  });

  socket.on(`resetResultsFE`, ({ sessionId }) => {
    if (sessions[sessionId]) {
      sessions[sessionId].users.FE.forEach(user => user.value = null);
      io.to(sessionId).emit(`resetResultsFEServer`, sessions[sessionId].users);
    }
  });

  socket.on(`showResultsBE`, ({ sessionId }) => {
    io.to(sessionId).emit(`showResultsBEServer`, sessions[sessionId].users);
  });

  socket.on(`resetResultsBE`, ({ sessionId }) => {
    if (sessions[sessionId]) {
      sessions[sessionId].users.BE.forEach(user => user.value = null);
      io.to(sessionId).emit(`resetResultsBEServer`, sessions[sessionId].users);
    }
  });

  socket.on(`disconnect`, () => {
    const sessionId = socket.sessionId; // Get the sessionId from the socket object

    if (sessionId && sessions[sessionId]) {
      const session = sessions[sessionId];

      if (socket.id === session.admin) {
        console.log(`Admin disconnected from session ${sessionId}`);
      } else {
        const userIndexFE = session.users.FE.findIndex(user => user.id === socket.id);

        if (userIndexFE !== -1) {
          session.users.FE.splice(userIndexFE, 1)[0];
        }

        const userIndexBE = session.users.BE.findIndex(user => user.id === socket.id);

        if (userIndexBE !== -1) {
          session.users.BE.splice(userIndexBE, 1)[0];
        }
      }

      io.to(sessionId).emit(`updateUsers`, sessions[sessionId].users);
    } else {
      console.log(`No session ID found for socket ${socket.id}`);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
