import Message from '../models/Message.js';
import User from '../models/User.js';
import { createNotification } from '../services/notificationService.js';
import { getSocketIO, isUserOnline, getSocketIdsForUser } from '../socket/callSocket.js';

// ─── Get all conversations / contacts with online/offline status ─────────────
export const getConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    // Fetch all active system users except current user
    const users = await User.find({
      _id: { $ne: currentUserId },
      status: { $ne: 'suspended' },
    })
      .select('name email role title location isOnline lastActiveAt')
      .lean();

    // Map each user with online status, unread count, and last message
    const conversations = await Promise.all(
      users.map(async (u) => {
        const uId = u._id;
        const online = isUserOnline(uId) || Boolean(u.isOnline && u.lastActiveAt && Date.now() - new Date(u.lastActiveAt).getTime() < 5 * 60 * 1000);

        const [unreadCount, lastMessage] = await Promise.all([
          Message.countDocuments({ sender: uId, recipient: currentUserId, read: false }),
          Message.findOne({
            $or: [
              { sender: currentUserId, recipient: uId },
              { sender: uId, recipient: currentUserId },
            ],
          })
            .sort({ createdAt: -1 })
            .lean(),
        ]);

        return {
          id: String(u._id),
          _id: String(u._id),
          name: u.name,
          email: u.email,
          role: u.role || 'user',
          title: u.title || 'User',
          location: u.location || '',
          lastActiveAt: u.lastActiveAt,
          isOnline: online,
          unreadCount,
          lastMessage: lastMessage
            ? {
                id: String(lastMessage._id),
                content: lastMessage.content,
                sender: String(lastMessage.sender),
                read: lastMessage.read,
                createdAt: lastMessage.createdAt,
                callInvite: lastMessage.callInvite,
              }
            : null,
        };
      })
    );

    // Sort: 1) users with recent messages by latest message timestamp, 2) online users, 3) offline users
    conversations.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    res.json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get message history with a specific user ────────────────────────────────
export const getMessages = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const partnerId = req.params.userId;

    const partner = await User.findById(partnerId)
      .select('name email role title location isOnline lastActiveAt')
      .lean();

    if (!partner) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: partnerId },
        { sender: partnerId, recipient: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(300)
      .populate('sender', 'name email role')
      .populate('recipient', 'name email role')
      .lean();

    // Mark unread messages sent by partner as read
    await Message.updateMany(
      { sender: partnerId, recipient: currentUserId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    // Inform partner via socket that their messages were read
    const io = getSocketIO();
    if (io) {
      const partnerSockets = getSocketIdsForUser(partnerId);
      partnerSockets.forEach((sId) => {
        io.to(sId).emit('direct-message:read', { readByUserId: currentUserId });
      });
    }

    const online = isUserOnline(partner._id) || Boolean(partner.isOnline && partner.lastActiveAt && Date.now() - new Date(partner.lastActiveAt).getTime() < 5 * 60 * 1000);

    res.json({
      success: true,
      partner: {
        id: String(partner._id),
        _id: String(partner._id),
        name: partner.name,
        email: partner.email,
        role: partner.role,
        title: partner.title || 'User',
        location: partner.location || '',
        lastActiveAt: partner.lastActiveAt,
        isOnline: online,
      },
      messages,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Send a direct peer-to-peer message ──────────────────────────────────────
export const sendMessage = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const partnerId = req.params.userId;
    const { content, callInvite } = req.body;

    if (!content && !callInvite) {
      return res.status(400).json({ success: false, message: 'Message content or call invite required' });
    }

    const recipient = await User.findById(partnerId).select('name email role');
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    const textContent = content || (callInvite ? `🎥 Video Call Invitation: Room ${callInvite.roomId}` : '');

    const message = await Message.create({
      sender: currentUserId,
      recipient: partnerId,
      content: textContent,
      callInvite: callInvite || undefined,
    });

    await message.populate('sender', 'name email role');
    await message.populate('recipient', 'name email role');

    // Real-time socket delivery
    const io = getSocketIO();
    if (io) {
      const recipientSockets = getSocketIdsForUser(partnerId);
      recipientSockets.forEach((sId) => {
        io.to(sId).emit('direct-message:receive', message);
      });

      // Sync message to sender's other open tabs/devices (excluding requesting socket if provided)
      const senderSockets = getSocketIdsForUser(currentUserId);
      const reqSocketId = req.headers['x-socket-id'] || req.body.socketId;
      senderSockets.forEach((sId) => {
        if (!reqSocketId || sId !== reqSocketId) {
          io.to(sId).emit('direct-message:sent', message);
        }
      });
    }

    // Persist system notification for recipient
    try {
      const isAudio = callInvite && callInvite.callType === 'audio';
      await createNotification(
        partnerId,
        callInvite ? (isAudio ? 'DIRECT_MESSAGE' : 'VIDEO_CALL_INVITE') : 'DIRECT_MESSAGE',
        callInvite
          ? `${isAudio ? '📞 Audio Call Invite' : '🎥 Video Call Invite'} from ${req.user.name}`
          : `💬 New message from ${req.user.name}`,
        message.content.length > 80 ? message.content.slice(0, 80) + '…' : message.content,
        callInvite
          ? `/video-call?room=${encodeURIComponent(callInvite.roomId)}&type=${callInvite.callType || 'video'}&autoJoin=true`
          : '/video-call',
        {
          senderId: currentUserId,
          senderName: req.user.name,
          messageId: message._id,
          callInvite,
        }
      );
    } catch (notifErr) {
      console.warn('[MessageController] Notification warning:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Mark all messages from a user as read ───────────────────────────────────
export const markConversationRead = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const partnerId = req.params.userId;

    await Message.updateMany(
      { sender: partnerId, recipient: currentUserId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    const io = getSocketIO();
    if (io) {
      const partnerSockets = getSocketIdsForUser(partnerId);
      partnerSockets.forEach((sId) => {
        io.to(sId).emit('direct-message:read', { readByUserId: currentUserId });
      });
    }

    res.json({ success: true, message: 'Conversation marked as read' });
  } catch (err) {
    next(err);
  }
};

// ─── Total unread direct messages count ──────────────────────────────────────
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.user.id,
      read: false,
    });

    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
};

