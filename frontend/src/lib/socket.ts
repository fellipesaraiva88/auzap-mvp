import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const socket = io(API_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

export const connectSocket = (organizationId: string) => {
  socket.connect();
  socket.emit('join-organization', organizationId);
};

export const disconnectSocket = () => {
  socket.disconnect();
};
