import { prisma } from './database';

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Seed function for development
export async function seedDatabase() {
  try {
    // Create a default user
    const defaultUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@example.com',
        displayName: 'Administrator',
        password: '$2a$10$dummy.hash.for.development', // This will be properly hashed in auth implementation
      },
    });

    // Create some default tags
    const tags = ['work', 'personal', 'urgent', 'meeting', 'project'];
    for (const tagName of tags) {
      await prisma.tag.upsert({
        where: { name: tagName },
        update: {},
        create: {
          name: tagName,
          color: getRandomColor(),
        },
      });
    }

    console.log('Database seeded successfully');
    return { user: defaultUser };
  } catch (error) {
    console.error('Database seeding failed:', error);
    throw error;
  }
}

function getRandomColor(): string {
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  return colors[Math.floor(Math.random() * colors.length)];
}