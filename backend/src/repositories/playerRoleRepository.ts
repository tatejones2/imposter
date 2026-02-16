import prisma from '../lib/db.js';
import type { PlayerRole, GameRole, PlayerRoleWithData } from '../types/models.js';

export const playerRoleRepository = {
  async create(gameSessionId: string, playerId: string, role: GameRole): Promise<PlayerRole> {
    return prisma.playerRole.create({
      data: {
        gameSessionId,
        playerId,
        role,
      },
    });
  },

  async findByGameSessionId(gameSessionId: string): Promise<PlayerRoleWithData[]> {
    return prisma.playerRole.findMany({
      where: { gameSessionId },
      include: {
        gameSession: true,
        player: true,
      },
    });
  },

  async findByPlayerAndSession(
    playerId: string,
    gameSessionId: string
  ): Promise<PlayerRoleWithData | null> {
    return prisma.playerRole.findUnique({
      where: {
        gameSessionId_playerId: {
          gameSessionId,
          playerId,
        },
      },
      include: {
        gameSession: true,
        player: true,
      },
    });
  },

  async updateGuessedWord(id: string, guessedWord: string): Promise<PlayerRole> {
    return prisma.playerRole.update({
      where: { id },
      data: { guessedWord },
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.playerRole.delete({
      where: { id },
    });
  },
};
