import prisma from '../lib/db.js';
import type { GameSession, GameSessionWithData, GamePhase } from '../types/models.js';

export const gameSessionRepository = {
  async create(roomId: string, wordId: string): Promise<GameSession> {
    return prisma.gameSession.create({
      data: {
        roomId,
        wordId,
      },
    });
  },

  async findById(id: string): Promise<GameSessionWithData | null> {
    return prisma.gameSession.findUnique({
      where: { id },
      include: {
        room: true,
        word: true,
        playerRoles: true,
        votes: true,
        scores: true,
      },
    });
  },

  async findByRoomId(roomId: string): Promise<GameSessionWithData | null> {
    return prisma.gameSession.findFirst({
      where: { roomId },
      include: {
        room: true,
        word: true,
        playerRoles: true,
        votes: true,
        scores: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async updatePhase(id: string, phase: GamePhase): Promise<GameSession> {
    return prisma.gameSession.update({
      where: { id },
      data: { currentPhase: phase },
    });
  },

  async incrementRound(id: string): Promise<GameSession> {
    return prisma.gameSession.update({
      where: { id },
      data: { round: { increment: 1 } },
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.gameSession.delete({
      where: { id },
    });
  },
};
