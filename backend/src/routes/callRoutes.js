import express from 'express';
import { protect } from '../middleware/auth.js';
import { getActiveCallRooms, getSocketIO } from '../socket/callSocket.js';
import User from '../models/User.js';
import AuthLog from '../models/AuthLog.js';

const router = express.Router();

// Get active call rooms and participants
router.get('/rooms', protect, (req, res) => {
  const rooms = getActiveCallRooms();
  res.json({
    success: true,
    rooms,
  });
});

// Get active/online users eligible for video calls
router.get('/active-users', protect, async (req, res, next) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Active users from AuthLog + User
    const [onlineUsers, activeLogs] = await Promise.all([
      User.find({
        $or: [
          { isOnline: true, lastActiveAt: { $gte: fiveMinutesAgo } },
          { lastActiveAt: { $gte: fiveMinutesAgo } },
        ],
      })
        .select('name email role title location isOnline lastActiveAt')
        .lean(),
      AuthLog.find({
        isLive: true,
        lastActiveAt: { $gte: fiveMinutesAgo },
      })
        .populate('userId', 'name email role title location')
        .lean(),
    ]);

    // Consolidate unique active users
    const userMap = new Map();

    onlineUsers.forEach((u) => {
      userMap.set(String(u._id), {
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        title: u.title || 'User',
        location: u.location || '',
        lastActiveAt: u.lastActiveAt,
        isOnline: true,
      });
    });

    activeLogs.forEach((log) => {
      if (log.userId && log.userId._id) {
        const u = log.userId;
        userMap.set(String(u._id), {
          id: u._id,
          name: u.name || log.name,
          email: u.email || log.email,
          role: u.role || log.role,
          title: u.title || 'User',
          location: u.location || '',
          lastActiveAt: log.lastActiveAt,
          isOnline: true,
        });
      }
    });

    // Also include caller themselves so they see themselves in the list if online
    if (req.user && !userMap.has(String(req.user.id))) {
      userMap.set(String(req.user.id), {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        title: req.user.title || 'User',
        location: req.user.location || '',
        lastActiveAt: new Date(),
        isOnline: true,
      });
    }

    const activeList = Array.from(userMap.values());

    res.json({
      success: true,
      count: activeList.length,
      users: activeList,
    });
  } catch (err) {
    next(err);
  }
});

// Send video call invitation
router.post('/invite', protect, async (req, res, next) => {
  try {
    const { targetUserId, roomId, inviteAll } = req.body;
    const io = getSocketIO();

    if (io) {
      if (inviteAll) {
        io.emit('call:incoming-invite', {
          roomId: roomId || 'active-users-room',
          callerName: req.user.name,
          callerRole: req.user.role,
          isBroadcast: true,
          timestamp: new Date().toISOString(),
        });
      } else if (targetUserId) {
        io.emit('call:incoming-invite', {
          targetUserId,
          roomId: roomId || 'active-users-room',
          callerName: req.user.name,
          callerRole: req.user.role,
          timestamp: new Date().toISOString(),
        });
      }
    }

    res.json({
      success: true,
      message: inviteAll
        ? 'Invitation sent to all active users'
        : 'Invitation sent to user',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
