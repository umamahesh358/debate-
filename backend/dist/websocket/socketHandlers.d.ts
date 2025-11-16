import { Server as SocketIOServer, Socket } from 'socket.io';
interface AuthenticatedSocket extends Socket {
    userId?: string;
    user?: {
        id: string;
        email: string;
        username: string;
    };
}
export declare const socketHandlers: (io: SocketIOServer, socket: AuthenticatedSocket) => void;
export {};
//# sourceMappingURL=socketHandlers.d.ts.map