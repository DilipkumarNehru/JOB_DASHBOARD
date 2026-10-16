import { io } from 'socket.io-client';

let socket = null;

// Dynamically determine the correct socket server URL
export function getSocketServerUrl() {
  // 1. Explicit socket URL in environment
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  // 2. Full API URL in environment (e.g. 'https://api.domain.com/api' -> 'https://api.domain.com')
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
    return apiUrl.replace(/\/api\/?$/, '');
  }

  // 3. Browser environment
  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    // When running locally in dev, connect directly to backend port 5000
    if (isLocal) {
      return 'http://localhost:5000';
    }
    // LIVE DEPLOYMENT: Never connect to localhost from a live domain!
    // Connect to current origin (works with reverse proxies, Nginx, or single-origin deployments)
    return origin;
  }

  return 'http://localhost:5000';
}

export function getCallSocket() {
  if (!socket) {
    const serverUrl = getSocketServerUrl();
    console.log('[CallSocket] Connecting to server URL:', serverUrl);

    socket = io(serverUrl, {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      upgrade: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('[CallSocket] Connected successfully with ID:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[CallSocket] Connection error to', serverUrl, ':', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('[CallSocket] Disconnected:', reason);
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
