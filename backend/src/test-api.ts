import { checkDatabaseConnection } from './lib/db-utils';
import { UserRepository } from './repositories/userRepository';

async function testUserAPI() {
  console.log('Testing User API functionality...');
  
  // Check database connection
  const isConnected = await checkDatabaseConnection();
  if (!isConnected) {
    console.error('❌ Database connection failed');
    process.exit(1);
  }
  
  console.log('✅ Database connection successful');
  
  const userRepository = new UserRepository();
  
  try {
    // Test creating a user
    console.log('Testing user creation...');
    const testUser = {
      username: 'testuser_' + Date.now(),
      email: `test_${Date.now()}@example.com`,
      displayName: 'Test User',
      password: 'password123',
    };
    
    const createdUser = await userRepository.create(testUser);
    console.log('✅ User created:', createdUser.username);
    
    // Test finding user by ID
    const foundUser = await userRepository.findById(createdUser.id);
    console.log('✅ User found by ID:', foundUser?.username);
    
    // Test finding user by email
    const foundByEmail = await userRepository.findByEmail(createdUser.email);
    console.log('✅ User found by email:', foundByEmail?.username);
    
    // Test password verification
    const verifiedUser = await userRepository.verifyPassword(testUser.email, testUser.password);
    console.log('✅ Password verification:', verifiedUser ? 'Success' : 'Failed');
    
    // Test getting all users
    const allUsers = await userRepository.findAll();
    console.log('✅ Total users in database:', allUsers.length);
    
    // Clean up - delete test user
    await userRepository.delete(createdUser.id);
    console.log('✅ Test user cleaned up');
    
    console.log('🎉 All User API tests passed!');
    
  } catch (error) {
    console.error('❌ User API test failed:', error);
    process.exit(1);
  }
}

testUserAPI().catch((error) => {
  console.error('❌ API test failed:', error);
  process.exit(1);
});