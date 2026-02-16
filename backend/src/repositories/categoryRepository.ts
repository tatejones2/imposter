import prisma from '../lib/db.js';
import type { Category, Word } from '../types/models.js';

export const categoryRepository = {
  async create(name: string): Promise<Category> {
    return prisma.category.create({
      data: { name },
    });
  },

  async findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { id },
    });
  },

  async findAll(): Promise<Category[]> {
    return prisma.category.findMany();
  },

  async findByName(name: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { name },
    });
  },
};

export const wordRepository = {
  async create(text: string, categoryId: string): Promise<Word> {
    return prisma.word.create({
      data: {
        text,
        categoryId,
      },
    });
  },

  async findById(id: string): Promise<Word | null> {
    return prisma.word.findUnique({
      where: { id },
    });
  },

  async findByCategoryId(categoryId: string): Promise<Word[]> {
    return prisma.word.findMany({
      where: { categoryId },
    });
  },

  async findRandom(): Promise<Word | null> {
    const count = await prisma.word.count();
    if (count === 0) return null;

    const randomIndex = Math.floor(Math.random() * count);
    const words = await prisma.word.findMany({
      skip: randomIndex,
      take: 1,
    });

    return words[0] || null;
  },
};
