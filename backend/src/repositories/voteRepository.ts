import prisma from '../lib/db.js';
import type { Vote } from '../types/models.js';

export const voteRepository = {
  async create(gameSessionId: string, voterId: string, votedForId: string): Promise<Vote> {
    return prisma.vote.create({
      data: {
        gameSessionId,
        voterId,
        votedForId,
      },
    });
  },

  async findByGameSessionId(gameSessionId: string): Promise<Vote[]> {
    return prisma.vote.findMany({
      where: { gameSessionId },
    });
  },

  async findByVoter(gameSessionId: string, voterId: string): Promise<Vote | null> {
    return prisma.vote.findUnique({
      where: {
        gameSessionId_voterId: {
          gameSessionId,
          voterId,
        },
      },
    });
  },

  async deleteByGameSession(gameSessionId: string): Promise<void> {
    await prisma.vote.deleteMany({
      where: { gameSessionId },
    });
  },

  async countVotesForPlayer(gameSessionId: string, votedForId: string): Promise<number> {
    return prisma.vote.count({
      where: {
        gameSessionId,
        votedForId,
      },
    });
  },
};
