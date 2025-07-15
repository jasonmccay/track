import { checkDatabaseConnection, seedDatabase } from './lib/db-utils';
import { prisma } from './lib/database';

async function testDatabase() {
  console.log('Testing database connection...');
  
  const isConnected = await checkDatabaseConnection();
  if (!isConnected) {
    console.error('❌ Database connection failed');
    process.exit(1);
  }
  
  console.log('✅ Database connection successful');
  
  // Test seeding
  console.log('Seeding database...');
  await seedDatabase();
  
  // Test basic queries
  const userCount = await prisma.user.count();
  const tagCount = await prisma.tag.count();
  
  console.log(`📊 Database stats:`);
  console.log(`   Users: ${userCount}`);
  console.log(`   Tags: ${tagCount}`);
  
  await prisma.$disconnect();
  console.log('✅ Database test completed successfully');
}

testDatabase().catch((error) => {
  console.error('❌ Database test failed:', error);
  process.exit(1);
});