import { io } from 'socket.io-client';

let socket = null;

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

export function getCallSocket() {
  if (!socket) {
    socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    socket.on('connect_error', (err) => {
      console.warn('[CallSocket] Connection error:', err.message);
    });
  }

  return socket;
}

export function connectCallSocket(user) {
  const s = getCallSocket();
  if (!s.connected) {
    s.connect();
  }

  if (user) {
    s.emit('user:online', {
      id: user.id || user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  }

  return s;
}

export function disconnectCallSocket() {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}
