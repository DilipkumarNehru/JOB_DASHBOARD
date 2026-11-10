import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext.jsx';
import { messageService } from '../services/index.js';
import { getCallSocket } from '../services/callSocket.js';

const DirectMessageContext = createContext(null);

// Soft notification sound synthesizer using Web Audio API (zero external assets needed)
function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (_) {
    // Audio context may be restricted by autoplay policy before gesture
  }
}

// Helper to strictly prevent duplicate messages in active chat
function appendMessageSafely(list, newMsg) {
  if (!newMsg) return list;
  const newId = String(newMsg._id || newMsg.id);
  if (list.some((m) => String(m._id || m.id) === newId)) {
    return list;
  }
  return [...list, newMsg];
}

export const DirectMessageProvider = ({ children }) => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeContact, setActiveContact] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());

  const activeContactRef = useRef(activeContact);
  useEffect(() => {
    activeContactRef.current = activeContact;
  }, [activeContact]);

  // ─── Fetch total unread count ───────────────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await messageService.getUnreadCount();
      if (res && typeof res.count === 'number') {
        setUnreadCount(res.count);
      }
    } catch (_) {}
  }, [token]);

  // ─── Fetch conversations list ──────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    setLoadingConversations(true);
    try {
      const res = await messageService.getConversations();
      if (res && res.conversations) {
        setConversations(res.conversations);
      }
    } catch (err) {
      console.warn('[DirectMessageContext] Error loading conversations:', err.message);
    } finally {
      setLoadingConversations(false);
    }
  }, [token]);

  // Initial load on authentication
  useEffect(() => {
    if (token && user) {
      fetchUnreadCount();
      fetchConversations();
    } else {
      setConversations([]);
      setUnreadCount(0);
      setActiveContact(null);
      setActiveMessages([]);
    }
  }, [token, user, fetchUnreadCount, fetchConversations]);

  // ─── Select a contact to chat with ─────────────────────────────────────────
  const selectContact = useCallback(
    async (contact) => {
      if (!contact) {
        setActiveContact(null);
        setActiveMessages([]);
        return;
      }

      setActiveContact(contact);
      setLoadingMessages(true);
      try {
        const res = await messageService.getMessages(contact.id || contact._id);
        if (res && res.messages) {
          setActiveMessages(res.messages);
        }
        if (res && res.partner) {
          setActiveContact((prev) => ({ ...prev, ...res.partner }));
        }

        // Clear unread count for this user in local state
        setConversations((prev) =>
          prev.map((c) =>
            String(c.id || c._id) === String(contact.id || contact._id)
              ? { ...c, unreadCount: 0 }
              : c
          )
        );
        fetchUnreadCount();
      } catch (err) {
        toast.error('Failed to load messages');
      } finally {
        setLoadingMessages(false);
      }
    },
    [fetchUnreadCount]
  );

  // ─── Open / Close Drawer ───────────────────────────────────────────────────
  const openDrawer = useCallback(
    (contact = null) => {
      setIsOpen(true);
      if (contact) {
        selectContact(contact);
      } else {
        fetchConversations();
      }
    },
    [selectContact, fetchConversations]
  );

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  // ─── Audio Call Modal Controls ─────────────────────────────────────────────
  const openAudioModal = useCallback(() => {
    setIsAudioModalOpen(true);
    fetchConversations();
  }, [fetchConversations]);

  const closeAudioModal = useCallback(() => {
    setIsAudioModalOpen(false);
  }, []);

  // ─── Send a direct message ─────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (content, callInvite = null) => {
      const partner = activeContactRef.current;
      if (!partner) return null;
      const partnerId = partner.id || partner._id;

      try {
        const socket = getCallSocket();
        const res = await messageService.sendMessage(partnerId, {
          content,
          callInvite,
          socketId: socket?.id,
        });

        if (res && res.message) {
          // Strictly deduplicate before appending to prevent double display
          setActiveMessages((prev) => appendMessageSafely(prev, res.message));

          // Update conversations list with latest message
          setConversations((prev) => {
            const partnerStr = String(partnerId);
            const idx = prev.findIndex((c) => String(c.id || c._id) === partnerStr);
            if (idx === -1) return prev;

            const updatedContact = {
              ...prev[idx],
              lastMessage: {
                id: res.message._id,
                content: res.message.content,
                sender: String(user?.id || user?._id),
                read: false,
                createdAt: res.message.createdAt,
                callInvite: res.message.callInvite,
              },
            };

            const next = [...prev];
            next.splice(idx, 1);
            return [updatedContact, ...next];
          });
          return res.message;
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to send message');
        return null;
      }
    },
    [user]
  );

  // ─── Start a 1-on-1 Video Call with the active contact ─────────────────────
  const startDirectCall = useCallback(
    async (contact = null) => {
      const target = contact || activeContactRef.current;
      if (!target) return;
      const targetId = target.id || target._id;
      const roomId = `call-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;

      const inviteData = {
        roomId,
        callType: 'video',
        status: 'pending',
      };

      try {
        const socket = getCallSocket();
        await messageService.sendMessage(targetId, {
          content: `🎥 Joined Video Call Room: ${roomId}`,
          callInvite: inviteData,
          socketId: socket?.id,
        });

        setIsOpen(false);
        setIsAudioModalOpen(false);
        toast.success(`Starting video call with ${target.name}…`);
        navigate(`/video-call?room=${encodeURIComponent(roomId)}&type=video&autoJoin=true`);
      } catch (err) {
        toast.error('Could not initiate video call');
      }
    },
    [navigate]
  );

  // ─── Start a 1-on-1 Audio Call with contact ────────────────────────────────
  const startDirectAudioCall = useCallback(
    async (contact = null) => {
      const target = contact || activeContactRef.current;
      if (!target) return;
      const targetId = target.id || target._id;
      const roomId = `audio-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;

      const inviteData = {
        roomId,
        callType: 'audio',
        status: 'pending',
      };

      try {
        const socket = getCallSocket();
        await messageService.sendMessage(targetId, {
          content: `📞 Joined Audio Call Room: ${roomId}`,
          callInvite: inviteData,
          socketId: socket?.id,
        });

        setIsOpen(false);
        setIsAudioModalOpen(false);
        toast.success(`Starting audio call with ${target.name}…`);
        navigate(`/video-call?room=${encodeURIComponent(roomId)}&type=audio&autoJoin=true`);
      } catch (err) {
        toast.error('Could not initiate audio call');
      }
    },
    [navigate]
  );

  // ─── Socket.IO Real-time listeners ─────────────────────────────────────────
  useEffect(() => {
    if (!token || !user) return;

    const socket = getCallSocket();
    if (!socket.connected) socket.connect();

    // 1. Online count & user list updates
    const handleOnlineCount = (data) => {
      if (data && Array.isArray(data.userIds)) {
        const idSet = new Set(data.userIds.map(String));
        setOnlineUserIds(idSet);

        // Update online flags across conversations list
        setConversations((prev) =>
          prev.map((c) => ({
            ...c,
            isOnline: idSet.has(String(c.id || c._id)),
          }))
        );

        if (activeContactRef.current) {
          const isPartnerOnline = idSet.has(String(activeContactRef.current.id || activeContactRef.current._id));
          setActiveContact((curr) => (curr ? { ...curr, isOnline: isPartnerOnline } : curr));
        }
      }
    };

    // 2. Incoming direct message
    const handleReceiveMessage = (msg) => {
      if (!msg) return;
      const senderId = String(msg.sender?._id || msg.sender?.id || msg.sender);
      const currentPartner = activeContactRef.current;
      const isChatOpenWithSender = currentPartner && String(currentPartner.id || currentPartner._id) === senderId;

      playNotificationChime();

      if (isChatOpenWithSender) {
        // Append directly with strict deduplication
        setActiveMessages((prev) => appendMessageSafely(prev, msg));
        // Mark as read immediately on server
        messageService.markRead(senderId).catch(() => {});
      } else {
        // Increment unread counter
        setUnreadCount((c) => c + 1);

        // Pop up interactive toast notification
        const senderName = msg.sender?.name || 'A Teammate';
        const isCallInvite = Boolean(msg.callInvite && msg.callInvite.roomId);
        const isAudioInvite = isCallInvite && msg.callInvite.callType === 'audio';

        toast.custom(
          (t) => (
            <div
              className={`max-w-md w-full bg-slate-900 border ${
                isAudioInvite
                  ? 'border-emerald-500/80 shadow-emerald-500/20'
                  : isCallInvite
                  ? 'border-indigo-500/80 shadow-indigo-500/20'
                  : 'border-slate-800'
              } shadow-2xl rounded-2xl p-4 flex items-start gap-3.5 transition-all text-white pointer-events-auto`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-white text-sm shadow-md ${
                  isAudioInvite
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                    : 'bg-gradient-to-tr from-indigo-600 to-violet-600'
                }`}
              >
                {senderName.slice(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h5 className={`text-xs font-black truncate ${isAudioInvite ? 'text-emerald-400' : 'text-indigo-300'}`}>
                    {senderName}
                  </h5>
                  <span className="text-[10px] text-slate-500">Just now</span>
                </div>
                <p className="text-xs text-slate-200 mt-1 line-clamp-2 leading-relaxed">
                  {msg.content}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  {isCallInvite ? (
                    <button
                      onClick={() => {
                        toast.dismiss(t.id);
                        navigate(`/video-call?room=${encodeURIComponent(msg.callInvite.roomId)}&type=${msg.callInvite.callType || 'video'}&autoJoin=true`);
                      }}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-black text-white hover:brightness-110 shadow-lg transition-all ${
                        isAudioInvite
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-600/30'
                          : 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-600/30'
                      }`}
                    >
                      {isAudioInvite ? '📞 Join Audio Call' : '🎥 Join Video Call'}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        toast.dismiss(t.id);
                        openDrawer({
                          id: senderId,
                          _id: senderId,
                          name: senderName,
                          role: msg.sender?.role || 'user',
                        });
                      }}
                      className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 text-xs font-black text-white shadow-md transition-all"
                    >
                      💬 Open Chat &amp; Reply
                    </button>
                  )}
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-all"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ),
          { duration: 7000, position: 'top-right' }
        );
      }

      // Update conversations list in real time
      setConversations((prev) => {
        const idx = prev.findIndex((c) => String(c.id || c._id) === senderId);
        if (idx === -1) {
          fetchConversations();
          return prev;
        }

        const updated = {
          ...prev[idx],
          unreadCount: isChatOpenWithSender ? 0 : (prev[idx].unreadCount || 0) + 1,
          lastMessage: {
            id: msg._id,
            content: msg.content,
            sender: senderId,
            read: isChatOpenWithSender,
            createdAt: msg.createdAt,
            callInvite: msg.callInvite,
          },
        };

        const next = [...prev];
        next.splice(idx, 1);
        return [updated, ...next];
      });
    };

    // 3. Sender echo sync across other tabs
    const handleSentMessage = (msg) => {
      if (!msg) return;
      const partnerId = String(msg.recipient?._id || msg.recipient?.id || msg.recipient);
      const currentPartner = activeContactRef.current;
      if (currentPartner && String(currentPartner.id || currentPartner._id) === partnerId) {
        setActiveMessages((prev) => appendMessageSafely(prev, msg));
      }
    };

    // 4. Partner read receipt
    const handleReadReceipt = ({ readByUserId }) => {
      const currentPartner = activeContactRef.current;
      if (currentPartner && String(currentPartner.id || currentPartner._id) === String(readByUserId)) {
        setActiveMessages((prev) =>
          prev.map((m) =>
            String(m.recipient?._id || m.recipient?.id || m.recipient) === String(readByUserId)
              ? { ...m, read: true }
              : m
          )
        );
      }
    };

    socket.on('users:online-count', handleOnlineCount);
    socket.on('direct-message:receive', handleReceiveMessage);
    socket.on('direct-message:sent', handleSentMessage);
    socket.on('direct-message:read', handleReadReceipt);

    return () => {
      socket.off('users:online-count', handleOnlineCount);
      socket.off('direct-message:receive', handleReceiveMessage);
      socket.off('direct-message:sent', handleSentMessage);
      socket.off('direct-message:read', handleReadReceipt);
    };
  }, [token, user, navigate, openDrawer, fetchConversations]);

  return (
    <DirectMessageContext.Provider
      value={{
        isOpen,
        openDrawer,
        closeDrawer,
        isAudioModalOpen,
        openAudioModal,
        closeAudioModal,
        conversations,
        unreadCount,
        activeContact,
        selectContact,
        activeMessages,
        loadingConversations,
        loadingMessages,
        sendMessage,
        startDirectCall,
        startDirectAudioCall,
        fetchConversations,
        fetchUnreadCount,
        onlineUserIds,
      }}
    >
      {children}
    </DirectMessageContext.Provider>
  );
};

export const useDirectMessages = () => {
  const context = useContext(DirectMessageContext);
  if (!context) {
    throw new Error('useDirectMessages must be used within a DirectMessageProvider');
  }
  return context;
};
