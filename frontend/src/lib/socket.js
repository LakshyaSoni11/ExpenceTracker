import { io } from 'socket.io-client';
import { TOKEN_KEY } from '@/api/axios';

const backendOrigin = () => {
  if (import.meta.env.VITE_API_URL) return new URL(import.meta.env.VITE_API_URL).origin;
  if (import.meta.env.DEV) return 'http://localhost:5000';
  return window.location.origin;
};

const socket = io(backendOrigin(), {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export const connectSocket = () => {
  if (socket.connected) return;
  socket.auth = { token: localStorage.getItem(TOKEN_KEY) };
  socket.connect();
};

export const disconnectSocket = () => {
  socket.removeAllListeners();
  socket.disconnect();
};

export default socket;