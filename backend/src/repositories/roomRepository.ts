import prisma from '../lib/db.js';
import type { RoomWithData, RoomStatus } from '../types/models.js';

export const roomRepository = {
  async create(name: string, hostId: string): Promise<RoomWithData> {
    return prisma.room.create({
      data: {
        name,
        hostId,
      },
      include: {
        players: true,
        gameSessions: true,
      },
    });
  },

  async findById(id: string): Promise<RoomWithData | null> {
    return prisma.room.findUnique({
      where: { id },
      include: {
        players: true,
        gameSessions: true,
      },
    });
  },

  async findAll(): Promise<RoomWithData[]> {
    return prisma.room.findMany({
      include: {
        players: true,
        gameSessions: true,
      },
    });
  },

  async updateStatus(id: string, status: RoomStatus): Promise<RoomWithData> {
    return prisma.room.update({
      where: { id },
      data: { status },
      include: {
        players: true,
        gameSessions: true,
      },
    });
  },

  async updateHost(id: string, newHostId: string): Promise<RoomWithData> {
    return prisma.room.update({
      where: { id },
      data: { hostId: newHostId },
      include: {
        players: true,
        gameSessions: true,
      },
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.room.delete({
      where: { id },
    });
  },
};
