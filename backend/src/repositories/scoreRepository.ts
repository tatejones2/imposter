import prisma from '../lib/db.js';
import type { Score } from '../types/models.js';

export const scoreRepository = {
  async create(
    gameSessionId: string,
    playerId: string,
    points: number,
    roundNumber: number
  ): Promise<Score> {
    return prisma.score.create({
      data: {
        gameSessionId,
        playerId,
        points,
        roundNumber,
      },
    });
  },

  async findByGameSessionId(gameSessionId: string): Promise<Score[]> {
    return prisma.score.findMany({
      where: { gameSessionId },
    });
  },

  async findByPlayerAndRound(
    playerId: string,
    gameSessionId: string,
    roundNumber: number
  ): Promise<Score | null> {
    return prisma.score.findUnique({
      where: {
        gameSessionId_playerId_roundNumber: {
          gameSessionId,
          playerId,
          roundNumber,
        },
      },
    });
  },

  async updateScore(id: string, points: number): Promise<Score> {
    return prisma.score.update({
      where: { id },
      data: { points },
    });
  },

  async getTotalScoreByPlayer(gameSessionId: string, playerId: string): Promise<number> {
    const result = await prisma.score.aggregate({
      _sum: {
        points: true,
      },
      where: {
        gameSessionId,
        playerId,
      },
    });

    return result._sum.points || 0;
  },
};
