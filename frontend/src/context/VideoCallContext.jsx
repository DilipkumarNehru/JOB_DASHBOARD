import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext.jsx';
import { getCallSocket, connectCallSocket, disconnectCallSocket } from '../services/callSocket.js';
import { callService } from '../services/index.js';

const VideoCallContext = createContext(null);

export const VideoCallProvider = ({ children }) => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [incomingCall, setIncomingCall] = useState(null);
  const [onlineCount, setOnlineCount] = useState(1);
  const [activeRooms, setActiveRooms] = useState([]);

  // Connect socket on user authentication
  useEffect(() => {
    if (!token || !user) {
      disconnectCallSocket();
      return;
    }

    const socket = connectCallSocket(user);

    const handleIncomingInvite = (data) => {
      // Don't show invite if targeted to someone else
      if (data.targetUserId && String(data.targetUserId) !== String(user.id || user._id)) {
        return;
      }
      setIncomingCall(data);
    };

    const handleOnlineCount = (data) => {
      if (data && typeof data.count === 'number') {
        setOnlineCount(data.count);
      }
    };

    const handleRoomUpdated = (data) => {
      setActiveRooms((prev) => {
        const filtered = prev.filter((r) => r.roomId !== data.roomId);
        if (data.participantCount > 0) {
          return [...filtered, data];
        }
        return filtered;
      });
    };

    socket.on('call:incoming-invite', handleIncomingInvite);
    socket.on('users:online-count', handleOnlineCount);
    socket.on('call:room-updated', handleRoomUpdated);

    // Initial fetch of active rooms
    callService.getRooms()
      .then((res) => {
        if (res.rooms) setActiveRooms(res.rooms);
      })
      .catch(() => {});

    return () => {
      socket.off('call:incoming-invite', handleIncomingInvite);
      socket.off('users:online-count', handleOnlineCount);
      socket.off('call:room-updated', handleRoomUpdated);
    };
  }, [token, user]);

  const acceptCall = useCallback(() => {
    if (!incomingCall) return;
    const room = incomingCall.roomId || 'active-users-room';
    setIncomingCall(null);
    navigate(`/video-call?room=${encodeURIComponent(room)}`);
  }, [incomingCall, navigate]);

  const declineCall = useCallback(() => {
    setIncomingCall(null);
    toast('Call declined', { icon: '👋' });
  }, []);

  const inviteUser = useCallback(async (targetUserId, roomId = 'active-users-room') => {
    try {
      const socket = getCallSocket();
      socket.emit('call:invite-user', {
        targetUserId,
        roomId,
        callerName: user?.name || 'Team Member',
        callerRole: user?.role || 'user',
      });
      await callService.invite({ targetUserId, roomId });
      toast.success('Video call invitation sent');
    } catch (err) {
      toast.error('Failed to send invitation');
    }
  }, [user]);

  const inviteAllActive = useCallback(async (roomId = 'active-users-room') => {
    try {
      const socket = getCallSocket();
      socket.emit('call:invite-all-active', {
        roomId,
        callerName: user?.name || 'Team Member',
        callerRole: user?.role || 'admin',
      });
      await callService.invite({ inviteAll: true, roomId });
      toast.success('Broadcasting video call invite to all active users!');
    } catch (err) {
      toast.error('Failed to send broadcast invitation');
    }
  }, [user]);

  return (
    <VideoCallContext.Provider
      value={{
        incomingCall,
        acceptCall,
        declineCall,
        inviteUser,
        inviteAllActive,
        onlineCount,
        activeRooms,
      }}
    >
      {children}

      {/* Global Incoming Call Popup Alert */}
      {incomingCall && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
          <div className="flex w-96 flex-col rounded-3xl border border-indigo-200 bg-white p-5 shadow-2xl ring-4 ring-indigo-500/20 backdrop-blur-xl">
            <div className="flex items-center gap-3.5">
              <div className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/30">
                <span className="text-xl">📹</span>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  {incomingCall.isBroadcast ? '📢 Group Video Call' : '📞 Incoming Video Call'}
                </p>
                <h4 className="truncate text-base font-black text-slate-900">
                  {incomingCall.callerName || 'A Team Member'}
                </h4>
                <p className="truncate text-xs text-slate-500">
                  Inviting you to join room: <span className="font-semibold text-slate-700">{incomingCall.roomId}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={declineCall}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={acceptCall}
                className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Accept &amp; Join</span>
                <span className="text-sm">→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </VideoCallContext.Provider>
  );
};

export const useVideoCall = () => {
  const ctx = useContext(VideoCallContext);
  if (!ctx) {
    throw new Error('useVideoCall must be used within a VideoCallProvider');
  }
  return ctx;
};
