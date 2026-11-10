import { useState, useEffect, useRef } from 'react';
import {
  X, Send, Video, MessageSquare, Search, ArrowLeft, Crown,
  User, Check, CheckCheck, Sparkles, RefreshCw, Phone, PhoneCall, ExternalLink
} from 'lucide-react';
import { useDirectMessages } from '../../context/DirectMessageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function DirectMessagesDrawer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    isOpen,
    closeDrawer,
    conversations,
    activeContact,
    selectContact,
    activeMessages,
    loadingConversations,
    loadingMessages,
    sendMessage,
    startDirectCall,
    startDirectAudioCall,
    fetchConversations,
  } = useDirectMessages();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'online' | 'admins'
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (activeContact) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeMessages, activeContact]);

  if (!isOpen) return null;

  // Filter contacts by search and status
  const filteredContacts = conversations.filter((c) => {
    const matchesSearch =
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterMode === 'online') return c.isOnline;
    if (filterMode === 'admins') return c.role === 'admin';
    return true;
  });

  const onlineCount = conversations.filter((c) => c.isOnline).length;

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || sending) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);
    await sendMessage(text);
    setSending(false);
  };

  const handleSendVideoCallInvite = async () => {
    if (!activeContact || sending) return;
    const roomId = `call-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;

    setSending(true);
    await sendMessage(`🎥 Invited you to a Video Call: Room ${roomId}`, {
      roomId,
      callType: 'video',
      status: 'pending',
    });
    setSending(false);
  };

  const handleSendAudioCallInvite = async () => {
    if (!activeContact || sending) return;
    const roomId = `audio-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;

    setSending(true);
    await sendMessage(`📞 Invited you to an Audio Call: Room ${roomId}`, {
      roomId,
      callType: 'audio',
      status: 'pending',
    });
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      {/* Drawer Container */}
      <div className="w-full max-w-md h-full bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col justify-between text-white animate-slideInRight">
        {/* ─── HEADER ─── */}
        <div className="border-b border-slate-800/80 bg-slate-900/80 px-4 py-3.5 flex items-center justify-between gap-3">
          {activeContact ? (
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => selectContact(null)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
                title="Back to Contacts"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="relative shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 font-bold text-xs shadow-md">
                  {activeContact.name ? activeContact.name.slice(0, 2).toUpperCase() : 'U'}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-950 ${
                    activeContact.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'
                  }`}
                  title={activeContact.isOnline ? 'Online' : 'Offline'}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white truncate">{activeContact.name}</h4>
                  {activeContact.role === 'admin' && (
                    <span className="flex items-center gap-0.5 rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-400 border border-amber-500/30">
                      <Crown className="h-2.5 w-2.5" />
                      ADMIN
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 block truncate">
                  {activeContact.isOnline ? (
                    <span className="text-emerald-400 font-semibold">● Online now</span>
                  ) : activeContact.lastActiveAt ? (
                    `Active ${new Date(activeContact.lastActiveAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}`
                  ) : (
                    'Offline'
                  )}
                </span>
              </div>

              {/* 1-Click Calls in Chat Header: Audio & Video */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => startDirectAudioCall(activeContact)}
                  className="flex items-center gap-1 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white px-2.5 py-1.5 text-xs font-bold transition-all border border-emerald-500/40 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                  title="Start Instant Voice Call"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Audio</span>
                </button>

                <button
                  onClick={() => startDirectCall(activeContact)}
                  className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 px-2.5 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  title="Start Instant Video Call"
                >
                  <Video className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Video</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Direct Messages</h3>
                <p className="text-[10px] text-slate-400">Peer-to-peer chats &amp; live calls</p>
              </div>
            </div>
          )}

          <button
            onClick={closeDrawer}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ─── BODY ─── */}
        {!activeContact ? (
          /* ── CONTACTS LIST VIEW ── */
          <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teammates by name, email…"
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    filterMode === 'all'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({conversations.length})
                </button>
                <button
                  onClick={() => setFilterMode('online')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    filterMode === 'online'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-emerald-400'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Online ({onlineCount})</span>
                </button>
                <button
                  onClick={() => setFilterMode('admins')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    filterMode === 'admins'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-amber-400'
                  }`}
                >
                  Admins
                </button>
              </div>

              <button
                onClick={fetchConversations}
                disabled={loadingConversations}
                className="text-slate-500 hover:text-slate-300 p-1 rounded-lg transition-colors"
                title="Refresh contacts"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingConversations ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Contact list */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {loadingConversations ? (
                <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-indigo-500" />
                  <span className="text-xs">Loading teammates…</span>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-20 text-slate-500 text-xs">
                  No teammates found matching your criteria.
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={contact.id || contact._id}
                    onClick={() => selectContact(contact)}
                    className="group relative flex items-center gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-2.5 hover:bg-slate-800/70 hover:border-slate-700 transition-all cursor-pointer"
                  >
                    {/* Avatar with Live Status Dot */}
                    <div className="relative shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-800 to-indigo-900/60 text-white font-black text-xs border border-slate-700/60 group-hover:border-indigo-500/50 transition-colors">
                        {contact.name ? contact.name.slice(0, 2).toUpperCase() : 'U'}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-950 ${
                          contact.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'
                        }`}
                      />
                    </div>

                    {/* Contact Details & Last Message */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-xs font-bold text-white truncate">{contact.name}</span>
                          {contact.role === 'admin' && (
                            <span className="flex items-center gap-0.5 rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-400 shrink-0">
                              <Crown className="h-2.5 w-2.5" />
                              Admin
                            </span>
                          )}
                        </div>
                        {contact.lastMessage?.createdAt && (
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {new Date(contact.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 truncate">
                        {contact.lastMessage ? (
                          <span className={contact.unreadCount > 0 ? 'text-white font-semibold' : ''}>
                            {contact.lastMessage.content}
                          </span>
                        ) : (
                          <span className="italic text-slate-500">{contact.title || 'Team Member'}</span>
                        )}
                      </p>
                    </div>

                    {/* Unread Pill or Quick Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {contact.unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-black text-white shadow-md shadow-indigo-600/30">
                          {contact.unreadCount > 9 ? '9+' : contact.unreadCount}
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startDirectAudioCall(contact);
                        }}
                        className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all"
                        title="Start Audio Call"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startDirectCall(contact);
                        }}
                        className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all"
                        title="Start Video Call"
                      >
                        <Video className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* ── CONVERSATION CHAT VIEW ── */
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-indigo-500" />
                  <span className="text-xs">Loading conversation…</span>
                </div>
              ) : activeMessages.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 mx-auto mb-3">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">Start conversation with {activeContact.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                    Direct messages are private, real-time, and stored securely in the database.
                  </p>
                </div>
              ) : (
                activeMessages.map((m) => {
                  const isMine =
                    String(m.sender?._id || m.sender?.id || m.sender) === String(user?.id || user?._id);
                  const isCallInvite = Boolean(m.callInvite && m.callInvite.roomId);
                  const isAudioInvite = isCallInvite && m.callInvite.callType === 'audio';

                  return (
                    <div
                      key={m._id || m.id || Math.random()}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-md ${
                          isAudioInvite
                            ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/40 text-white'
                            : isCallInvite
                            ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 border border-indigo-500/40 text-white'
                            : isMine
                            ? 'bg-indigo-600 text-white rounded-br-xs'
                            : 'bg-slate-800/90 text-slate-100 rounded-bl-xs border border-slate-700/60'
                        }`}
                      >
                        {/* Call Invitation Banner */}
                        {isCallInvite ? (
                          <div className="space-y-2">
                            <div className={`flex items-center gap-2 font-bold ${isAudioInvite ? 'text-emerald-300' : 'text-indigo-300'}`}>
                              {isAudioInvite ? (
                                <PhoneCall className="h-4 w-4 text-emerald-400 animate-pulse" />
                              ) : (
                                <Video className="h-4 w-4 text-indigo-400 animate-pulse" />
                              )}
                              <span>{isAudioInvite ? 'Voice / Audio Call Invitation' : 'Live Video Call Invitation'}</span>
                            </div>
                            <p className="text-[11px] text-slate-300 font-mono bg-black/40 p-1.5 rounded-lg border border-slate-800">
                              Room: {m.callInvite.roomId}
                            </p>
                            <button
                              onClick={() => {
                                closeDrawer();
                                navigate(`/video-call?room=${encodeURIComponent(m.callInvite.roomId)}&type=${isAudioInvite ? 'audio' : 'video'}&autoJoin=true`);
                              }}
                              className={`w-full flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black text-white shadow-lg transition-all hover:scale-[1.01] ${
                                isAudioInvite
                                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/30'
                                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-indigo-600/30'
                              }`}
                            >
                              {isAudioInvite ? <Phone className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
                              <span>{isAudioInvite ? 'Join Audio Call Now' : 'Join Video Call Now'}</span>
                            </button>
                          </div>
                        ) : (
                          <p className="break-words">{m.content}</p>
                        )}

                        {/* Timestamp & Read Status */}
                        <div
                          className={`flex items-center gap-1 justify-end mt-1 text-[9px] ${
                            isMine ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                        >
                          <span>
                            {new Date(m.createdAt || Date.now()).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isMine && (
                            <span>{m.read ? <CheckCheck className="h-3 w-3 text-emerald-300 inline" /> : <Check className="h-3 w-3 opacity-60 inline" />}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Chat Input Footer ── */}
            <div className="p-3 border-t border-slate-800/80 bg-slate-900/90 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSendAudioCallInvite}
                    disabled={sending}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 px-2.5 py-1 rounded-lg transition-colors"
                    title="Send Voice Call Invitation Link"
                  >
                    <Phone className="h-3 w-3 text-emerald-400" />
                    <span>Audio Invite</span>
                  </button>

                  <button
                    onClick={handleSendVideoCallInvite}
                    disabled={sending}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 px-2.5 py-1 rounded-lg transition-colors"
                    title="Send Video Call Invitation Link"
                  >
                    <Video className="h-3 w-3 text-indigo-400" />
                    <span>Video Invite</span>
                  </button>
                </div>

                <span className="text-[10px] text-slate-500">Press Enter to send</span>
              </div>

              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Message ${activeContact.name}…`}
                  className="flex-1 rounded-xl border border-slate-700/80 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20 hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
