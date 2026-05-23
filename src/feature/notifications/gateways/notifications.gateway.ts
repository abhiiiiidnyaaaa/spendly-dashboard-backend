/**
 * NotificationsGateway
 *
 * WebSocket gateway using Socket.io.
 * Clients connect and join a room named after their userId.
 * The server pushes real-time notifications to specific user rooms.
 */

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, restrict this to your frontend domain
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Client sends their userId to join a personal room.
   * This way we can target notifications to specific users.
   */
  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, userId: string) {
    client.join(`user_${userId}`);
    this.logger.log(`Client ${client.id} joined room: user_${userId}`);
  }

  /**
   * Push a notification to a specific user's room
   */
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
    this.logger.log(`Notification sent to user_${userId}: ${event}`);
  }
}
