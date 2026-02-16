import prisma from '../lib/db.js';
import type { Player, PlayerWithData } from '../types/models.js';

export const playerRepository = {
  async create(roomId: string, socketId: string, name: string): Promise<Player> {
    return prisma.player.create({
      data: {
        roomId,
        socketId,
        name,
      },
    });
  },

  async findById(id: string): Promise<PlayerWithData | null> {
    return prisma.player.findUnique({
      where: { id },
      include: {
        room: true,
        playerRoles: true,
        votes: true,
        scores: true,
      },
    });
  },

  async findBySocketId(socketId: string): Promise<Player | null> {
    return prisma.player.findFirst({
      where: { socketId },
    });
  },

  async findByRoomId(roomId: string): Promise<Player[]> {
    return prisma.player.findMany({
      where: { roomId },
    });
  },

  async updateName(id: string, name: string): Promise<Player> {
    return prisma.player.update({
      where: { id },
      data: { name },
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.player.delete({
      where: { id },
    });
  },

  async deleteByRoomId(roomId: string): Promise<void> {
    await prisma.player.deleteMany({
      where: { roomId },
    });
  },
};
