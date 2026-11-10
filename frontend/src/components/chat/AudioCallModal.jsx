import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Phone, PhoneCall, Users, Sparkles, Search, ShieldCheck, Crown
} from 'lucide-react';
import { useDirectMessages } from '../../context/DirectMessageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AudioCallModal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    isAudioModalOpen,
    closeAudioModal,
    conversations,
    startDirectAudioCall,
  } = useDirectMessages();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'online'

  if (!isAudioModalOpen) return null;

  const filteredContacts = conversations.filter((c) => {
    const matchesSearch =
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterMode === 'online') return c.isOnline;
    return true;
  });

  const onlineCount = conversations.filter((c) => c.isOnline).length;

  // Start instant team audio conference
  const handleStartGroupAudioCall = () => {
    const roomId = `audio-conf-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
    closeAudioModal();
    navigate(`/video-call?room=${encodeURIComponent(roomId)}&type=audio&autoJoin=true`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl text-white animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/30">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Instant Voice &amp; Audio Call</span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  Live
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Low-latency voice call with teammates or launch a team conference
              </p>
            </div>
          </div>

          <button
            onClick={closeAudioModal}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 1-Click Instant Conference Button */}
        <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                <Sparkles className="h-3 w-3" /> Voice Conference Room
              </span>
              <h4 className="text-sm font-bold text-white mt-0.5">Start Instant Audio Room</h4>
              <p className="text-xs text-slate-400">Mic-only room with active speaking indicators</p>
            </div>

            <button
              onClick={handleStartGroupAudioCall}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Start Voice Room</span>
            </button>
          </div>
        </div>

        {/* Teammates List */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Direct Voice Call ({onlineCount} online)
            </span>
            <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[10px] font-bold">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  filterMode === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterMode('online')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  filterMode === 'online' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Online ({onlineCount})
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, role, email…"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
            {filteredContacts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No teammates found matching your search.
              </div>
            ) : (
              filteredContacts.map((c) => {
                const contactId = c.id || c._id;
                const isCurrent = String(contactId) === String(user?.id || user?._id);
                if (isCurrent) return null;

                return (
                  <div
                    key={contactId}
                    className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/50 p-2.5 hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600/80 to-teal-600/80 text-white font-bold text-xs shadow-md">
                          {c.name ? c.name.slice(0, 2).toUpperCase() : 'U'}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950 ${
                            c.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">{c.name}</span>
                          {c.role === 'admin' && (
                            <span className="flex items-center gap-0.5 rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-400 border border-amber-500/30">
                              <Crown className="h-2 w-2" /> ADMIN
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {c.isOnline ? (
                            <span className="text-emerald-400 font-semibold">● Online now</span>
                          ) : (
                            c.title || 'Teammate'
                          )}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        closeAudioModal();
                        startDirectAudioCall(c);
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.03] active:scale-[0.97]"
                      title={`Start Voice Call with ${c.name}`}
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>Call</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Encrypted WebRTC Peer-to-Peer Audio</span>
          </div>
          <button
            onClick={closeAudioModal}
            className="text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

