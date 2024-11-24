import express from 'express';
import http from 'http';
import { Server as SocketIoServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.ALLOWED_ORIGIN_LOCAL, 
  process.env.ALLOWED_ORIGIN_PRODUCTION
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS`));
    }
  },
  methods: [`GET`, `POST`],
  credentials: true
}));

const server = http.createServer(app);
const io = new SocketIoServer(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS`));
      }
    },
    methods: [`GET`, `POST`],
    credentials: true
  }
});

let sessions = {};
let disconnectTimeouts = {};

const clearSessions = () => {
  sessions = {}
};

const scheduleMidnightClear = () => {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);

  const timeToMidnight = midnight.getTime() - now.getTime();

  setTimeout(() => {
    clearSessions();
    setInterval(clearSessions, 24 * 60 * 60 * 1000);
  }, timeToMidnight);
};

scheduleMidnightClear();

io.on(`connection`, (socket) => {
  const setSessionId = (sessionId) => {
    socket.sessionId = sessionId;
  };

  socket.on(`register`, ({ sessionId, userId, role }) => {
    socket.userId = userId;
    setSessionId(sessionId);
    socket.role = role;

    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        admin: null,
        users: {
          FE: [],
          BE: [],
        },
      };
    }

    const session = sessions[sessionId];

    if (role === `admin`) {
      session.admin = socket.id;
    }

    socket.join(sessionId);

    if (disconnectTimeouts[userId]) {
      clearTimeout(disconnectTimeouts[userId]);
      delete disconnectTimeouts[userId];
    }

    io.to(sessionId).emit(`updateUsers`, sessions[sessionId].users);
  });

  socket.on(`createSession`, ({ sessionId }) => {
    setSessionId(sessionId);

    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        admin: null,
        users: {
          FE: [],
          BE: [],
        },
      };
    }
    socket.join(sessionId);

    io.to(sessionId).emit(`createSessionServer`, { sessionId });
  });

  socket.on(`getUsers`, ({ sessionId }) => {
    setSessionId(sessionId);
    socket.join(sessionId);

    if (!sessions[sessionId]) {
      io.to(sessionId).emit(`sessionExpiredServer`);
    } else {
      io.to(sessionId).emit(`updateUsers`, sessions[sessionId].users);
    }
  });

  socket.on(`joinSessionFE`, ({ sessionId, name, userId }) => {
    setSessionId(sessionId);

    if (!sessions[sessionId]) {
      return;
    }

    const session = sessions[sessionId];
    const userIndex = session.users.FE.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
      session.users.FE[userIndex].socketId = socket.id;
      session.users.FE[userIndex].name = name;
    } else {
      session.users.FE.push({ id: userId, socketId: socket.id, name });
      io.to(sessionId).emit(`joinSessionFeServer`, userId);
    }

    io.to(sessionId).emit(`updateUsers`, sessions[sessionId].users);
  });

  socket.on(`joinSessionBE`, ({ sessionId, name, userId }) => {
    setSessionId(sessionId);

    if (!sessions[sessionId]) {
      return;
    }

    const session = sessions[sessionId];
    const userIndex = session.users.BE.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
      session.users.BE[userIndex].socketId = socket.id;
      session.users.BE[userIndex].name = name;
    } else {
      session.users.BE.push({ id: userId, socketId: socket.id, name });
      io.to(sessionId).emit(`joinSessionBeServer`, userId);
    }

    io.to(sessionId).emit(`updateUsers`, sessions[sessionId].users);
  });

  socket.on(`setValueFE`, ({ sessionId, userId, value }) => {
    const session = sessions[sessionId];
    if (session) {
      const user = session.users.FE.find(user => user.id === userId);
      if (user) {
        user.value = value;
        io.to(sessionId).emit(`updateUsers`, sessions[sessionId].users);
      }
    }
  });

  socket.on(`setValueBE`, ({ sessionId, userId, value }) => {
    const session = sessions[sessionId];
    if (session) {
      const user = session.users.BE.find(user => user.id === userId);
      if (user) {
        user.value = value;
        io.to(sessionId).emit(`updateUsers`, sessions[sessionId].users);
      }
    }
  });

  socket.on(`showResultsFE`, ({ sessionId }) => {
    const session = sessions[sessionId];
    if (session) {
      io.to(sessionId).emit(`showResultsFEServer`, session.users);
    }
  });

  socket.on(`resetResultsFE`, ({ sessionId }) => {
    const session = sessions[sessionId];
    if (session) {
      session.users.FE.forEach(user => user.value = null);
      io.to(sessionId).emit(`resetResultsFEServer`, session.users);
    }
  });

  socket.on(`showResultsBE`, ({ sessionId }) => {
    const session = sessions[sessionId];
    if (session) {
      io.to(sessionId).emit(`showResultsBEServer`, session.users);
    }
  });

  socket.on(`resetResultsBE`, ({ sessionId }) => {
    const session = sessions[sessionId];
    if (session) {
      session.users.BE.forEach(user => user.value = null);
      io.to(sessionId).emit(`resetResultsBEServer`, session.users);
    }
  });

  socket.on(`removeUser`, ({ sessionId, userId }) => {
    if (sessions[sessionId]) {
      const session = sessions[sessionId];

      if (session.admin === socket.id) {
        let removed = false;

        [`FE`, `BE`].forEach(role => {
          const index = session.users[role].findIndex(user => user.id === userId);
          if (index !== -1) {
            session.users[role].splice(index, 1);
            removed = true;
          }
        });

        if (removed) {
          io.to(sessionId).emit(`updateUsers`, session.users);

          if (disconnectTimeouts[userId]) {
            clearTimeout(disconnectTimeouts[userId]);
            delete disconnectTimeouts[userId];
          }
        } else {
          socket.emit(`error`, { message: `User not found in any group` });
        }
      } else {
        socket.emit(`error`, { message: `Only admin can remove users` });
      }
    } else {
      socket.emit(`error`, { message: `Session not found` });
    }
  });

  socket.on(`leaveSession`, ({ sessionId, userId }) => {
    if (sessions[sessionId]) {
      const session = sessions[sessionId];
      
      [`FE`, `BE`].forEach(role => {
        const index = session.users[role].findIndex(user => user.id === userId);
        if (index !== -1) {
          session.users[role].splice(index, 1);
        }
      });

      io.to(sessionId).emit(`updateUsers`, sessions[sessionId].users);
      
      if (disconnectTimeouts[userId]) {
        clearTimeout(disconnectTimeouts[userId]);
        delete disconnectTimeouts[userId];
      }
    }
  });

  socket.on(`triggerSnow`, ({ sessionId }) => {
    if (sessionId && sessions[sessionId]) {
      io.to(sessionId).emit(`snowEffect`);
      console.log(`Snow effect triggered in session ${sessionId}`);
    }
  });

  socket.on(`disconnect`, () => {
    const sessionId = socket.sessionId;
    const userId = socket.userId;

    if (sessionId && sessions[sessionId]) {
      const session = sessions[sessionId];

      if (socket.id !== session.admin && userId) {
        disconnectTimeouts[userId] = setTimeout(() => {
          [`FE`, `BE`].forEach(role => {
            const index = session.users[role].findIndex(user => user.id === userId);
            if (index !== -1) {
              session.users[role].splice(index, 1);
            }
          });

          io.to(sessionId).emit(`updateUsers`, session.users);
          delete disconnectTimeouts[userId];
        }, 7200000); // 2 hours
      }
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
