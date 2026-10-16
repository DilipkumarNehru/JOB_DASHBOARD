import { Server as SocketIOServer } from 'socket.io';
import User from '../models/User.js';
import AuthLog from '../models/AuthLog.js';

// In-memory registry of active video call rooms
// roomId -> Map(socketId -> participantData)
const rooms = new Map();

// socketId -> { userId, roomId, ... }
const socketToUser = new Map();

// userId -> Set of socketIds (for tracking online presence via sockets)
const onlineSocketUsers = new Map();

let ioInstance = null;

export function initCallSocket(server, corsOrigin) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: corsOrigin || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
  });

  ioInstance = io;

  io.on('connection', (socket) => {
    // 1. User declares online presence
    socket.on('user:online', (userData) => {
      if (!userData || !userData.id) return;
      const userId = String(userData.id);
      socketToUser.set(socket.id, { ...userData, socketId: socket.id });

      if (!onlineSocketUsers.has(userId)) {
        onlineSocketUsers.set(userId, new Set());
      }
      onlineSocketUsers.get(userId).add(socket.id);

      // Broadcast updated online count / list
      io.emit('users:online-count', {
        count: onlineSocketUsers.size,
        userIds: Array.from(onlineSocketUsers.keys()),
      });
    });

    // 2. Join a video call room
    socket.on('call:join-room', ({ roomId = 'active-users-room', user }) => {
      if (!roomId || !user) return;
      socket.join(roomId);

      const participant = {
        socketId: socket.id,
        userId: user.id || user._id,
        name: user.name || 'Anonymous',
        email: user.email || '',
        avatar: user.avatar || '',
        role: user.role || 'user',
        audioEnabled: user.audioEnabled !== false,
        videoEnabled: user.videoEnabled !== false,
        isScreenSharing: false,
        joinedAt: new Date().toISOString(),
      };

      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }

      const roomParticipants = rooms.get(roomId);

      // Get list of existing users to send to the newly joined user
      const existingUsers = Array.from(roomParticipants.values());

      // Save new user in the room
      roomParticipants.set(socket.id, participant);
      socketToUser.set(socket.id, { ...participant, roomId });

      // Send existing participants to the joining user
      socket.emit('call:all-users', {
        roomId,
        participants: existingUsers,
      });

      // Notify everyone else in the room that a new user joined
      socket.to(roomId).emit('call:user-joined', participant);

      // Notify all clients of updated room participants
      io.emit('call:room-updated', {
        roomId,
        participantCount: roomParticipants.size,
        participants: Array.from(roomParticipants.values()),
      });
    });

    // 3. WebRTC Signaling: Offer, Answer, ICE Candidate
    socket.on('call:signal', ({ to, signal, from }) => {
      if (!to || !signal) return;
      const sender = socketToUser.get(socket.id) || { socketId: socket.id };
      io.to(to).emit('call:signal', {
        from: socket.id,
        sender,
        signal,
      });
    });

    // 4. Media State Toggle (Mic, Camera, Screen Share)
    socket.on('call:toggle-media', ({ roomId, audioEnabled, videoEnabled, isScreenSharing }) => {
      if (!roomId || !rooms.has(roomId)) return;
      const room = rooms.get(roomId);
      const participant = room.get(socket.id);
      if (participant) {
        if (typeof audioEnabled === 'boolean') participant.audioEnabled = audioEnabled;
        if (typeof videoEnabled === 'boolean') participant.videoEnabled = videoEnabled;
        if (typeof isScreenSharing === 'boolean') participant.isScreenSharing = isScreenSharing;

        socket.to(roomId).emit('call:user-media-toggled', {
          socketId: socket.id,
          audioEnabled: participant.audioEnabled,
          videoEnabled: participant.videoEnabled,
          isScreenSharing: participant.isScreenSharing,
        });
      }
    });

    // 5. In-call Chat Message
    socket.on('call:chat-message', ({ roomId, message, user }) => {
      if (!roomId || !message) return;
      const chatPayload = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        roomId,
        sender: user || socketToUser.get(socket.id) || { name: 'User' },
        message,
        timestamp: new Date().toISOString(),
      };
      io.to(roomId).emit('call:chat-message', chatPayload);
    });

    // 6. Direct Invite or Group Call Invite to Active Users
    socket.on('call:invite-user', ({ targetUserId, roomId, callerName, callerRole }) => {
      const targetSockets = onlineSocketUsers.get(String(targetUserId));
      if (targetSockets) {
        targetSockets.forEach((sId) => {
          io.to(sId).emit('call:incoming-invite', {
            roomId: roomId || 'active-users-room',
            callerName: callerName || 'A Team Member',
            callerRole: callerRole || 'user',
            timestamp: new Date().toISOString(),
          });
        });
      }
    });

    // 7. Invite ALL Active Users to a group video call
    socket.on('call:invite-all-active', ({ roomId, callerName, callerRole }) => {
      // Broadcast invitation to all connected sockets except the sender
      socket.broadcast.emit('call:incoming-invite', {
        roomId: roomId || 'active-users-room',
        callerName: callerName || 'An Active Member',
        callerRole: callerRole || 'admin',
        isBroadcast: true,
        timestamp: new Date().toISOString(),
      });
    });

    // 8. Leave Video Room
    const handleLeaveRoom = (roomId) => {
      if (!roomId || !rooms.has(roomId)) return;
      const room = rooms.get(roomId);
      const participant = room.get(socket.id);
      room.delete(socket.id);
      socket.leave(roomId);

      if (participant) {
        socket.to(roomId).emit('call:user-left', {
          socketId: socket.id,
          userId: participant.userId,
          name: participant.name,
        });
      }

      if (room.size === 0) {
        rooms.delete(roomId);
      } else {
        io.emit('call:room-updated', {
          roomId,
          participantCount: room.size,
          participants: Array.from(room.values()),
        });
      }
    };

    socket.on('call:leave-room', ({ roomId }) => {
      handleLeaveRoom(roomId);
    });

    // 9. Disconnect cleanup
    socket.on('disconnect', () => {
      const userMeta = socketToUser.get(socket.id);
      if (userMeta) {
        // Remove from room if present
        if (userMeta.roomId) {
          handleLeaveRoom(userMeta.roomId);
        }

        // Remove from online user mapping
        const userId = String(userMeta.id || userMeta.userId);
        if (onlineSocketUsers.has(userId)) {
          const sSet = onlineSocketUsers.get(userId);
          sSet.delete(socket.id);
          if (sSet.size === 0) {
            onlineSocketUsers.delete(userId);
          }
        }
        socketToUser.delete(socket.id);
      }

      io.emit('users:online-count', {
        count: onlineSocketUsers.size,
        userIds: Array.from(onlineSocketUsers.keys()),
      });
    });
  });

  return io;
}

export function getActiveCallRooms() {
  const result = [];
  rooms.forEach((participantsMap, roomId) => {
    result.push({
      roomId,
      count: participantsMap.size,
      participants: Array.from(participantsMap.values()),
    });
  });
  return result;
}

export function getSocketIO() {
  return ioInstance;
}
