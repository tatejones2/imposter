import prisma from '../src/lib/db.js';

const categories = [
  {
    name: 'Animals',
    words: ['elephant', 'penguin', 'giraffe', 'dolphin', 'eagle'],
  },
  {
    name: 'Fruits',
    words: ['apple', 'banana', 'orange', 'strawberry', 'mango'],
  },
  {
    name: 'Countries',
    words: ['france', 'japan', 'brazil', 'canada', 'egypt'],
  },
  {
    name: 'Professions',
    words: ['doctor', 'teacher', 'engineer', 'chef', 'pilot'],
  },
  {
    name: 'Sports',
    words: ['tennis', 'basketball', 'swimming', 'soccer', 'golf'],
  },
];

async function seed(): Promise<void> {
  try {
    console.log('Seeding database...');

    // Clear existing data
    await prisma.word.deleteMany({});
    await prisma.category.deleteMany({});

    // Seed categories and words
    for (const cat of categories) {
      const category = await prisma.category.create({
        data: { name: cat.name },
      });

      for (const word of cat.words) {
        await prisma.word.create({
          data: {
            text: word,
            categoryId: category.id,
          },
        });
      }
    }

    console.log('Database seeded successfully!');
    await prisma.$disconnect();
    // eslint-disable-next-line @typescript-eslint/no-process-exit
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    await prisma.$disconnect();
    // eslint-disable-next-line @typescript-eslint/no-process-exit
    process.exit(1);
  }
}

seed();
