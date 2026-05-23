import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export const initializeSocket = (server: HttpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // In production, restrict this to allowed domains
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getSocketIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call initializeSocket first.');
  }
  return io;
};

export const emitLeadCreated = (lead: any) => {
  if (io) {
    io.emit('lead_created', lead);
  }
};

export const emitLeadAllocated = (lead: any) => {
  if (io) {
    io.emit('lead_allocated', lead);
  }
};

export const emitProviderUpdated = (provider: any) => {
  if (io) {
    io.emit('provider_updated', provider);
  }
};

export const emitDuplicateDetected = (data: { lead: any; originalLeadId: string; reason: string }) => {
  if (io) {
    io.emit('duplicate_detected', data);
  }
};

export const emitQuotaWarning = (data: { provider: any; utilizationPercent: number }) => {
  if (io) {
    io.emit('quota_warning', data);
  }
};
